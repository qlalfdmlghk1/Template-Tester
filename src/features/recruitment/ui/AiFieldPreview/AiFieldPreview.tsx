import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import type { ResearchSource } from "@/shared/model/aiSource";
import { ResearchSourceLinks } from "../ResearchSourceLinks/ResearchSourceLinks";
import { ResearchText } from "../ResearchText/ResearchText";

interface AiFieldPreviewProps<Field extends string> {
  /** 미리보기 제목 (예: "AI 조사 결과") */
  heading: string;
  /** 제목 아래 한 줄 안내 */
  description: string;
  /** 채워진 항목이 하나도 없을 때 보여줄 문구 */
  emptyMessage: string;
  /** 표시 순서를 정하는 항목 목록 */
  fields: readonly Field[];
  labels: Record<Field, string>;
  /** AI 가 채운 값 */
  values: Partial<Record<Field, string>>;
  /** 항목별 근거 */
  sources: Partial<Record<Field, ResearchSource[]>>;
  /** 현재 저장돼 있는 값 — 덮어쓰기 여부를 판단할 수 있게 보여준다 */
  currentValues: Partial<Record<Field, string>>;
  selectedFields: Field[];
  onToggleField: (field: Field) => void;
  onApply: () => void;
  onDismiss: () => void;
}

/**
 * AI 결과 초안 미리보기.
 *
 * AI 응답은 초안이므로 곧바로 저장하지 않고 사용자가 항목별로 골라 반영한다.
 * 기업 조사와 공고 추출이 같은 흐름을 쓰므로 항목 종류에 무관하게 만들어 두 곳에서 쓴다.
 */
export function AiFieldPreview<Field extends string>({
  heading,
  description,
  emptyMessage,
  fields,
  labels,
  values,
  sources,
  currentValues,
  selectedFields,
  onToggleField,
  onApply,
  onDismiss,
}: AiFieldPreviewProps<Field>) {
  const filledFields = fields.filter((field) => values[field]?.trim());

  if (filledFields.length === 0) {
    return (
      <div className="flex items-center justify-between gap-3 p-3 bg-background border border-border rounded-sm">
        <p className="m-0 text-sm text-textSecondary">{emptyMessage}</p>
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
          <h3 className="m-0 text-sm font-semibold text-text">{heading}</h3>
          <p className="m-0 mt-0.5 text-xs text-textSecondary">{description}</p>
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
                    <span className="text-xs font-semibold text-text">{labels[field]}</span>
                    {willOverwrite && (
                      <span className="px-1.5 py-0.5 rounded-sm text-xs bg-yellow-100 text-yellow-800">
                        기존 내용 덮어씀
                      </span>
                    )}
                  </span>
                  {/* AI 응답은 HTML 로 렌더링하지 않는다 — ResearchText 가 조각내 조립 */}
                  {/* label > span 안쪽이라 문단 대신 span 으로 감싼다 */}
                  <ResearchText
                    as="span"
                    text={values[field] ?? ""}
                    className="mt-1 text-sm text-text"
                  />
                  <ResearchSourceLinks sources={sources[field]} />
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
