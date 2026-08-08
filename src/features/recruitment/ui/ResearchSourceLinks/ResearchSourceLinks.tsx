import { safeUrl } from "@/shared/lib/safeUrl";
import type { ResearchSource } from "@/entities/company/model/company.type";

interface ResearchSourceLinksProps {
  sources?: ResearchSource[];
  /** 앞에 붙는 라벨 */
  label?: string;
}

/** 리다이렉트 주소라 호스트로는 구분이 안 되는 곳 — 제목이 없으면 번호로 물러난다 */
const OPAQUE_HOSTS = ["vertexaisearch.cloud.google.com"];

/**
 * 조사 항목의 근거 링크.
 *
 * AI 결과는 초안이라 사용자가 직접 사실 확인할 수 있어야 한다.
 * Gemini 는 검색 결과를 구글 리다이렉트 주소로 주기 때문에 호스트가 전부 같다 —
 * 제공자가 함께 준 제목을 우선 쓰고, 없을 때만 도메인으로 물러난다.
 */
export function ResearchSourceLinks({
  sources,
  label = "출처",
}: ResearchSourceLinksProps) {
  // safeUrl 은 허용 스킴이 아니면 null 을 준다 — 걸러내야 링크로 쓸 수 있다
  const safe = (sources ?? [])
    .map((source) => ({ ...source, url: safeUrl(source.url) }))
    .filter((source): source is ResearchSource => source.url !== null);

  if (safe.length === 0) return null;

  return (
    <p className="m-0 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
      <span className="shrink-0 text-textSecondary">{label}</span>
      {safe.map((source, index) => (
        <a
          key={source.url}
          href={source.url}
          target="_blank"
          rel="noreferrer"
          title={source.url}
          className="max-w-[240px] truncate text-blue-600 underline"
        >
          {toLabel(source, index)}
        </a>
      ))}
    </p>
  );
}

function toLabel(source: ResearchSource, index: number): string {
  const title = source.title?.trim();
  if (title) return title;

  try {
    const { hostname } = new URL(source.url);
    if (OPAQUE_HOSTS.includes(hostname)) return `출처 ${index + 1}`;
    return hostname.replace(/^www\./, "");
  } catch {
    return `출처 ${index + 1}`;
  }
}
