// netlify/functions/yeondeung-create.mjs
// 연등(초) 발원 게시판 - 새 글 작성 (비회원, 비밀번호 필수)

import { getStore } from "@netlify/blobs";
import { hashPassword, generateId, jsonResponse, escapeHtml, addToIndex } from "./_utils.mjs";

const MAX_LEN = {
  applicantName: 50,
  contact: 30,
  payerName: 50,
  lampType: 50,
  address: 200,
  participants: 2000,
  wish: 1000,
};

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

  const {
    applicantName,
    contact,
    payerName,
    lampType,
    address,
    participants,
    wish,
    password,
  } = body || {};

  // 필수값 검증
  if (!applicantName || !contact || !lampType || !address || !participants || !wish || !password) {
    return jsonResponse(400, { error: "필수 항목이 누락되었습니다." });
  }
  if (String(password).length < 4) {
    return jsonResponse(400, { error: "비밀번호는 4자 이상 입력해 주세요." });
  }

  // 길이 제한 검증 (과도한 입력 방지)
  const fields = { applicantName, contact, payerName: payerName || "", lampType, address, participants, wish };
  for (const [key, val] of Object.entries(fields)) {
    if (String(val).length > MAX_LEN[key]) {
      return jsonResponse(400, { error: `${key} 항목이 너무 길어요.` });
    }
  }

  const id = generateId();
  const now = new Date().toISOString();

  const record = {
    id,
    applicantName: escapeHtml(applicantName.trim()),
    contact: escapeHtml(contact.trim()),
    payerName: payerName ? escapeHtml(payerName.trim()) : "",
    lampType: escapeHtml(lampType.trim()),
    address: escapeHtml(address.trim()),
    participants: escapeHtml(participants.trim()),
    wish: escapeHtml(wish.trim()),
    passwordHash: hashPassword(password),
    createdAt: now,
    updatedAt: null,
  };

  try {
    const store = getStore({ name: "yeondeung-balwon", consistency: "strong" });
    await store.setJSON(id, record);

    const indexStore = getStore({ name: "yeondeung-balwon-index", consistency: "strong" });
    await addToIndex(indexStore, record);

    const { passwordHash, ...safeData } = record;
    return jsonResponse(201, { item: safeData });
  } catch (err) {
    console.error("yeondeung-create error:", err);
    return jsonResponse(500, { error: "글을 저장하는 중 오류가 발생했습니다." });
  }
};
