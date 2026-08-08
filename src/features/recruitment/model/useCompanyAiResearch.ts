import { useCallback, useState } from "react";
import { useAiKey } from "@/shared/lib/useAiKey";
import {
  researchCompany,
  CompanyResearchError,
} from "@/entities/company/api/research.api";
import type {
  CompanyResearchResult,
  CompanyResearchTarget,
} from "@/entities/company/api/research.api";
import { AI_RESEARCH_FIELDS } from "@/entities/company/model/company.type";
import type { AiResearchField } from "@/entities/company/model/company.type";

/**
 * 기업 조사 AI 실행 상태.
 *
 * 결과는 곧바로 저장하지 않는다 — AI 응답은 초안이므로 사용자가 항목별로 골라 반영한다.
 * (기획 검수 ⚠️ #4: 이미 값이 있는 필드를 일괄로 덮어쓰지 않는다)
 */
export function useCompanyAiResearch() {
  const { provider, apiKey, hasApiKey } = useAiKey();

  const [isResearching, setIsResearching] = useState(false);
  const [result, setResult] = useState<CompanyResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** 반영할 항목 — 기본값은 내용이 있는 항목 전부 선택 */
  const [selectedFields, setSelectedFields] = useState<AiResearchField[]>([]);

  const run = useCallback(
    async (target: CompanyResearchTarget) => {
      if (!apiKey) return;

      setIsResearching(true);
      setError(null);
      setResult(null);

      try {
        const research = await researchCompany({ ...target, provider, apiKey });

        setResult(research);
        setSelectedFields(
          AI_RESEARCH_FIELDS.filter((field) => research[field]?.trim()),
        );
      } catch (cause) {
        // 키가 섞여 나갈 수 있으므로 원본 에러를 콘솔에 찍지 않는다
        setError(
          cause instanceof CompanyResearchError
            ? cause.message
            : "조사에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        );
      } finally {
        setIsResearching(false);
      }
    },
    [apiKey, provider],
  );

  const toggleField = useCallback((field: AiResearchField) => {
    setSelectedFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field],
    );
  }, []);

  const dismiss = useCallback(() => {
    setResult(null);
    setError(null);
    setSelectedFields([]);
  }, []);

  return {
    hasApiKey,
    isResearching,
    result,
    error,
    selectedFields,
    run,
    toggleField,
    dismiss,
  };
}
