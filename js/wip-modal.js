/* ===== 준비중 안내 모달 (모든 페이지 공용) =====
   사용법: 이 파일을 <script src="js/wip-modal.js"></script> 형태로
   각 페이지의 </body> 직전에 한 줄만 추가하면 됩니다.
   (css/wip-modal.css 도 <head>에 함께 연결되어 있어야 합니다)

   대상: 상위 메뉴(주메뉴 + 서브메뉴) 링크, 그리고 페이지 안의 모든
   ".btn" 버튼 / "pages/" 로 연결되는 모든 링크(정보 카드, 푸터 링크 등) */
(function () {
  document.addEventListener('DOMContentLoaded', function () {

    // 1) 모달 마크업을 body에 자동 삽입
    var overlay = document.createElement('div');
    overlay.className = 'wip-modal-overlay';
    overlay.id = 'wip-modal-overlay';
    overlay.innerHTML =
      '<div class="wip-modal" role="dialog" aria-modal="true" aria-labelledby="wip-modal-text">' +
        '<div class="wip-modal-body">' +
          '<span class="wip-modal-icon" aria-hidden="true">\uD83D\uDD14</span>' +
          '<p class="wip-modal-text" id="wip-modal-text">' +
            '홈페이지 개선중입니다.<br>' +
            '더욱 정갈하고 유익한 도량의 공간으로 찾아뵙겠습니다.' +
          '</p>' +
        '</div>' +
        '<div class="wip-modal-actions">' +
          '<button type="button" class="wip-modal-confirm" id="wip-modal-confirm">확인</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var confirmBtn = document.getElementById('wip-modal-confirm');

    function openWipModal() {
      overlay.classList.add('is-open');
    }
    function closeWipModal() {
      overlay.classList.remove('is-open');
    }

    // 2) 대상 요소 수집
    //    - .btn 클래스가 있는 모든 버튼/링크 (히어로 버튼, 인용구 버튼 등)
    //    - 상위 메뉴(주메뉴 .main-nav)와 서브메뉴(.sub-nav)의 모든 링크
    //    - href 가 "pages/" 로 시작하는 그 외 모든 링크 (정보 카드, 푸터 바로가기 등)
    var selector = '.btn, .main-nav a, .sub-nav a, a[href^="pages/"]';

    document.querySelectorAll(selector).forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openWipModal();
      });
    });

    confirmBtn.addEventListener('click', closeWipModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeWipModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeWipModal();
    });
  });
})();
