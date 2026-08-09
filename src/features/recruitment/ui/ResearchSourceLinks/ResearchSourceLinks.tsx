import { useState } from "react";
import AppIcon from "@/shared/ui/atoms/AppIcon/AppIcon";
import { cn } from "@/shared/lib/cn";
import { safeUrl } from "@/shared/lib/safeUrl";
import type { ResearchSource } from "@/entities/company/model/company.type";

interface ResearchSourceLinksProps {
  sources?: ResearchSource[];
}

/** 리다이렉트 주소라 호스트로는 구분이 안 되는 곳 — 제목이 없으면 번호로 물러난다 */
const OPAQUE_HOSTS = ["vertexaisearch.cloud.google.com"];

/**
 * 조사 항목의 근거 링크.
 *
 * AI 결과는 초안이라 사용자가 직접 사실 확인할 수 있어야 한다. 다만 항목마다 링크를
 * 펼쳐두면 본문보다 링크가 더 눈에 띄므로, 접어두고 필요할 때만 펼치게 한다.
 *
 * Gemini 는 검색 결과를 구글 리다이렉트 주소로 주기 때문에 호스트가 전부 같다 —
 * 제공자가 함께 준 제목을 우선 쓰고, 없을 때만 도메인으로 물러난다.
 */
export function ResearchSourceLinks({ sources }: ResearchSourceLinksProps) {
  const [open, setOpen] = useState(false);

  // safeUrl 은 허용 스킴이 아니면 null 을 준다 — 걸러내야 링크로 쓸 수 있다
  const safe = (sources ?? [])
    .map((source) => ({ ...source, url: safeUrl(source.url) }))
    .filter((source): source is ResearchSource => source.url !== null);

  if (safe.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 px-2 py-1 -ml-2 text-xs text-textSecondary bg-transparent border-0 rounded-sm cursor-pointer hover:text-text hover:bg-gray-100"
      >
        <AppIcon
          name="chevron-right"
          size={14}
          className={cn("transition-transform", open && "rotate-90")}
        />
        출처 {safe.length}
      </button>

      {open && (
        <ul className="flex flex-col gap-1 m-0 mt-1 p-0 list-none">
          {safe.map((source, index) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                title={source.url}
                className="inline-flex items-center gap-1 max-w-full text-xs text-blue-600 hover:underline"
              >
                <AppIcon name="arrow-top-right-on-square" size={12} className="shrink-0" />
                <span className="truncate">{toLabel(source, index)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
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
