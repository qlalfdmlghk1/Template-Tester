import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { hasResearch } from "@/entities/company/model/company.type";
import type { Company } from "@/entities/company/model/company.type";

interface CompanyResearchCardProps {
  company: Company;
  onEdit: () => void;
  onDelete: () => void;
}

/** 조사 내용 한 덩어리 — 값이 없으면 통째로 숨긴다 */
function ResearchSection({ title, body }: { title: string; body?: string }) {
  if (!body?.trim()) return null;

  return (
    <section>
      <h4 className="m-0 mb-1 text-xs font-semibold text-textSecondary">{title}</h4>
      <p className="m-0 text-sm text-text whitespace-pre-wrap">{body}</p>
    </section>
  );
}

export function CompanyResearchCard({ company, onEdit, onDelete }: CompanyResearchCardProps) {
  return (
    <li className="flex flex-col gap-3 p-4 bg-surface border border-border rounded-md">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 text-base font-semibold text-text">{company.name}</h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-textSecondary">
            {company.targetJob && <span>{company.targetJob}</span>}
            {company.location && <span>· {company.location}</span>}
            {company.postingUrl && (
              <a
                href={company.postingUrl}
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

      {hasResearch(company) ? (
        <div className="flex flex-col gap-3">
          <ResearchSection title="직무 설명" body={company.jobDescription} />
          <ResearchSection title="자격 요건" body={company.requirements} />
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
