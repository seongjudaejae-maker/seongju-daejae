// netlify/functions/yeondeung-get.mjs
// 연등(초) 발원 게시판 - 글 상세 조회 (비밀번호 해시는 응답에서 제외)

import { getStore } from "@netlify/blobs";
import { jsonResponse } from "./_utils.mjs";

export default async (req) => {
  if (req.method !== "GET") {
    return jsonResponse(405, { error: "GET 요청만 허용됩니다." });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return jsonResponse(400, { error: "id 파라미터가 필요합니다." });
  }

  try {
    const store = getStore("yeondeung-balwon");
    const raw = await store.get(id, { type: "json" });
    if (!raw) {
      return jsonResponse(404, { error: "해당 글을 찾을 수 없습니다." });
    }

    // 비밀번호 해시는 절대 클라이언트로 보내지 않음
    const { passwordHash, ...safeData } = raw;
    return jsonResponse(200, { item: safeData });
  } catch (err) {
    console.error("yeondeung-get error:", err);
    return jsonResponse(500, { error: "글을 불러오는 중 오류가 발생했습니다." });
  }
};
