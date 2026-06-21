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
    const indexStore = getStore("yeondeung-balwon-index");
    let items = await getIndex(indexStore);

    // 인덱스가 비어있는데 실제 글 저장소에는 글이 있다면,
    // (예: 이 기능을 추가하기 전에 작성된 글이 있는 경우) 인덱스를 한 번만 복구합니다.
    // 이후에는 항상 인덱스만 읽으므로 빨라집니다.
    if (items.length === 0) {
      const store = getStore("yeondeung-balwon");
      const { blobs } = await store.list();

      if (blobs.length > 0) {
        const results = await Promise.all(
          blobs.map((blobInfo) => store.get(blobInfo.key, { type: "json" }))
        );
        items = results
          .filter(Boolean)
          .map((raw) => ({
            id: raw.id,
            applicantName: raw.applicantName,
            lampType: raw.lampType,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt || null,
          }));

        // 복구된 인덱스를 저장해서, 다음 조회부터는 빠르게 동작하도록 함
        await indexStore.setJSON("index", items);
      }
    }

    // 최신 글이 위로 오도록 정렬 (인덱스는 보통 이미 최신순이지만 안전하게 한 번 더 정렬)
    items.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    return jsonResponse(200, { items });
  } catch (err) {
    console.error("yeondeung-list error:", err);
    return jsonResponse(500, { error: "목록을 불러오는 중 오류가 발생했습니다." });
  }
};
