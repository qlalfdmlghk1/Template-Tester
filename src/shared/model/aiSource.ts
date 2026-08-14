/**
 * AI 가 채운 내용의 근거 링크.
 *
 * 기업 조사(`entities/company`)와 공고 추출(`entities/job-application`)이 함께 쓰므로
 * shared 에 둔다 — 엔티티끼리 서로를 import 하면 같은 레이어 슬라이스 간 의존이 되어
 * FSD 방향 규칙이 깨진다. (`shared/config/aiProvider` 와 같은 이유)
 *
 * URL 만으로는 라벨을 만들 수 없다 — Gemini 는 검색 결과를 리다이렉트 주소로 주기 때문에
 * 호스트가 전부 같다. 제공자가 함께 주는 제목을 보관해 표시에 쓴다.
 */
export interface ResearchSource {
  url: string;
  title?: string;
}

/**
 * 모델이 준 출처를 표시용 형태로 맞춘다. URL 문자열과 객체를 모두 받는다.
 *
 * 출처는 처음에 URL 문자열 배열이었다가 제목을 함께 담는 형태로 바뀌었다.
 * 저장된 문서를 마이그레이션하지 않고 읽는 쪽에서 흡수하므로 두 형태를 모두 받는다.
 */
export function normalizeSources<Field extends string>(
  raw: unknown,
): Partial<Record<Field, ResearchSource[]>> {
  if (!raw || typeof raw !== "object") return {};

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([field, value]) => [
      field,
      (Array.isArray(value) ? value : [])
        .map((item) => toSource(item))
        .filter((item): item is ResearchSource => item !== null),
    ]),
  ) as Partial<Record<Field, ResearchSource[]>>;
}

/**
 * 출처 한 건을 저장 가능한 형태로 만든다.
 *
 * `title` 키에 undefined 를 담으면 Firestore 저장이 거부된다 — `stripUndefined` 는
 * 배열 안쪽 객체까지 훑지 않으므로, 출처가 들어오는 이 통로에서 미리 걷어낸다.
 */
function toSource(item: unknown): ResearchSource | null {
  if (typeof item === "string") {
    return item.trim() ? { url: item } : null;
  }

  if (!item || typeof item !== "object") return null;

  const { url, title } = item as Partial<ResearchSource>;
  if (typeof url !== "string" || !url.trim()) return null;

  return title?.trim() ? { url, title } : { url };
}
