// netlify/functions/yeondeung-list.mjs
// 연등(초) 발원 게시판 - 글 목록 조회 (비밀번호/관리자 정보는 절대 응답에 포함하지 않음)

import { getStore } from "@netlify/blobs";
import { jsonResponse } from "./_utils.mjs";

export default async (req) => {
  if (req.method !== "GET") {
    return jsonResponse(405, { error: "GET 요청만 허용됩니다." });
  }

  try {
    const store = getStore("yeondeung-balwon");
    const { blobs } = await store.list();

    const items = [];
    for (const blobInfo of blobs) {
      const raw = await store.get(blobInfo.key, { type: "json" });
      if (!raw) continue;
      // 목록 화면에는 민감하지 않은 정보만 노출 (비밀번호 해시는 절대 포함 안 함)
      items.push({
        id: raw.id,
        applicantName: raw.applicantName,
        lampType: raw.lampType,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt || null,
      });
    }

    // 최신 글이 위로 오도록 정렬
    items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return jsonResponse(200, { items });
  } catch (err) {
    console.error("yeondeung-list error:", err);
    return jsonResponse(500, { error: "목록을 불러오는 중 오류가 발생했습니다." });
  }
};
