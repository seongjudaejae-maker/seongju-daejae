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

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  var scrollLockY = 0;

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

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-mobile-open');
      toggle.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) {
        lockBodyScroll();
      } else {
        unlockBodyScroll();
      }
    });

    // Expand submenus on mobile by tapping the parent link's caret area
    nav.querySelectorAll('li').forEach(function (li) {
      var subNav = li.querySelector('.sub-nav');
      if (!subNav) return;
      // 하위메뉴가 있는 항목에만 +/- 표시를 보여주기 위한 클래스
      // ("성주대재 봉행사찰"처럼 하위메뉴가 없는 항목에는 붙지 않음)
      li.classList.add('has-submenu');
      var topLink = li.querySelector('a');
      topLink.addEventListener('click', function (e) {
        if (window.innerWidth <= 760) {
          e.preventDefault();
          li.classList.toggle('is-expanded');
        }
      });
    });
  }

  // Close mobile nav when resizing to desktop
  window.addEventListener('resize', function () {
    if (window.innerWidth > 760 && nav && nav.classList.contains('is-mobile-open')) {
      nav.classList.remove('is-mobile-open');
      toggle.classList.remove('is-open');
      unlockBodyScroll();
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
      if (!aWidth || !aHeight) {
        requestAnimationFrame(ambientDraw);
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

      requestAnimationFrame(ambientDraw);
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

    ambientDraw();
    window.setInterval(cycleWeather, WEATHER_INTERVAL_MS);
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
