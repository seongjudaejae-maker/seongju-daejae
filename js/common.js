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
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-mobile-open');
      toggle.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
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
      document.body.style.overflow = '';
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
});
