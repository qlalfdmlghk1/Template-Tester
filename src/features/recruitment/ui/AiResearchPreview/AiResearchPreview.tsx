import {
  AI_RESEARCH_FIELDS,
  AI_RESEARCH_FIELD_LABELS,
} from "@/entities/company/model/company.type";
import type { AiResearchField } from "@/entities/company/model/company.type";
import type { CompanyResearchResult } from "@/entities/company/api/research.api";
import { AiFieldPreview } from "../AiFieldPreview/AiFieldPreview";

interface AiResearchPreviewProps {
  result: CompanyResearchResult;
  /** 폼에 현재 입력돼 있는 값 — 덮어쓰기 여부를 판단할 수 있게 보여준다 */
  currentValues: Record<AiResearchField, string>;
  selectedFields: AiResearchField[];
  onToggleField: (field: AiResearchField) => void;
  onApply: () => void;
  onDismiss: () => void;
}

/**
 * 기업 조사 결과 초안 미리보기.
 *
 * 항목 선택·반영 흐름은 공고 추출과 같으므로 `AiFieldPreview` 에 위임하고,
 * 여기서는 기업 조사에 맞는 항목 목록과 문구만 채운다.
 */
export function AiResearchPreview({
  result,
  currentValues,
  selectedFields,
  onToggleField,
  onApply,
  onDismiss,
}: AiResearchPreviewProps) {
  return (
    <AiFieldPreview
      heading="AI 조사 결과"
      description="반영할 항목만 골라 주세요. 출처를 열어 내용이 맞는지 확인하는 걸 권합니다."
      emptyMessage="검색으로 확인된 내용이 없어 결과가 비어 있습니다. 기업명을 정확히 적었는지 확인해 보세요."
      fields={AI_RESEARCH_FIELDS}
      labels={AI_RESEARCH_FIELD_LABELS}
      values={result}
      sources={result.sources}
      currentValues={currentValues}
      selectedFields={selectedFields}
      onToggleField={onToggleField}
      onApply={onApply}
      onDismiss={onDismiss}
    />
  );
}
