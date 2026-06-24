// ==========================================================================
// 성주대재보존회 - pogyo.js
// 포교소식 게시판: Decap CMS(admin)에서 작성한 글을 목록/상세 페이지에 표시
//
// 동작 원리
// ---------
// 1) 관리자가 /admin 에서 "포교소식" 글을 쓰면, GitHub 저장소의
//    data/pogyo/ 폴더 안에 마크다운 파일(.md, 상단에 --- 로 감싼
//    frontmatter 포함)로 저장됩니다.
// 2) 이 사이트는 빌드 과정이 없는 순수 정적 사이트라서, 브라우저에서
//    직접 GitHub API로 "그 폴더에 어떤 파일들이 있는지" 물어보고,
//    각 파일의 실제 내용은 raw.githubusercontent.com 에서 가져옵니다.
// 3) 저장소가 Public이기 때문에 별도 로그인 없이 누구나 읽을 수 있습니다.
//    (글쓰기는 /admin 로그인을 거쳐야만 가능 — 읽기와 쓰기 권한은 분리되어 있습니다)
//
// 참고: GitHub API는 비로그인 상태에서 분당 60회 호출까지 허용됩니다.
// 방문자가 매우 많아질 경우를 대비해, 목록은 5분간 브라우저에 캐시됩니다.
// ==========================================================================

(function () {
  var GITHUB_OWNER = 'seongjudaejae-maker';
  var GITHUB_REPO = 'seongju-daejae';
  var GITHUB_BRANCH = 'main';
  var DATA_FOLDER = 'data/pogyo';

  var API_LIST_URL =
    'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO +
    '/contents/' + DATA_FOLDER + '?ref=' + GITHUB_BRANCH;

  var RAW_BASE_URL =
    'https://raw.githubusercontent.com/' + GITHUB_OWNER + '/' + GITHUB_REPO +
    '/' + GITHUB_BRANCH + '/';

  var CACHE_KEY = 'pogyo-list-cache-v1';
  var CACHE_TTL_MS = 5 * 60 * 1000; // 5분

  // ------------------------------------------------------------------------
  // Frontmatter 파서
  // 형식 예시:
  // ---
  // title: 2026년 신도교육 일정 안내
  // date: 2026-03-02T00:00:00.000Z
  // image: /images/sample.jpg
  // ---
  // 본문 내용...
  // ------------------------------------------------------------------------
  function parseFrontmatter(raw) {
    var match = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/.exec(raw);
    if (!match) {
      return { meta: {}, body: raw.trim() };
    }
    var rawMeta = match[1];
    var body = match[2].trim();
    var meta = {};

    rawMeta.split('\n').forEach(function (line) {
      var idx = line.indexOf(':');
      if (idx === -1) return;
      var key = line.slice(0, idx).trim();
      var value = line.slice(idx + 1).trim();
      // 양 끝의 따옴표 제거 (' 또는 ")
      if (
        (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') ||
        (value.charAt(0) === "'" && value.charAt(value.length - 1) === "'")
      ) {
        value = value.slice(1, -1);
      }
      meta[key] = value;
    });

    return { meta: meta, body: body };
  }

  // 마크다운 본문을 아주 단순하게 HTML로 변환 (줄바꿈 → <p>, 빈줄 기준 문단 구분)
  // CMS의 "본문" 필드는 일반 텍스트 위주로 작성되므로 복잡한 마크다운 변환은 하지 않습니다.
  function simpleMarkdownToHtml(md) {
    var escaped = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    var paragraphs = escaped.split(/\n\s*\n/);
    return paragraphs
      .map(function (p) {
        return '<p>' + p.trim().replace(/\n/g, '<br>') + '</p>';
      })
      .join('\n');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '.' + m + '.' + day;
  }

  // slug(파일명, 확장자 제외)를 안전하게 URL에 쓰기 위한 처리
  function toSlug(filename) {
    return filename.replace(/\.md$/i, '');
  }

  function resolveImagePath(imagePath) {
    if (!imagePath) return '';
    // config.yml의 public_folder가 "/images" 이므로 그 경로 그대로 raw 주소로 변환
    if (imagePath.indexOf('/images/') === 0) {
      return RAW_BASE_URL + 'images/' + imagePath.slice('/images/'.length);
    }
    if (imagePath.indexOf('images/') === 0) {
      return RAW_BASE_URL + imagePath;
    }
    // 이미 완전한 URL인 경우
    if (/^https?:\/\//.test(imagePath)) {
      return imagePath;
    }
    return RAW_BASE_URL + imagePath.replace(/^\//, '');
  }

  // ------------------------------------------------------------------------
  // 목록 가져오기 (캐시 우선)
  // ------------------------------------------------------------------------
  function readCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
      return parsed.items;
    } catch (e) {
      return null;
    }
  }

  function writeCache(items) {
    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ savedAt: Date.now(), items: items })
      );
    } catch (e) {
      // 저장 실패는 무시 (예: 시크릿 모드 용량 제한)
    }
  }

  // data/pogyo 폴더의 파일 목록 + 각 파일의 frontmatter를 가져와
  // [{ slug, title, date, image, body }, ...] 형태로 반환 (날짜 내림차순)
  function fetchPogyoList() {
    var cached = readCache();
    if (cached) {
      return Promise.resolve(cached);
    }

    return fetch(API_LIST_URL, {
      headers: { Accept: 'application/vnd.github.v3+json' }
    })
      .then(function (res) {
        if (res.status === 404) {
          // data/pogyo 폴더가 아직 없는 경우 (글이 한 건도 없을 때)
          return [];
        }
        if (!res.ok) {
          throw new Error('GITHUB_API_ERROR_' + res.status);
        }
        return res.json();
      })
      .then(function (files) {
        var mdFiles = (files || []).filter(function (f) {
          return f.type === 'file' && /\.md$/i.test(f.name);
        });

        var fetches = mdFiles.map(function (f) {
          var rawUrl = RAW_BASE_URL + DATA_FOLDER + '/' + f.name;
          return fetch(rawUrl)
            .then(function (res) {
              if (!res.ok) return null;
              return res.text();
            })
            .then(function (text) {
              if (!text) return null;
              var parsed = parseFrontmatter(text);
              return {
                slug: toSlug(f.name),
                title: parsed.meta.title || '(제목 없음)',
                date: parsed.meta.date || '',
                image: parsed.meta.image || '',
                body: parsed.body
              };
            })
            .catch(function () {
              return null;
            });
        });

        return Promise.all(fetches);
      })
      .then(function (items) {
        var valid = items.filter(Boolean);
        valid.sort(function (a, b) {
          var dateA = new Date(a.date).getTime() || 0;
          var dateB = new Date(b.date).getTime() || 0;
          return dateB - dateA;
        });
        writeCache(valid);
        return valid;
      });
  }

  function fetchPogyoItemBySlug(slug) {
    // 캐시에 있으면 캐시에서 바로 찾기 (네트워크 호출 절약)
    var cached = readCache();
    if (cached) {
      var found = cached.filter(function (item) {
        return item.slug === slug;
      })[0];
      if (found) return Promise.resolve(found);
    }

    var rawUrl = RAW_BASE_URL + DATA_FOLDER + '/' + slug + '.md';
    return fetch(rawUrl).then(function (res) {
      if (!res.ok) return null;
      return res.text().then(function (text) {
        var parsed = parseFrontmatter(text);
        return {
          slug: slug,
          title: parsed.meta.title || '(제목 없음)',
          date: parsed.meta.date || '',
          image: parsed.meta.image || '',
          body: parsed.body
        };
      });
    });
  }

  // ------------------------------------------------------------------------
  // 목록 페이지 렌더링 (pogyo-sosik.html)
  // ------------------------------------------------------------------------
  function renderList() {
    var listEl = document.getElementById('pogyo-list');
    if (!listEl) return;

    listEl.innerHTML =
      '<li class="pogyo-state-msg">소식을 불러오는 중입니다…</li>';

    fetchPogyoList()
      .then(function (items) {
        if (!items.length) {
          listEl.innerHTML =
            '<li class="pogyo-state-msg">등록된 포교소식이 아직 없습니다.</li>';
          return;
        }

        listEl.innerHTML = items
          .map(function (item) {
            return (
              '<li>' +
              '<a href="pogyo-detail.html?slug=' +
              encodeURIComponent(item.slug) +
              '">' +
              escapeHtml(item.title) +
              '</a>' +
              '<span class="n-date">' +
              formatDate(item.date) +
              '</span>' +
              '</li>'
            );
          })
          .join('');
      })
      .catch(function (err) {
        console.error('포교소식 목록을 불러오지 못했습니다:', err);
        listEl.innerHTML =
          '<li class="pogyo-state-msg">소식을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</li>';
      });
  }

  // ------------------------------------------------------------------------
  // 상세 페이지 렌더링 (pogyo-detail.html)
  // ------------------------------------------------------------------------
  function renderDetail() {
    var root = document.getElementById('pogyo-detail-root');
    if (!root) return;

    var params = new URLSearchParams(window.location.search);
    var slug = params.get('slug');

    if (!slug) {
      root.innerHTML = notFoundMarkup();
      return;
    }

    root.innerHTML = '<p class="pogyo-state-msg">글을 불러오는 중입니다…</p>';

    fetchPogyoItemBySlug(slug)
      .then(function (item) {
        if (!item) {
          root.innerHTML = notFoundMarkup();
          return;
        }

        document.title = item.title + ' | 포교소식 | 대한불교밀인종';

        var titleEl = document.getElementById('pogyo-detail-title');
        if (titleEl) titleEl.textContent = item.title;

        var imageHtml = '';
        if (item.image) {
          var imgUrl = resolveImagePath(item.image);
          imageHtml =
            '<img src="' + imgUrl + '" alt="' + escapeHtml(item.title) +
            '" style="width:100%; border-radius:6px; margin-bottom: var(--space-4);" ' +
            'onerror="this.style.display=\'none\'">';
        }

        root.innerHTML =
          '<p style="color:var(--stone); font-size:0.9rem; margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--line);">' +
          formatDate(item.date) +
          ' &nbsp;·&nbsp; 포교소식</p>' +
          imageHtml +
          simpleMarkdownToHtml(item.body) +
          '<div style="margin-top: var(--space-5);">' +
          '<a href="pogyo-sosik.html" class="btn btn-primary">목록으로 돌아가기</a>' +
          '</div>';
      })
      .catch(function (err) {
        console.error('포교소식 글을 불러오지 못했습니다:', err);
        root.innerHTML =
          '<p class="pogyo-state-msg">글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>';
      });
  }

  function notFoundMarkup() {
    return (
      '<p class="pogyo-state-msg">요청하신 글을 찾을 수 없습니다.</p>' +
      '<div style="margin-top: var(--space-4);">' +
      '<a href="pogyo-sosik.html" class="btn btn-primary">목록으로 돌아가기</a>' +
      '</div>'
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderList();
    renderDetail();
  });
})();
