import { safeUrl } from "@/shared/lib/safeUrl";

interface ResearchSourceLinksProps {
  urls?: string[];
  /** 앞에 붙는 라벨 — 좁은 자리에서는 숨긴다 */
  label?: string;
}

/**
 * 조사 항목의 근거 링크.
 *
 * AI 결과는 초안이라 사용자가 직접 사실 확인할 수 있어야 한다.
 * 번호(`[1]`)만 보여주면 어디로 가는지 알 수 없어 도메인을 라벨로 쓴다.
 */
export function ResearchSourceLinks({ urls, label = "출처" }: ResearchSourceLinksProps) {
  // safeUrl 은 허용 스킴이 아니면 null 을 준다 — 걸러내야 링크로 쓸 수 있다
  const safe = (urls ?? [])
    .map(safeUrl)
    .filter((url): url is string => url !== null);

  if (safe.length === 0) return null;

  return (
    <p className="m-0 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
      <span className="text-textSecondary">{label}</span>
      {safe.map((url, index) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noreferrer"
          title={url}
          className="max-w-[220px] truncate text-blue-600 underline"
        >
          {toLabel(url, index)}
        </a>
      ))}
    </p>
  );
}

/** 도메인만 뽑아 라벨로 쓴다. 파싱이 안 되면 번호로 물러난다. */
function toLabel(url: string, index: number): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return `[${index + 1}]`;
  }
}
