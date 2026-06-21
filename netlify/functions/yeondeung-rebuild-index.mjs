// netlify/functions/yeondeung-rebuild-index.mjs
// 연등(초) 발원 게시판 - 인덱스 재구성 (관리자가 필요할 때만 수동으로 1회 실행)
//
// 평소에는 호출할 필요가 없습니다. 다음과 같은 경우에만 사용하세요:
// - 인덱스 도입 이전에 작성된 글이 있어서 목록에 안 보일 때
// - 어떤 이유로 인덱스와 실제 글 데이터가 서로 어긋났다고 의심될 때
//
// 호출 방법(브라우저 주소창 또는 admin 화면에서):
//   /api/yeondeung/rebuild-index?adminKey=관리자비밀번호

import { getStore } from "@netlify/blobs";
import { isAdminRequest, jsonResponse } from "./_utils.mjs";

export default async (req) => {
  if (req.method !== "GET" && req.method !== "POST") {
    return jsonResponse(405, { error: "GET 또는 POST 요청만 허용됩니다." });
  }

  const url = new URL(req.url);
  const adminKey = url.searchParams.get("adminKey");

  if (!isAdminRequest(adminKey)) {
    return jsonResponse(403, { error: "관리자 인증에 실패했습니다." });
  }

  try {
    const store = getStore("yeondeung-balwon");
    const { blobs } = await store.list();

    const results = await Promise.all(
      blobs.map((blobInfo) => store.get(blobInfo.key, { type: "json" }))
    );

    const items = results
      .filter(Boolean)
      .map((raw) => ({
        id: raw.id,
        applicantName: raw.applicantName,
        lampType: raw.lampType,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt || null,
      }));

    items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    const indexStore = getStore("yeondeung-balwon-index");
    await indexStore.setJSON("index", items);

    return jsonResponse(200, { success: true, count: items.length });
  } catch (err) {
    console.error("yeondeung-rebuild-index error:", err);
    return jsonResponse(500, { error: "인덱스를 재구성하는 중 오류가 발생했습니다." });
  }
};
