import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import { safeUrl } from "@/shared/lib/safeUrl";
import {
  COMPANY_CATEGORY_CLASSES,
  COMPANY_CATEGORY_LABELS,
  hasResearch,
} from "@/entities/company/model/company.type";
import type { Company, ResearchSource } from "@/entities/company/model/company.type";
import { computeResearchProgress } from "@/entities/company/model/research";
import { ResearchSourceLinks } from "../ResearchSourceLinks/ResearchSourceLinks";

interface CompanyResearchCardProps {
  company: Company;
  onEdit: () => void;
  onDelete: () => void;
}

/** 조사 내용 한 덩어리 — 값이 없으면 통째로 숨긴다 */
function ResearchSection({
  title,
  body,
  sources,
}: {
  title: string;
  body?: string;
  /** AI가 채운 항목이면 근거 링크를 함께 보여준다 */
  sources?: ResearchSource[];
}) {
  if (!body?.trim()) return null;

  return (
    <section>
      <h4 className="m-0 mb-1 text-xs font-semibold text-textSecondary">{title}</h4>
      {/* AI가 채운 값이 섞여 있으므로 HTML 로 렌더링하지 않는다 */}
      <p className="m-0 text-sm text-text whitespace-pre-wrap">{body}</p>
      <ResearchSourceLinks sources={sources} />
    </section>
  );
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

export function CompanyResearchCard({ company, onEdit, onDelete }: CompanyResearchCardProps) {
  // 공고 링크는 사용자가 올린 xlsx에서 온 값이라 허용 스킴만 링크로 만든다
  const postingUrl = safeUrl(company.postingUrl);

  return (
    <li className="flex flex-col gap-3 p-4 bg-surface border border-border rounded-md">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
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

        <div className="flex shrink-0 gap-1">
          <AppButton variant="ghost" color="gray" size="xs" onClick={onEdit}>
            수정
          </AppButton>
          <AppButton variant="ghost" color="red" size="xs" onClick={onDelete}>
            삭제
          </AppButton>
        </div>
      </header>

      <ResearchProgressBar company={company} />

      {hasResearch(company) ? (
        <div className="flex flex-col gap-3">
          <ResearchSection title="직무 설명" body={company.jobDescription} />
          <ResearchSection title="자격 요건" body={company.requirements} />
          <ResearchSection
            title="인재상"
            body={company.talentProfile}
            sources={company.researchSources?.talentProfile}
          />
          <ResearchSection
            title="사업 내용"
            body={company.businessSummary}
            sources={company.researchSources?.businessSummary}
          />
          <ResearchSection
            title="최근 이슈"
            body={company.recentIssues}
            sources={company.researchSources?.recentIssues}
          />
          <ResearchSection title="메모" body={company.researchNote} />
        </div>
      ) : (
        <p className="m-0 text-sm text-textSecondary">
          아직 조사 내용이 없습니다. 다음 반기에 지원할 기업이라면 미리 채워두세요.
        </p>
      )}
    </li>
  );
}
