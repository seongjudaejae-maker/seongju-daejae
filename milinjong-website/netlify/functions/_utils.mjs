// netlify/functions/_utils.mjs
// 연등(초) 발원 게시판에서 공통으로 쓰는 유틸리티 함수 모음

import crypto from "node:crypto";

/**
 * 비밀번호를 salt + scrypt로 해시합니다. (평문 저장 금지)
 * 저장 형식: "salt:hash" (둘 다 hex 문자열)
 */
export function hashPassword(rawPassword) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(rawPassword), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * 입력한 비밀번호가 저장된 해시와 일치하는지 검증합니다.
 */
export function verifyPassword(rawPassword, stored) {
  if (!stored || typeof stored !== "string" || !stored.includes(":")) return false;
  const [salt, originalHash] = stored.split(":");
  const hash = crypto.scryptSync(String(rawPassword), salt, 64).toString("hex");
  // 타이밍 공격 방지를 위해 timingSafeEqual 사용
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(originalHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * 글 ID 생성: 시간 기반 + 랜덤 (정렬 가능하면서도 충돌 방지)
 */
export function generateId() {
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(4).toString("hex");
  return `${ts}-${rand}`;
}

/**
 * JSON 응답 헬퍼 (Netlify Functions v2는 표준 Response 객체를 요구합니다)
 */
export function jsonResponse(statusCode, bodyObj) {
  return new Response(JSON.stringify(bodyObj), {
    status: statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/**
 * 관리자 마스터 비밀번호 검증
 * (Netlify 환경변수 ADMIN_MASTER_KEY 에 설정된 값과 비교)
 */
export function isAdminRequest(providedKey) {
  const masterKey = process.env.ADMIN_MASTER_KEY;
  if (!masterKey) return false; // 마스터키가 설정되지 않았으면 절대 통과시키지 않음
  if (!providedKey) return false;
  const a = Buffer.from(String(providedKey));
  const b = Buffer.from(String(masterKey));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * 매우 단순한 HTML 이스케이프 (XSS 방지용 — 저장 시점에 적용)
 */
export function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * 목록 조회 성능을 위한 "가벼운 인덱스" 관리 헬퍼
 *
 * 글이 늘어날 때마다 매번 모든 글을 하나씩 조회하면 매우 느려지므로,
 * "목록에 필요한 최소 정보(이름/종류/날짜)"만 모아 단 하나의 키에 저장해두고
 * 목록 조회는 이 인덱스 하나만 읽어오도록 합니다.
 */
const INDEX_KEY = "index";

function toIndexEntry(record) {
  return {
    id: record.id,
    applicantName: record.applicantName,
    lampType: record.lampType,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt || null,
  };
}

export async function getIndex(indexStore) {
  const data = await indexStore.get(INDEX_KEY, { type: "json" });
  return Array.isArray(data) ? data : [];
}

export async function addToIndex(indexStore, record) {
  const list = await getIndex(indexStore);
  list.unshift(toIndexEntry(record));
  await indexStore.setJSON(INDEX_KEY, list);
}

export async function updateInIndex(indexStore, record) {
  const list = await getIndex(indexStore);
  const next = list.map((entry) => (entry.id === record.id ? toIndexEntry(record) : entry));
  await indexStore.setJSON(INDEX_KEY, next);
}

export async function removeFromIndex(indexStore, id) {
  const list = await getIndex(indexStore);
  const next = list.filter((entry) => entry.id !== id);
  await indexStore.setJSON(INDEX_KEY, next);
}
