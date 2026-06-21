// netlify/functions/yeondeung-update.mjs
// 연등(초) 발원 게시판 - 글 수정 (작성자 비밀번호 또는 관리자 마스터키 필요)

import { getStore } from "@netlify/blobs";
import { verifyPassword, isAdminRequest, jsonResponse, escapeHtml, updateInIndex } from "./_utils.mjs";

export default async (req) => {
  if (req.method !== "PUT") {
    return jsonResponse(405, { error: "PUT 요청만 허용됩니다." });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: "요청 형식이 올바르지 않습니다." });
  }

  const { id, password, adminKey, updates } = body || {};
  if (!id || !updates) {
    return jsonResponse(400, { error: "id와 수정 내용이 필요합니다." });
  }

  try {
    const store = getStore("yeondeung-balwon");
    const existing = await store.get(id, { type: "json" });
    if (!existing) {
      return jsonResponse(404, { error: "해당 글을 찾을 수 없습니다." });
    }

    const admin = isAdminRequest(adminKey);
    const ownerOk = !admin && verifyPassword(password, existing.passwordHash);

    if (!admin && !ownerOk) {
      return jsonResponse(403, { error: "비밀번호가 일치하지 않습니다." });
    }

    const allowedFields = ["applicantName", "contact", "payerName", "lampType", "address", "participants", "wish"];
    const sanitizedUpdates = {};
    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = escapeHtml(String(updates[key]).trim());
      }
    }

    const updated = {
      ...existing,
      ...sanitizedUpdates,
      updatedAt: new Date().toISOString(),
    };

    await store.setJSON(id, updated);

    const indexStore = getStore("yeondeung-balwon-index");
    await updateInIndex(indexStore, updated);

    const { passwordHash, ...safeData } = updated;
    return jsonResponse(200, { item: safeData });
  } catch (err) {
    console.error("yeondeung-update error:", err);
    return jsonResponse(500, { error: "글을 수정하는 중 오류가 발생했습니다." });
  }
};
