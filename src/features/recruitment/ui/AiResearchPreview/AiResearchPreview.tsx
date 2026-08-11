import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import {
  AI_RESEARCH_FIELDS,
  AI_RESEARCH_FIELD_LABELS,
} from "@/entities/company/model/company.type";
import type { AiResearchField } from "@/entities/company/model/company.type";
import type { CompanyResearchResult } from "@/entities/company/api/research.api";
import { ResearchSourceLinks } from "../ResearchSourceLinks/ResearchSourceLinks";
import { ResearchText } from "../ResearchText/ResearchText";

interface AiResearchPreviewProps {
  result: CompanyResearchResult;
  /** 폼에 현재 입력돼 있는 값 — 덮어쓰기 여부를 판단할 수 있게 보여준다 */
  currentValues: Record<AiResearchField, string>;
  selectedFields: AiResearchField[];
  onToggleField: (field: AiResearchField) => void;
  onApply: () => void;
  onDismiss: () => void;
}

export function AiResearchPreview({
  result,
  currentValues,
  selectedFields,
  onToggleField,
  onApply,
  onDismiss,
}: AiResearchPreviewProps) {
  const filledFields = AI_RESEARCH_FIELDS.filter((field) => result[field]?.trim());

  if (filledFields.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-background border border-border rounded-sm">
        <p className="m-0 text-sm text-textSecondary">
          검색으로 확인된 내용이 없어 결과가 비어 있습니다. 기업명을 정확히 적었는지 확인해 보세요.
        </p>
        <AppButton type="button" variant="ghost" color="gray" size="xs" onClick={onDismiss}>
          닫기
        </AppButton>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-3 p-3 bg-background border border-blue-300 rounded-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 text-sm font-semibold text-text">AI 조사 결과</h3>
          <p className="m-0 mt-0.5 text-xs text-textSecondary">
            반영할 항목만 골라 주세요. 출처를 열어 내용이 맞는지 확인하는 걸 권합니다.
          </p>
        </div>
        <AppButton type="button" variant="ghost" color="gray" size="xs" onClick={onDismiss}>
          닫기
        </AppButton>
      </header>

      <ul className="flex flex-col gap-2 m-0 p-0 list-none">
        {filledFields.map((field) => {
          const checked = selectedFields.includes(field);
          const willOverwrite = Boolean(currentValues[field]?.trim());

          return (
            <li
              key={field}
              className={cn(
                "p-2 border rounded-sm transition-colors",
                checked ? "border-blue-400 bg-surface" : "border-border bg-surface opacity-60",
              )}
            >
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleField(field)}
                  className="mt-0.5 shrink-0"
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-text">
                      {AI_RESEARCH_FIELD_LABELS[field]}
                    </span>
                    {willOverwrite && (
                      <span className="px-1.5 py-0.5 rounded-sm text-xs bg-yellow-100 text-yellow-800">
                        기존 내용 덮어씀
                      </span>
                    )}
                  </span>
                  {/* AI 응답은 HTML 로 렌더링하지 않는다 — ResearchText 가 조각내 조립 */}
                  <ResearchText text={result[field] ?? ""} className="mt-1 text-sm text-text" />
                  <ResearchSourceLinks sources={result.sources[field]} />
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="flex justify-end">
        <AppButton
          type="button"
          size="xs"
          onClick={onApply}
          disabled={selectedFields.length === 0}
        >
          선택한 {selectedFields.length}개 반영
        </AppButton>
      </div>
    </section>
  );
}
