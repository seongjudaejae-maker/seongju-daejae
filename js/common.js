/* ===== 공통 스크립트 (모든 페이지 공용) =====
   - 헤더 스크롤 시 그림자 효과
   - 모바일 메뉴 토글 (nav-toggle)
   - 히어로 배경 슬라이드쇼 (자동 재생 + 점 클릭) */
(function () {
  document.addEventListener('DOMContentLoaded', function () {

    /* 1) 헤더 스크롤 효과 */
    var header = document.querySelector('.site-header');
    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* 2) 모바일 메뉴 토글 */
    var navToggle = document.querySelector('.nav-toggle');
    var mainNav = document.querySelector('.main-nav');
    if (navToggle && mainNav) {
      navToggle.addEventListener('click', function () {
        var isOpen = mainNav.classList.toggle('is-mobile-open');
        navToggle.classList.toggle('is-open', isOpen);
        navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        navToggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
      });

      // 모바일에서 상위 메뉴를 탭하면 서브메뉴를 펼쳐 보여줌
      mainNav.querySelectorAll('> li').forEach(function (li) {
        var topLink = li.querySelector('> a');
        var subNav = li.querySelector('.sub-nav');
        if (!topLink || !subNav) return;
        topLink.addEventListener('click', function (e) {
          if (window.matchMedia('(max-width: 760px)').matches) {
            e.preventDefault();
            e.stopImmediatePropagation();
            li.classList.toggle('is-expanded');
          }
        });
      });
    }

    /* 3) 히어로 배경 슬라이드쇼 */
    var slides = document.querySelectorAll('.hero-slide');
    var dots = document.querySelectorAll('.hero-dot');
    if (slides.length > 1) {
      var current = 0;
      var timer = null;

      function showSlide(index) {
        slides.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
        dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
        current = index;
      }

      function startAutoplay() {
        clearInterval(timer);
        timer = setInterval(function () {
          showSlide((current + 1) % slides.length);
        }, 6000);
      }

      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function () {
          showSlide(i);
          startAutoplay();
        });
      });

      startAutoplay();
    }
  });
})();
