// netlify/functions/yeondeung-admin-list.mjs
// 연등(초) 발원 게시판 - 관리자용 전체 글 조회 (마스터키 필요, 모든 필드 포함)

import { getStore } from "@netlify/blobs";
import { isAdminRequest, jsonResponse } from "./_utils.mjs";

export default async (req) => {
  if (req.method !== "GET") {
    return jsonResponse(405, { error: "GET 요청만 허용됩니다." });
  }

  const url = new URL(req.url);
  const adminKey = url.searchParams.get("adminKey");

  if (!isAdminRequest(adminKey)) {
    return jsonResponse(403, { error: "관리자 인증에 실패했습니다." });
  }

  try {
    const store = getStore("yeondeung-balwon");
    const { blobs } = await store.list();

    const items = [];
    for (const blobInfo of blobs) {
      const raw = await store.get(blobInfo.key, { type: "json" });
      if (!raw) continue;
      const { passwordHash, ...safeData } = raw;
      items.push(safeData);
    }

    items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return jsonResponse(200, { items });
  } catch (err) {
    console.error("yeondeung-admin-list error:", err);
    return jsonResponse(500, { error: "목록을 불러오는 중 오류가 발생했습니다." });
  }
};
