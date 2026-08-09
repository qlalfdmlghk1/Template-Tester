import Navbar from "@/widgets/Navbar/Navbar";
import AppFallback from "@/shared/ui/molecules/AppFallback/AppFallback";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import { safeUrl } from "@/shared/lib/safeUrl";
import { toKstDateKey } from "@/shared/lib/date";
import {
  COMPANY_CATEGORY_CLASSES,
  COMPANY_CATEGORY_LABELS,
} from "@/entities/company/model/company.type";
import type { Company, ResearchSource } from "@/entities/company/model/company.type";
import { computeResearchProgress } from "@/entities/company/model/research";
import { useCompanyDetail } from "../../model/useCompanyDetail";
import { ResearchSourceLinks } from "../ResearchSourceLinks/ResearchSourceLinks";

interface CompanyResearchDetailPageProps {
  companyId?: string;
}

/** 조사 한 항목 — 비어 있으면 "아직 없음"으로 남겨 빠진 걸 알 수 있게 한다 */
function Section({
  title,
  body,
  sources,
}: {
  title: string;
  body?: string;
  sources?: ResearchSource[];
}) {
  const filled = Boolean(body?.trim());

  return (
    <section className="py-4 border-t border-border first:border-t-0 first:pt-0">
      <h3 className="m-0 mb-2 text-sm font-semibold text-textSecondary">{title}</h3>

      {filled ? (
        <>
          {/* AI가 채운 값이 섞여 있으므로 HTML 로 렌더링하지 않는다 */}
          <p className="m-0 text-base leading-relaxed text-text whitespace-pre-wrap">
            {body}
          </p>
          <ResearchSourceLinks sources={sources} />
        </>
      ) : (
        <p className="m-0 text-sm text-textSecondary">아직 채우지 않았습니다.</p>
      )}
    </section>
  );
}

function DetailHeader({ company }: { company: Company }) {
  const { filled, total, percent } = computeResearchProgress(company);
  const postingUrl = safeUrl(company.postingUrl);

  return (
    <header className="flex flex-col gap-3 p-5 md:p-6 bg-surface border border-border rounded-lg">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="m-0 text-xl md:text-2xl font-bold text-text">{company.name}</h2>
        {company.categories?.map((category) => (
          <span
            key={category}
            className={cn(
              "px-2 py-0.5 rounded-sm text-xs font-medium",
              COMPANY_CATEGORY_CLASSES[category],
            )}
          >
            {COMPANY_CATEGORY_LABELS[category]}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-textSecondary">
        {company.targetJob && <span>{company.targetJob}</span>}
        {company.location && <span>{company.location}</span>}
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

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div
          className="flex-1 min-w-[160px] h-1.5 bg-border rounded-sm overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="조사 완성도"
        >
          <div
            className={cn(
              "h-full rounded-sm",
              percent === 100 ? "bg-green-500" : "bg-blue-500",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs text-textSecondary tabular-nums">
          조사 {filled}/{total}
        </span>
        {/* 조사 시각을 보여줘야 "최근 이슈"가 언제 기준인지 판단할 수 있다 */}
        {company.researchedAt && (
          <span className="text-xs text-textSecondary">
            AI 조사 {toKstDateKey(company.researchedAt)}
          </span>
        )}
      </div>
    </header>
  );
}

export function CompanyResearchDetailPage({
  companyId,
}: CompanyResearchDetailPageProps) {
  const detail = useCompanyDetail(companyId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-[900px] mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <AppButton
            variant="ghost"
            color="gray"
            size="sm"
            className="-ml-2"
            onClick={detail.goToList}
          >
            ← 목록으로
          </AppButton>

          {detail.company && (
            <AppButton variant="outline" size="sm" onClick={detail.goToEdit}>
              수정
            </AppButton>
          )}
        </div>

        {detail.error ? (
          <AppFallback type="error" onAction={detail.reload} />
        ) : detail.isLoading ? (
          <div className="flex flex-col gap-3" role="status" aria-label="불러오는 중">
            <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        ) : detail.notFound || !detail.company ? (
          <AppFallback
            type="empty"
            title="기업을 찾을 수 없습니다."
            description="이미 삭제됐거나 주소가 잘못됐습니다."
            buttonText="목록으로"
            buttonIcon={null}
            onAction={detail.goToList}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <DetailHeader company={detail.company} />

            <article className="px-5 md:px-6 py-2 bg-surface border border-border rounded-lg">
              <Section
                title="인재상"
                body={detail.company.talentProfile}
                sources={detail.company.researchSources?.talentProfile}
              />
              <Section
                title="사업 내용"
                body={detail.company.businessSummary}
                sources={detail.company.researchSources?.businessSummary}
              />
              <Section
                title="최근 이슈"
                body={detail.company.recentIssues}
                sources={detail.company.researchSources?.recentIssues}
              />
              <Section title="직무 설명" body={detail.company.jobDescription} />
              <Section title="자격 요건" body={detail.company.requirements} />
              <Section title="메모" body={detail.company.researchNote} />
            </article>
          </div>
        )}
      </div>
    </div>
  );
}
