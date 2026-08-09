import AppFallback from "@/shared/ui/molecules/AppFallback/AppFallback";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import AppIcon from "@/shared/ui/atoms/AppIcon/AppIcon";
import { cn } from "@/shared/lib/cn";
import { safeUrl } from "@/shared/lib/safeUrl";
import { toKstDateKey } from "@/shared/lib/date";
import {
  COMPANY_CATEGORY_CLASSES,
  COMPANY_CATEGORY_LABELS,
} from "@/entities/company/model/company.type";
import type { Company, ResearchSource } from "@/entities/company/model/company.type";
import { computeResearchProgress } from "@/entities/company/model/research";
import { formatSalary } from "@/entities/company/model/salary";
import { useCompanyDetail } from "../../model/useCompanyDetail";
import { PreferenceBadge } from "../PreferenceBadge/PreferenceBadge";
import { ResearchSourceLinks } from "../ResearchSourceLinks/ResearchSourceLinks";

interface CompanyResearchDetailProps {
  companyId?: string;
}

interface SectionProps {
  icon: string;
  title: string;
  body?: string;
  sources?: ResearchSource[];
  /** AI가 채우는 항목 — 비었을 때 안내 문구가 달라진다 */
  aiField?: boolean;
}

/** 조사 한 항목 */
function Section({ icon, title, body, sources, aiField }: SectionProps) {
  const filled = Boolean(body?.trim());

  return (
    <section
      className={cn(
        "p-4 md:p-5 rounded-lg border",
        filled ? "bg-surface border-border" : "bg-transparent border-dashed border-border",
      )}
    >
      <h3 className="flex items-center gap-1.5 m-0 mb-2 text-sm font-semibold text-textSecondary">
        <AppIcon name={icon} size={16} />
        {title}
      </h3>

      {filled ? (
        <>
          {/* AI가 채운 값이 섞여 있으므로 HTML 로 렌더링하지 않는다 */}
          <p className="m-0 text-base leading-7 text-text whitespace-pre-wrap break-words">
            {body}
          </p>
          <ResearchSourceLinks sources={sources} />
        </>
      ) : (
        <p className="m-0 text-sm text-textSecondary">
          {aiField ? "아직 비어 있습니다. AI 조사로 채울 수 있습니다." : "아직 비어 있습니다."}
        </p>
      )}
    </section>
  );
}

function DetailHeader({
  company,
  onEdit,
}: {
  company: Company;
  onEdit: () => void;
}) {
  const { filled, total, percent } = computeResearchProgress(company);
  const postingUrl = safeUrl(company.postingUrl);
  const salary = formatSalary(company.salary);

  return (
    <header className="flex flex-col gap-4 p-5 md:p-6 bg-surface border border-border rounded-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <PreferenceBadge preference={company.preference} withLabel />
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

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-textSecondary">
            {company.targetJob && (
              <span className="inline-flex items-center gap-1">
                <AppIcon name="briefcase" size={14} />
                {company.targetJob}
              </span>
            )}
            {company.location && (
              <span className="inline-flex items-center gap-1">
                <AppIcon name="map-pin" size={14} />
                {company.location}
              </span>
            )}
            {salary && (
              <span className="inline-flex items-center gap-1">
                <AppIcon name="banknotes" size={14} />
                {salary}
              </span>
            )}
            {postingUrl && (
              <a
                href={postingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
              >
                <AppIcon name="arrow-top-right-on-square" size={14} />
                공고 링크
              </a>
            )}
          </div>
        </div>

        <AppButton variant="outline" size="sm" className="shrink-0" onClick={onEdit}>
          수정
        </AppButton>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <div
          className="flex-1 min-w-[160px] h-2 bg-gray-200 rounded-sm overflow-hidden"
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
        <span className="text-xs font-medium text-text tabular-nums">
          조사 {filled}/{total}
        </span>
        {/* 조사 시각을 보여줘야 "최근 이슈"가 언제 기준인지 판단할 수 있다 */}
        {company.researchedAt && (
          <span className="inline-flex items-center gap-1 text-xs text-textSecondary">
            <AppIcon name="sparkles" size={12} />
            AI 조사 {toKstDateKey(company.researchedAt)}
          </span>
        )}
      </div>
    </header>
  );
}

/** 기업 조사 보기 화면의 본문. 페이지 외곽(Navbar·컨테이너)은 라우트 파일이 두른다. */
export function CompanyResearchDetail({ companyId }: CompanyResearchDetailProps) {
  const detail = useCompanyDetail(companyId);

  return (
    <>
        <AppButton
          variant="ghost"
          color="gray"
          size="sm"
          className="mb-3 -ml-2"
          onClick={detail.goToList}
        >
          ← 목록으로
        </AppButton>

        {detail.error ? (
          <AppFallback type="error" onAction={detail.reload} />
        ) : detail.isLoading ? (
          <div className="flex flex-col gap-4" role="status" aria-label="불러오는 중">
            <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
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
            <DetailHeader company={detail.company} onEdit={detail.goToEdit} />

            {/* 편집 화면과 같은 배치 — 오갈 때 시선이 같은 자리에 머문다 */}
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 items-start">
              <div className="flex flex-col gap-4">
                <Section
                  icon="document-text"
                  title="직무 설명"
                  body={detail.company.jobDescription}
                />
                <Section
                  icon="clipboard-document-check"
                  title="자격 요건"
                  body={detail.company.requirements}
                />
                <Section
                  icon="pencil-square"
                  title="메모"
                  body={detail.company.researchNote}
                />
              </div>

              <div className="flex flex-col gap-4">
                <Section
                  aiField
                  icon="user-group"
                  title="인재상"
                  body={detail.company.talentProfile}
                  sources={detail.company.researchSources?.talentProfile}
                />
                <Section
                  aiField
                  icon="building-office-2"
                  title="사업 내용"
                  body={detail.company.businessSummary}
                  sources={detail.company.researchSources?.businessSummary}
                />
                <Section
                  aiField
                  icon="newspaper"
                  title="최근 이슈"
                  body={detail.company.recentIssues}
                  sources={detail.company.researchSources?.recentIssues}
                />
              </div>
            </div>
          </div>
        )}
    </>
  );
}
