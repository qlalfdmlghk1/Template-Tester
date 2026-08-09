import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import { safeUrl } from "@/shared/lib/safeUrl";
import {
  COMPANY_CATEGORY_CLASSES,
  COMPANY_CATEGORY_LABELS,
  hasResearch,
} from "@/entities/company/model/company.type";
import type { Company } from "@/entities/company/model/company.type";
import { computeResearchProgress } from "@/entities/company/model/research";
import { PreferenceBadge } from "../PreferenceBadge/PreferenceBadge";

interface CompanyResearchCardProps {
  company: Company;
  onOpen: () => void;
  onEdit: () => void;
}

/** 목록에서 훑기 좋게 줄이는 길이 — 전문은 보기 화면에서 읽는다 */
const SUMMARY_LIMIT = 90;

function summarize(company: Company): string {
  // 자소서에 쓸 만한 순서대로 먼저 있는 것을 보여준다
  const body =
    company.businessSummary ??
    company.talentProfile ??
    company.recentIssues ??
    company.jobDescription ??
    company.requirements ??
    company.researchNote ??
    "";

  const flat = body.trim().replace(/\s+/g, " ");
  return flat.length > SUMMARY_LIMIT ? `${flat.slice(0, SUMMARY_LIMIT)}…` : flat;
}

/**
 * 조사 완성도.
 * 색으로만 구분하면 색각 이상 사용자가 읽을 수 없어 수치를 함께 적는다.
 */
function ResearchProgressBar({ company }: { company: Company }) {
  const { filled, total, percent } = computeResearchProgress(company);

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-1.5 bg-border rounded-sm overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="조사 완성도"
      >
        <div
          className={cn(
            "h-full rounded-sm transition-[width]",
            percent === 100 ? "bg-green-500" : "bg-blue-500",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 text-xs text-textSecondary tabular-nums">
        {filled}/{total}
      </span>
    </div>
  );
}

export function CompanyResearchCard({
  company,
  onOpen,
  onEdit,
}: CompanyResearchCardProps) {
  // 공고 링크는 사용자가 올린 xlsx에서 온 값이라 허용 스킴만 링크로 만든다
  const postingUrl = safeUrl(company.postingUrl);
  const summary = summarize(company);

  return (
    <li className="flex flex-col gap-3 p-4 bg-surface border border-border rounded-md transition-colors hover:border-blue-400">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <PreferenceBadge preference={company.preference} />
            <h3 className="m-0 text-base font-semibold text-text">{company.name}</h3>
            {company.categories?.map((category) => (
              <span
                key={category}
                className={cn(
                  "px-1.5 py-0.5 rounded-sm text-xs font-medium",
                  COMPANY_CATEGORY_CLASSES[category],
                )}
              >
                {COMPANY_CATEGORY_LABELS[category]}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-textSecondary">
            {company.targetJob && <span>{company.targetJob}</span>}
            {company.location && <span>· {company.location}</span>}
            {postingUrl && (
              <a
                href={postingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                공고 링크
              </a>
            )}
          </div>
        </div>

        {/* 삭제는 편집 화면 안으로 옮겼다 — 목록에서 잘못 누르면 되돌릴 수 없다 */}
        <div className="flex shrink-0 gap-1">
          <AppButton variant="outline" size="xs" onClick={onOpen}>
            보기
          </AppButton>
          <AppButton variant="ghost" color="gray" size="xs" onClick={onEdit}>
            수정
          </AppButton>
        </div>
      </header>

      <ResearchProgressBar company={company} />

      {/* 요약할 본문이 없으면 빈 문단을 그리지 않는다 — 관심 직무만 적은 기업이 그렇고,
          그 직무는 이미 위 헤더에 나와 있다 */}
      {summary ? (
        // 전문은 보기 화면에서 읽는다 — 목록에서는 어떤 기업인지 가늠할 만큼만
        <p className="m-0 text-sm text-textSecondary line-clamp-2">{summary}</p>
      ) : (
        !hasResearch(company) && (
          <p className="m-0 text-sm text-textSecondary">
            아직 조사 내용이 없습니다. 다음 반기에 지원할 기업이라면 미리 채워두세요.
          </p>
        )
      )}
    </li>
  );
}
