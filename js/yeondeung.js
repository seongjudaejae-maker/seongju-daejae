// ==========================================================================
// 연등(초) 발원 게시판 - yeondeung.js
// ==========================================================================
// 비회원도 비밀번호로 글을 작성/수정/삭제할 수 있는 간단한 게시판입니다.
// 데이터는 Netlify Functions + Netlify Blobs에 저장됩니다.

(function () {
  const API = {
    list: "/api/yeondeung/list",
    get: "/api/yeondeung/get",
    create: "/api/yeondeung/create",
    update: "/api/yeondeung/update",
    delete: "/api/yeondeung/delete",
  };

  const els = {};
  let currentDetailId = null;
  let pendingAction = null; // "edit" | "delete"
  let localItems = []; // 마지막으로 불러온 목록의 로컬 캐시 (서버 지연과 무관하게 즉시 화면 갱신용)

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    els.toolbar = document.getElementById("yd-toolbar");
    els.writeBtn = document.getElementById("yd-write-btn");
    els.viewList = document.getElementById("yd-view-list");
    els.viewWrite = document.getElementById("yd-view-write");
    els.viewDetail = document.getElementById("yd-view-detail");
    els.list = document.getElementById("yd-list");
    els.writeForm = document.getElementById("yd-write-form");
    els.writeError = document.getElementById("yd-write-error");
    els.cancelWrite = document.getElementById("yd-cancel-write");
    els.detailContent = document.getElementById("yd-detail-content");
    els.backToList = document.getElementById("yd-back-to-list");
    els.editBtn = document.getElementById("yd-edit-btn");
    els.deleteBtn = document.getElementById("yd-delete-btn");

    els.pwModal = document.getElementById("yd-password-modal");
    els.pwInput = document.getElementById("yd-password-input");
    els.pwError = document.getElementById("yd-password-error");
    els.pwCancel = document.getElementById("yd-password-cancel");
    els.pwConfirm = document.getElementById("yd-password-confirm");

    if (!els.list) return; // 이 페이지가 아니면 종료

    els.writeBtn.addEventListener("click", showWriteView);
    els.cancelWrite.addEventListener("click", showListView);
    els.writeForm.addEventListener("submit", handleCreateSubmit);
    els.backToList.addEventListener("click", showListView);
    els.deleteBtn.addEventListener("click", () => requestPassword("delete"));
    els.editBtn.addEventListener("click", () => requestPassword("edit"));
    els.pwCancel.addEventListener("click", closePasswordModal);
    els.pwConfirm.addEventListener("click", confirmPassword);
    els.pwInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") confirmPassword();
    });

    // URL 해시로 상세글 직접 진입 지원 (#id=xxxx) — 개인정보 보호를 위해 비밀번호 확인을 거칩니다.
    const hashId = new URLSearchParams(location.hash.slice(1)).get("id");
    if (hashId) {
      currentDetailId = hashId;
      loadList(); // 목록은 미리 불러와 둡니다 (뒤로가기 등 대비)
      requestPassword("view");
    } else {
      loadList();
    }
  }

  // ---------------------------------------------------------------------
  // 화면 전환
  // ---------------------------------------------------------------------
  function showListView(options) {
    const opts = options || {};
    els.viewList.hidden = false;
    els.viewWrite.hidden = true;
    els.viewDetail.hidden = true;
    els.toolbar.style.display = "flex";
    history.replaceState(null, "", location.pathname);

    if (opts.skipReload) {
      renderList(localItems);
    } else {
      loadList();
    }
  }

  function showWriteView() {
    els.viewList.hidden = true;
    els.viewWrite.hidden = false;
    els.viewDetail.hidden = true;
    els.toolbar.style.display = "none";
    els.writeError.hidden = true;
    els.writeForm.reset();
  }

  function showDetailView() {
    els.viewList.hidden = true;
    els.viewWrite.hidden = true;
    els.viewDetail.hidden = false;
    els.toolbar.style.display = "none";
  }

  // ---------------------------------------------------------------------
  // 목록 불러오기
  // ---------------------------------------------------------------------
  async function loadList() {
    els.list.innerHTML = '<li style="color: var(--stone);">목록을 불러오는 중입니다…</li>';
    try {
      const res = await fetch(API.list);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "목록을 불러오지 못했습니다.");

      localItems = data.items || [];
      renderList(localItems);
    } catch (err) {
      els.list.innerHTML = `<li class="yd-list-empty">${escapeText(err.message)}</li>`;
    }
  }

  function renderList(items) {
    if (!items || items.length === 0) {
      els.list.innerHTML = '<li class="yd-list-empty">아직 등록된 발원 글이 없습니다. 첫 발원을 올려보세요.</li>';
      return;
    }

    els.list.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = `#id=${encodeURIComponent(item.id)}`;
      a.textContent = `[${item.lampType}] ${item.applicantName} 님의 발원`;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        // 개인정보가 포함되어 있어, 클릭 시 바로 보여주지 않고 비밀번호 확인을 먼저 요청합니다.
        currentDetailId = item.id;
        requestPassword("view");
      });

      const dateSpan = document.createElement("span");
      dateSpan.className = "n-date";
      dateSpan.textContent = formatDate(item.createdAt);

      li.appendChild(a);
      li.appendChild(dateSpan);
      els.list.appendChild(li);
    });
  }

  // ---------------------------------------------------------------------
  // 글쓰기
  // ---------------------------------------------------------------------
  async function handleCreateSubmit(e) {
    e.preventDefault();
    els.writeError.hidden = true;

    const payload = {
      applicantName: val("yd-applicantName"),
      contact: val("yd-contact"),
      payerName: val("yd-payerName"),
      lampType: val("yd-lampType"),
      address: val("yd-address"),
      participants: val("yd-participants"),
      wish: val("yd-wish"),
      password: val("yd-password"),
    };

    const submitBtn = els.writeForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "신청 처리 중…";

    try {
      const res = await fetch(API.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "신청 중 오류가 발생했습니다.");

      // 서버 목록 재조회 없이, 방금 만든 글을 캐시 맨 앞에 즉시 추가합니다.
      localItems = [
        {
          id: data.item.id,
          applicantName: data.item.applicantName,
          lampType: data.item.lampType,
          createdAt: data.item.createdAt,
          updatedAt: data.item.updatedAt || null,
        },
        ...localItems,
      ];

      showListView({ skipReload: true });
      // 방금 작성한 글은 본인이 직접 입력한 비밀번호를 그대로 사용해 상세보기를 보여줍니다.
      openDetailWithPassword(data.item.id, payload.password);
    } catch (err) {
      els.writeError.textContent = err.message;
      els.writeError.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "신청하기";
    }
  }

  // ---------------------------------------------------------------------
  // 상세보기 (비밀번호 또는 관리자 마스터키로만 열람 가능)
  // ---------------------------------------------------------------------
  async function fetchDetail(id, password) {
    const res = await fetch(API.get, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "글을 찾을 수 없습니다.");
    return data.item;
  }

  // 글을 막 작성한 직후, 본인이 입력한 비밀번호로 곧바로 상세보기를 띄울 때 사용합니다.
  async function openDetailWithPassword(id, password) {
    currentDetailId = id;
    showDetailView();
    els.detailContent.innerHTML = '<p style="color:var(--stone);">불러오는 중입니다…</p>';
    history.replaceState(null, "", `#id=${encodeURIComponent(id)}`);

    try {
      const item = await fetchDetail(id, password);
      renderDetail(item);
    } catch (err) {
      els.detailContent.innerHTML = `<p class="yd-error">${escapeText(err.message)}</p>`;
      els.editBtn.style.display = "none";
      els.deleteBtn.style.display = "none";
    }
  }

  function renderDetail(item) {
    els.editBtn.style.display = "";
    els.deleteBtn.style.display = "";

    els.detailContent.innerHTML = `
      <div class="yd-detail-card">
        <div class="yd-detail-header">
          <h3>[${escapeText(item.lampType)}] ${escapeText(item.applicantName)} 님의 발원</h3>
          <p class="meta">신청일 ${formatDate(item.createdAt)}${item.updatedAt ? ` · 수정일 ${formatDate(item.updatedAt)}` : ""}</p>
        </div>
        <div class="yd-detail-body">
          <div class="yd-detail-row">
            <p class="label">신청자 성명</p>
            <p class="value">${escapeText(item.applicantName)}</p>
          </div>
          <div class="yd-detail-row">
            <p class="label">연락처</p>
            <p class="value">${escapeText(item.contact)}</p>
          </div>
          ${item.payerName ? `
          <div class="yd-detail-row">
            <p class="label">입금자명</p>
            <p class="value">${escapeText(item.payerName)}</p>
          </div>` : ""}
          <div class="yd-detail-row">
            <p class="label">등/초 종류</p>
            <p class="value">${escapeText(item.lampType)}</p>
          </div>
          <div class="yd-detail-row">
            <p class="label">거주 주소</p>
            <p class="value">${escapeText(item.address)}</p>
          </div>
          <div class="yd-detail-row">
            <p class="label">동참자 명단</p>
            <p class="value">${escapeText(item.participants)}</p>
          </div>
          <div class="yd-detail-row">
            <p class="label">발원(소원) 내용</p>
            <p class="value">${escapeText(item.wish)}</p>
          </div>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------
  // 비밀번호 확인 모달 (수정/삭제 공용)
  // ---------------------------------------------------------------------
  function requestPassword(action) {
    pendingAction = action;
    els.pwInput.value = "";
    els.pwError.hidden = true;
    const titles = {
      view: "비밀번호 확인 (열람)",
      edit: "수정 확인",
      delete: "삭제 확인",
    };
    document.getElementById("yd-password-modal-title").textContent = titles[action] || "비밀번호 확인";
    els.pwModal.hidden = false;
    els.pwInput.focus();
  }

  function closePasswordModal() {
    els.pwModal.hidden = true;
    pendingAction = null;
  }

  async function confirmPassword() {
    const password = els.pwInput.value;
    if (!password) {
      els.pwError.textContent = "비밀번호를 입력해 주세요.";
      els.pwError.hidden = false;
      return;
    }

    if (pendingAction === "view") {
      await performView(password);
    } else if (pendingAction === "delete") {
      await performDelete(password);
    } else if (pendingAction === "edit") {
      await performEditCheck(password);
    }
  }

  async function performView(password) {
    try {
      const item = await fetchDetail(currentDetailId, password);

      closePasswordModal();
      showDetailView();
      history.replaceState(null, "", `#id=${encodeURIComponent(currentDetailId)}`);
      renderDetail(item);
    } catch (err) {
      els.pwError.textContent = err.message;
      els.pwError.hidden = false;
    }
  }

  async function performDelete(password) {
    try {
      const res = await fetch(API.delete, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: currentDetailId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "삭제할 수 없습니다.");

      // 서버 저장소의 읽기 반영 지연과 무관하게, 화면에서는 즉시 해당 글을 제거합니다.
      localItems = localItems.filter((item) => item.id !== currentDetailId);
      currentDetailId = null;

      closePasswordModal();
      showListView({ skipReload: true });
    } catch (err) {
      els.pwError.textContent = err.message;
      els.pwError.hidden = false;
    }
  }

  // 수정은: 비밀번호 검증을 위해 상세 조회를 시도해
  // 통과하면 수정 폼을 채워서 보여주는 방식으로 단순화합니다.
  async function performEditCheck(password) {
    try {
      const item = await fetchDetail(currentDetailId, password);
      closePasswordModal();
      openEditForm(item, password);
    } catch (err) {
      els.pwError.textContent = err.message;
      els.pwError.hidden = false;
    }
  }

  function openEditForm(item, password) {
    showWriteView();
    document.querySelector(".yd-form-title").textContent = "연등(초) 발원 수정";

    setVal("yd-applicantName", item.applicantName);
    setVal("yd-contact", item.contact);
    setVal("yd-payerName", item.payerName);
    setVal("yd-lampType", item.lampType);
    setVal("yd-address", item.address);
    setVal("yd-participants", item.participants);
    setVal("yd-wish", item.wish);

    // 비밀번호 입력칸은 수정 모드에서는 "기존 비밀번호 확인됨" 표시로 대체
    const pwField = document.getElementById("yd-password").closest(".yd-field");
    pwField.style.display = "none";

    // 제출 핸들러를 수정 모드로 일시 교체
    const form = els.writeForm;
    const originalSubmitHandler = handleCreateSubmit;
    form.removeEventListener("submit", originalSubmitHandler);

    async function editSubmitHandler(e) {
      e.preventDefault();
      els.writeError.hidden = true;

      const updates = {
        applicantName: val("yd-applicantName"),
        contact: val("yd-contact"),
        payerName: val("yd-payerName"),
        lampType: val("yd-lampType"),
        address: val("yd-address"),
        participants: val("yd-participants"),
        wish: val("yd-wish"),
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = "저장 중…";

      try {
        const res = await fetch(API.update, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, password, updates }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "수정 중 오류가 발생했습니다.");

        // 로컬 캐시의 해당 항목도 즉시 갱신 (목록에 보이는 이름/종류/날짜 등)
        localItems = localItems.map((it) =>
          it.id === data.item.id
            ? {
                id: data.item.id,
                applicantName: data.item.applicantName,
                lampType: data.item.lampType,
                createdAt: data.item.createdAt,
                updatedAt: data.item.updatedAt || null,
              }
            : it
        );

        // 원래 상태로 폼 복구
        form.removeEventListener("submit", editSubmitHandler);
        form.addEventListener("submit", originalSubmitHandler);
        document.querySelector(".yd-form-title").textContent = "연등(초) 발원 신청";
        pwField.style.display = "";

        showListView({ skipReload: true });
        openDetail(item.id);
      } catch (err) {
        els.writeError.textContent = err.message;
        els.writeError.hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "신청하기";
      }
    }

    form.addEventListener("submit", editSubmitHandler);

    // 취소 시 원상 복구
    els.cancelWrite.addEventListener("click", function restoreOnCancel() {
      form.removeEventListener("submit", editSubmitHandler);
      form.addEventListener("submit", originalSubmitHandler);
      document.querySelector(".yd-form-title").textContent = "연등(초) 발원 신청";
      pwField.style.display = "";
      els.cancelWrite.removeEventListener("click", restoreOnCancel);
    }, { once: true });
  }

  // ---------------------------------------------------------------------
  // 유틸
  // ---------------------------------------------------------------------
  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }
  function setVal(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  }
  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  }
  function escapeText(str) {
    if (str === undefined || str === null) return "";
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }
})();
