// netlify/functions/yeondeung-list.mjs
// 연등(초) 발원 게시판 - 글 목록 조회
//
// 성능을 위해, 글 하나하나를 매번 조회하지 않고 "인덱스" 키 하나만 읽어옵니다.
// (글이 많아져도 항상 네트워크 요청 1번으로 끝납니다)

import { getStore } from "@netlify/blobs";
import { jsonResponse, getIndex } from "./_utils.mjs";

export default async (req) => {
  if (req.method !== "GET") {
    return jsonResponse(405, { error: "GET 요청만 허용됩니다." });
  }

  try {
    const indexStore = getStore({ name: "yeondeung-balwon-index", consistency: "strong" });
    const items = await getIndex(indexStore);

    // 최신 글이 위로 오도록 정렬 (인덱스는 보통 이미 최신순이지만 안전하게 한 번 더 정렬)
    items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return jsonResponse(200, { items });
  } catch (err) {
    console.error("yeondeung-list error:", err);
    return jsonResponse(500, { error: "목록을 불러오는 중 오류가 발생했습니다." });
  }
};
