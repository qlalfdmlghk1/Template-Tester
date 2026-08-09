import { useCallback, useEffect, useRef, useState } from "react";
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
 *
 * 화면을 벗어나면 요청을 끊는다 (기획 검수 ⚠️ #17). 웹 검색이 붙어 수십 초 걸리는
 * 호출이라, 받을 곳이 사라진 뒤에도 계속 돌면 사용자 본인의 무료 한도만 축낸다.
 */
export function useCompanyAiResearch() {
  const { provider, apiKey, hasApiKey } = useAiKey();

  const [isResearching, setIsResearching] = useState(false);
  const [result, setResult] = useState<CompanyResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** 반영할 항목 — 기본값은 내용이 있는 항목 전부 선택 */
  const [selectedFields, setSelectedFields] = useState<AiResearchField[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(
    async (target: CompanyResearchTarget) => {
      if (!apiKey) return;

      // 다시 조사하면 이전 요청은 결과를 쓸 데가 없으므로 끊는다
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsResearching(true);
      setError(null);
      setResult(null);

      try {
        const research = await researchCompany({
          ...target,
          provider,
          apiKey,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setResult(research);
        setSelectedFields(
          AI_RESEARCH_FIELDS.filter((field) => research[field]?.trim()),
        );
      } catch (cause) {
        // 취소는 실패가 아니다 — 떠난 화면에 에러를 남기지 않는다
        if (controller.signal.aborted) return;

        // 키가 섞여 나갈 수 있으므로 원본 에러를 콘솔에 찍지 않는다
        setError(
          cause instanceof CompanyResearchError
            ? cause.message
            : "조사에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        );
      } finally {
        // 취소됐다면 뒤이은 조사가 이미 진행 중이거나 화면을 떠난 뒤다
        if (!controller.signal.aborted) setIsResearching(false);
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
