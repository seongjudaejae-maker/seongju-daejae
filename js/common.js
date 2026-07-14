// ==========================================================================
// 성주대재보존회 - common.js
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {
  // Header scroll state
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 12) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ==========================================================================
  // 모바일 메뉴 드로어 (왼쪽에서 슬라이드)
  // --------------------------------------------------------------------------
  // 데스크톱용 .main-nav 마크업을 그대로 읽어서, 모바일 전용 2단 드로어를
  // 자동으로 만들어 붙인다. (왼쪽 = 대메뉴 / 오른쪽 = 선택한 대메뉴의 소메뉴)
  // 이렇게 하면 21개 페이지의 HTML을 건드리지 않고도 모든 페이지에 적용된다.
  // ==========================================================================
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  var scrollLockY = 0;
  var drawer = null;
  var backdrop = null;

  function lockBodyScroll() {
    scrollLockY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollLockY + 'px';
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  }

  function unlockBodyScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    // position:fixed를 막 해제한 시점에는 브라우저가 아직 문서 전체 높이를
    // 다시 계산하기 전이라, 그 직후 바로 scrollTo를 호출하면 스크롤 가능한
    // 최대 범위가 일시적으로 짧게 잡혀 목표 위치보다 못 미쳐 멈추는 경우가
    // 있었다. 한 프레임 뒤로 미뤄 레이아웃이 다시 계산된 후 이동시킨다.
    window.requestAnimationFrame(function () {
      window.scrollTo({ top: scrollLockY, left: 0, behavior: 'instant' });
    });
  }

  function buildDrawer() {
    if (drawer || !nav) return;

    backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';

    drawer = document.createElement('nav');
    drawer.className = 'mobile-drawer';
    drawer.setAttribute('aria-label', '모바일 메뉴');

    // ---- 상단 인사말 ----
    var head = document.createElement('div');
    head.className = 'drawer-head';
    head.innerHTML =
      '<p class="drawer-greeting">대한불교밀인종</p>' +
      '<p class="drawer-sub">밀인(密因)의 법풍을 오늘에 잇습니다.</p>' +
      '<button type="button" class="drawer-close" aria-label="메뉴 닫기">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
          '<path d="M6 6L18 18M18 6L6 18"/>' +
        '</svg>' +
      '</button>';

    var body = document.createElement('div');
    body.className = 'drawer-body';

    var mainCol = document.createElement('div');
    mainCol.className = 'drawer-main';
    var subCol = document.createElement('div');
    subCol.className = 'drawer-sub-panel';

    var topItems = nav.querySelectorAll(':scope > li');
    var tabs = [];
    var panels = [];

    topItems.forEach(function (li, i) {
      var topLink = li.querySelector(':scope > a');
      if (!topLink) return;

      // 왼쪽 대메뉴 버튼
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = topLink.textContent.trim();
      mainCol.appendChild(btn);
      tabs.push(btn);

      // 오른쪽 소메뉴 패널
      var ul = document.createElement('ul');
      var subNav = li.querySelector('.sub-nav');
      if (subNav) {
        subNav.querySelectorAll('a').forEach(function (a) {
          var item = document.createElement('li');
          var link = document.createElement('a');
          link.href = a.getAttribute('href');
          link.textContent = a.textContent.trim();
          item.appendChild(link);
          ul.appendChild(item);
        });
      } else {
        // 하위메뉴가 없는 항목(봉행사찰 신고달사, 온라인민원)은
        // 자기 자신을 오른쪽에 하나만 보여준다.
        var item2 = document.createElement('li');
        var link2 = document.createElement('a');
        link2.href = topLink.getAttribute('href');
        link2.textContent = topLink.textContent.trim();
        item2.appendChild(link2);
        ul.appendChild(item2);
      }
      subCol.appendChild(ul);
      panels.push(ul);

      btn.addEventListener('click', function () {
        selectTab(i);
      });
    });

    function selectTab(index) {
      tabs.forEach(function (t, i) { t.classList.toggle('is-active', i === index); });
      panels.forEach(function (pnl, i) { pnl.classList.toggle('is-active', i === index); });
      subCol.scrollTop = 0;
    }

    // 현재 보고 있는 페이지가 속한 대메뉴를 기본 선택 (없으면 첫 번째)
    var activeIndex = 0;
    topItems.forEach(function (li, i) {
      if (li.classList.contains('is-active')) activeIndex = i;
    });
    selectTab(activeIndex);

    body.appendChild(mainCol);
    body.appendChild(subCol);
    drawer.appendChild(head);
    drawer.appendChild(body);
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    backdrop.addEventListener('click', closeDrawer);
    head.querySelector('.drawer-close').addEventListener('click', closeDrawer);

    // 메뉴 항목을 누르면 드로어를 닫는다.
    // (링크 자체는 "준비 중입니다" 팝업이 가로채므로, 팝업이 드로어에 가리지 않게 됨)
    subCol.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeDrawer();
    });
  }

  function openDrawer() {
    buildDrawer();
    if (!drawer) return;
    drawer.classList.add('is-open');
    backdrop.classList.add('is-open');
    if (toggle) {
      toggle.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
    }
    lockBodyScroll();
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    if (toggle) {
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    unlockBodyScroll();
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      if (drawer && drawer.classList.contains('is-open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  // 데스크톱 폭으로 넓어지면 드로어를 닫는다
  window.addEventListener('resize', function () {
    if (window.innerWidth > 760 && drawer && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
  });

  // Video modal (used on 성주대재보존회 행사 page)
  var modal = document.querySelector('.video-modal');
  if (modal) {
    var iframeWrap = modal.querySelector('.video-modal-inner');
    document.querySelectorAll('[data-youtube-id]').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.getAttribute('data-youtube-id');
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframeWrap.innerHTML = '';
        iframeWrap.appendChild(iframe);
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      });
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('.video-modal-close')) {
        closeModal();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
    function closeModal() {
      modal.classList.remove('is-open');
      iframeWrap.innerHTML = '<button class="video-modal-close" type="button"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6L18 18M18 6L6 18"/></svg>닫기</button>';
      document.body.style.overflow = '';
    }
  }

  // Hero slideshow (메인 페이지 히어로 사진 3장 자동 전환 + 점 인디케이터)
  var heroSlides = document.querySelectorAll('.hero-slide');
  var heroDots = document.querySelectorAll('.hero-dot');
  if (heroSlides.length > 0) {
    var currentSlide = 0;
    var slideTimer = null;
    var SLIDE_INTERVAL = 5000;

    function showSlide(index) {
      heroSlides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });
      heroDots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
      currentSlide = index;
    }

    function nextSlide() {
      showSlide((currentSlide + 1) % heroSlides.length);
    }

    function startAutoSlide() {
      stopAutoSlide();
      slideTimer = window.setInterval(nextSlide, SLIDE_INTERVAL);
    }
    function stopAutoSlide() {
      if (slideTimer) {
        window.clearInterval(slideTimer);
        slideTimer = null;
      }
    }

    heroDots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        showSlide(i);
        startAutoSlide(); // 사용자가 직접 선택하면 그 시점부터 다시 자동 전환 타이머 시작
      });
    });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // 첫 슬라이드는 HTML에 is-active 없이 시작한 상태(이미지가 살짝 확대 전 크기)로 두고,
      // 한 박자 뒤에 is-active를 붙여줘야 "확대되는" transition이 실제로 일어난다.
      // 처음부터 is-active로 박아두면 브라우저가 전환 없이 최종 확대 상태로 바로 그려버려서
      // 줌 효과가 안 보이는 문제가 있었다.
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          showSlide(0);
          startAutoSlide();
        });
      });
    } else {
      showSlide(0);
    }
  }

  // 히어로 배경의 날씨 효과 — 눈 / 비 / 맑음(별빛) / 안개가 20초마다 자동으로 순환.
  // 페이지를 열 때마다 어떤 날씨로 시작할지는 무작위로 정해짐.
  var ambientCanvas = document.getElementById('hero-ambient-canvas');
  // 캔버스 애니메이션 중단 제어용. 히어로가 화면 밖이거나 탭이 비활성이면 멈춘다.
  var ambientActive = false;
  var ambientRafId = null;
  if (ambientCanvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var actx = ambientCanvas.getContext('2d');
    var aWidth, aHeight, aParticles = [];
    var WEATHER_STATES = ['snow', 'clear', 'fog'];
    var WEATHER_INTERVAL_MS = 20000; // 20초마다 다음 날씨로 전환
    var currentWeatherIndex = Math.floor(Math.random() * WEATHER_STATES.length); // 페이지 열 때마다 랜덤 시작

    // DOMContentLoaded 시점에는 .hero의 flex 레이아웃이 아직 자리잡기 전이라
    // offsetWidth/Height가 실제 화면 크기보다 작게(또는 0으로) 측정될 수 있다.
    // 그 상태로 캔버스 해상도를 고정해버리면, 그 작은 캔버스가 CSS로만 확대되어
    // 보이는 꼴이 되어 입자가 화면 왼쪽 위 한 귀퉁이에만 몰려 그려지는 문제가 생긴다.
    // → 실제 렌더링된 크기 변화를 추적하는 ResizeObserver로 항상 최신 크기를 반영한다.
    function ambientResize() {
      var rect = ambientCanvas.getBoundingClientRect();
      var newWidth = Math.round(rect.width);
      var newHeight = Math.round(rect.height);
      if (newWidth === 0 || newHeight === 0) return; // 아직 레이아웃 전이면 건너뜀
      if (newWidth === aWidth && newHeight === aHeight) return; // 변화 없으면 다시 그리지 않음
      aWidth = ambientCanvas.width = newWidth;
      aHeight = ambientCanvas.height = newHeight;
      generateParticles();
    }

    function generateParticles() {
      aParticles = [];
      var state = WEATHER_STATES[currentWeatherIndex];

      if (state === 'snow') {
        for (var i = 0; i < 70; i++) {
          aParticles.push({
            x: Math.random() * aWidth,
            y: Math.random() * aHeight,
            r: Math.random() * 1.3 + 0.5,
            speed: Math.random() * 0.45 + 0.18,
            drift: (Math.random() - 0.5) * 0.3
          });
        }
      } else if (state === 'clear') {
        for (var k = 0; k < 24; k++) {
          aParticles.push({
            x: Math.random() * aWidth,
            y: Math.random() * aHeight,
            r: Math.random() * 1 + 0.4,
            alpha: Math.random() * 0.3 + 0.08,
            pulse: (Math.random() * 0.01 + 0.003) * (Math.random() < 0.5 ? 1 : -1)
          });
        }
      }
      // fog는 입자 없이 화면 전체에 막을 깔기만 함 (draw에서 처리)
    }

    function ambientDraw() {
      if (!ambientActive) { ambientRafId = null; return; }
      if (!aWidth || !aHeight) {
        ambientRafId = requestAnimationFrame(ambientDraw);
        return;
      }
      actx.clearRect(0, 0, aWidth, aHeight);
      var state = WEATHER_STATES[currentWeatherIndex];

      if (state === 'snow') {
        actx.fillStyle = 'rgba(245, 241, 232, 0.5)';
        actx.beginPath();
        for (var i = 0; i < aParticles.length; i++) {
          var p = aParticles[i];
          actx.moveTo(p.x, p.y);
          actx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          p.y += p.speed;
          p.x += p.drift;
          if (p.y > aHeight) { p.y = -6; p.x = Math.random() * aWidth; }
        }
        actx.fill();
      } else if (state === 'clear') {
        for (var k = 0; k < aParticles.length; k++) {
          var c = aParticles[k];
          actx.fillStyle = 'rgba(245, 241, 232, ' + c.alpha + ')';
          actx.beginPath();
          actx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          actx.fill();
          c.alpha += c.pulse;
          if (c.alpha > 0.4 || c.alpha < 0.05) c.pulse *= -1;
        }
      } else if (state === 'fog') {
        actx.fillStyle = 'rgba(245, 241, 232, 0.06)';
        actx.fillRect(0, 0, aWidth, aHeight);
      }

      ambientRafId = requestAnimationFrame(ambientDraw);
    }

    function cycleWeather() {
      currentWeatherIndex = (currentWeatherIndex + 1) % WEATHER_STATES.length;
      generateParticles();
    }

    aWidth = 0;
    aHeight = 0;
    ambientResize(); // 가능하면 즉시 한 번 시도

    // 레이아웃이 완전히 자리잡기 전이라 위 호출이 0으로 건너뛰어졌을 경우를 대비해
    // 실제 크기 변화를 계속 감지해서 캔버스를 다시 맞춘다. (리사이즈, 폰트 로딩,
    // 이미지 로딩 등으로 레이아웃이 바뀌는 모든 경우를 안전하게 커버)
    if (window.ResizeObserver) {
      var resizeObserver = new ResizeObserver(function () {
        ambientResize();
      });
      resizeObserver.observe(ambientCanvas);
    } else {
      // 구형 브라우저 대비: 약간의 지연 후 한 번 더 재측정
      window.setTimeout(ambientResize, 300);
      window.addEventListener('resize', ambientResize);
    }

    // 히어로가 화면 밖으로 벗어나면 캔버스 애니메이션을 멈춘다.
    // 그러지 않으면 눈/안개 입자가 보이지도 않는 채로 매 프레임 계속 그려지며,
    // 아래쪽 영상 디코딩과 CPU를 다투어 스크롤이 끊기는 원인이 된다.
    ambientActive = true;
    ambientDraw();

    var weatherTimer = window.setInterval(cycleWeather, WEATHER_INTERVAL_MS);

    if ('IntersectionObserver' in window) {
      var heroSection = document.querySelector('.hero');
      if (heroSection) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              if (!ambientActive) {
                ambientActive = true;
                if (ambientRafId === null) ambientDraw();
              }
            } else {
              ambientActive = false;   // 다음 프레임에서 스스로 멈춘다
            }
          });
        }, { threshold: 0 }).observe(heroSection);
      }
    }

    // 다른 탭으로 넘어갔을 때도 굳이 그릴 이유가 없다
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        ambientActive = false;
      } else if (!ambientActive) {
        ambientActive = true;
        if (ambientRafId === null) ambientDraw();
      }
    });
  }

});

// ==========================================================================
// "준비중입니다" 팝업 — 페이지 이동을 유발하는 내부 링크 클릭을 가로막고
// 대신 안내 팝업을 띄운다. (콘텐츠/메뉴 구조가 아직 확정되지 않은 동안의 임시 조치)
// ==========================================================================
(function () {
  var soonModal = null;

  function ensureSoonModal() {
    if (soonModal) return soonModal;
    soonModal = document.createElement('div');
    soonModal.className = 'soon-modal';
    soonModal.setAttribute('role', 'dialog');
    soonModal.setAttribute('aria-modal', 'true');
    soonModal.innerHTML =
      '<div class="soon-modal-inner">' +
        '<p class="soon-modal-msg">준비 중입니다.</p>' +
        '<button type="button" class="btn btn-primary soon-modal-close">확인</button>' +
      '</div>';
    document.body.appendChild(soonModal);

    soonModal.addEventListener('click', function (e) {
      if (e.target === soonModal || e.target.closest('.soon-modal-close')) {
        soonModal.classList.remove('is-open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && soonModal.classList.contains('is-open')) {
        soonModal.classList.remove('is-open');
      }
    });
    return soonModal;
  }

  function isInternalPageLink(anchor) {
    var href = anchor.getAttribute('href');
    if (!href) return false;
    if (anchor.classList.contains('brand')) return false;      // 좌측 상단 로고(홈으로 이동)는 정상 동작
    if (href.charAt(0) === '#') return false;                 // 같은 페이지 내 앵커
    if (href.indexOf('mailto:') === 0) return false;
    if (href.indexOf('tel:') === 0) return false;
    if (/^https?:\/\//i.test(href) && href.indexOf('milinjong.or.kr') === -1) {
      return false;                                            // 외부 사이트 링크(지도, 참고 사이트 등)는 그대로 허용
    }
    return true;
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return; // 모바일 메뉴 아코디언 토글 등 이미 처리된 클릭은 건드리지 않음
    var anchor = e.target.closest('a');
    if (!anchor || !isInternalPageLink(anchor)) return;
    e.preventDefault();
    ensureSoonModal().classList.add('is-open');
  });
})();

// ==========================================================================
// 스크롤 리빌 — 카드/이미지/문단이 뷰포트에 들어올 때 은은하게 떠오르는 연출
// (prefers-reduced-motion은 상단 전역 규칙에서 transition-duration을 0에
//  가깝게 만들어 자동으로 무력화되며, IntersectionObserver 미지원 브라우저나
//  JS 비활성 환경에서는 아예 클래스를 붙이지 않아 콘텐츠가 항상 보이도록 함)
// ==========================================================================
(function () {
  if (!('IntersectionObserver' in window)) return;

  var targets = document.querySelectorAll(
    '.info-card, .video-card, .gallery-strip .g-item, .section-title, .section-lead, .org-node, .profile-block, .quote-block'
  );
  if (!targets.length) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(function (el) {
    el.classList.add('reveal');
    var siblingIndex = el.parentElement
      ? Array.prototype.indexOf.call(el.parentElement.children, el)
      : 0;
    el.style.transitionDelay = (Math.min(siblingIndex, 4) * 0.14) + 's';
    io.observe(el);
  });
})();

// ==========================================================================
// 메인 페이지 영상 — 화면(뷰포트)에 들어오면 자동 재생, 벗어나면 일시정지.
//
// 브라우저는 "소리가 나는 영상"의 자동재생을 정책적으로 차단한다. 따라서 자동재생은
// 반드시 muted 상태로만 시작하고, 소리는 방문자가 버튼을 눌렀을 때(= 사용자 제스처)
// 비로소 켜지도록 한다. 이것이 브라우저 정책 안에서 가능한 유일한 방식이다.
// 한 번 소리를 켠 뒤에는 사용자의 선택을 존중해, 스크롤로 영상이 다시 들어와도
// 음소거로 되돌리지 않는다.
// ==========================================================================
(function () {
  var video = document.getElementById('feature-video');
  var soundBtn = document.getElementById('film-sound-btn');
  var loading = document.getElementById('film-loading');
  if (!video) return;

  var userWantsSound = false;

  // 아직 재생 가능할 만큼 받아지지 않았으면 로딩 표시를 보여준다.
  // (poster 이미지만 덩그러니 멈춰 있으면 '고장난 것'처럼 보이기 때문)
  function showLoading(on) {
    if (loading) loading.classList.toggle('is-visible', !!on);
  }
  ['waiting', 'stalled'].forEach(function (ev) {
    video.addEventListener(ev, function () { showLoading(true); });
  });
  ['playing', 'canplay', 'canplaythrough'].forEach(function (ev) {
    video.addEventListener(ev, function () { showLoading(false); });
  });

  function playVideo() {
    // 아직 재생할 만큼 버퍼가 차지 않았다면 로딩 표시를 켠다
    if (video.readyState < 3) showLoading(true);
    var p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () {
        // 자동재생이 차단된 경우(예: 소리가 켜진 상태에서 화면 밖으로 나갔다 다시 들어옴)
        // 음소거로 되돌려 한 번 더 시도한다. 그래도 안 되면 poster가 그대로 보인다.
        video.muted = true;
        syncSoundBtn();
        var retry = video.play();
        if (retry && typeof retry.catch === 'function') { retry.catch(function () {}); }
      });
    }
  }

  function syncSoundBtn() {
    if (!soundBtn) return;
    var on = !video.muted;
    soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var label = soundBtn.querySelector('.film-sound-label');
    if (label) label.textContent = on ? '소리 끄기' : '소리 켜기';
  }

  // 자동재생을 위해 항상 음소거 상태로 시작
  video.muted = true;
  syncSoundBtn();

  // 소리 켜기/끄기 토글 (사용자 제스처이므로 이 시점에는 소리를 켤 수 있다)
  if (soundBtn) {
    soundBtn.addEventListener('click', function () {
      video.muted = !video.muted;
      userWantsSound = !video.muted;
      if (!video.muted && video.paused) playVideo();
      syncSoundBtn();
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          playVideo();
        } else {
          video.pause();
          // 화면에서 벗어나면 소리가 계속 새어나오지 않도록 음소거로 되돌린다.
          // (사용자가 소리를 켜 뒀다면 다시 들어올 때 그 선택을 복원)
          video.muted = true;
          syncSoundBtn();
        }
      });
    }, { threshold: 0.2 });   // 조금 더 일찍 반응하게(45% -> 20%)
    io.observe(video);

    // ---- 미리 받아두기(warm-up) ----
    // 영상이 화면에 닿는 순간에야 내려받기 시작하면, 첫 조각이 도착할 때까지
    // 몇 초간 멈춰 있는 것처럼 보인다. 그래서 화면에 들어오기 한참 전
    // (아래로 900px 남았을 때)부터 미리 버퍼를 채워 둔다. 스크롤이 도착했을 땐
    // 이미 재생할 준비가 끝나 있다.
    var warmUp = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // HTML에는 preload="metadata"로 두어, 스크롤을 내리지 않는 방문자가
          // 영상 11MB를 통째로 받는 낭비를 막는다. 영상이 가까워진 이 시점에
          // 비로소 auto로 바꿔 본격적으로 버퍼를 채운다.
          video.preload = 'auto';
          video.load();
          warmUp.disconnect();
        }
      });
    }, { rootMargin: '900px 0px' });
    warmUp.observe(video);

    // 화면에 다시 들어와 재생이 시작되면, 앞서 사용자가 켜 둔 소리 설정을 복원
    video.addEventListener('play', function () {
      if (userWantsSound && video.muted) {
        video.muted = false;
        syncSoundBtn();
      }
    });
  } else {
    // IntersectionObserver 미지원 브라우저: 그냥 음소거 재생
    playVideo();
  }
})();
