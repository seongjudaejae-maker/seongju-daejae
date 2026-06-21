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
    window.scrollTo(0, scrollLockY);
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
      startAutoSlide();
    }
  }
});
