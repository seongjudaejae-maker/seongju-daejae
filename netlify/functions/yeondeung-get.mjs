// netlify/functions/yeondeung-get.mjs
// 연등(초) 발원 게시판 - 글 상세 조회
//
// 개인정보(연락처, 주소, 동참자 명단 등)가 포함되므로, 작성자 비밀번호 또는
// 관리자 마스터키를 함께 보내야만 상세 내용을 볼 수 있습니다.
// (비밀번호가 URL에 노출되지 않도록 POST 방식으로 받습니다)

import { getStore } from "@netlify/blobs";
import { verifyPassword, isAdminRequest, jsonResponse } from "./_utils.mjs";

export default async (req) => {
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "POST 요청만 허용됩니다." });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "요청 형식이 올바르지 않습니다." });
  }

  const { id, password, adminKey } = body || {};
  if (!id) {
    return jsonResponse(400, { error: "id가 필요합니다." });
  }

  try {
    const store = getStore({ name: "yeondeung-balwon", consistency: "strong" });
    const raw = await store.get(id, { type: "json" });
    if (!raw) {
      return jsonResponse(404, { error: "해당 글을 찾을 수 없습니다." });
    }

    const admin = isAdminRequest(adminKey);
    const ownerOk = !admin && verifyPassword(password, raw.passwordHash);

    if (!admin && !ownerOk) {
      return jsonResponse(403, { error: "비밀번호가 일치하지 않습니다." });
    }

    // 비밀번호 해시는 절대 클라이언트로 보내지 않음
    const { passwordHash, ...safeData } = raw;
    return jsonResponse(200, { item: safeData });
  } catch (err) {
    console.error("yeondeung-get error:", err);
    return jsonResponse(500, { error: "글을 불러오는 중 오류가 발생했습니다." });
  }
};
