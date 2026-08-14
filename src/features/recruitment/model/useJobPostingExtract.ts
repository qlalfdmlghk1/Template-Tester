import { useCallback, useEffect, useRef, useState } from "react";
import { useAiKey } from "@/shared/lib/useAiKey";
import {
  extractPosting,
  PostingExtractError,
} from "@/entities/job-application/api/posting.api";
import type {
  PostingExtractErrorKind,
  PostingExtractResult,
  PostingExtractTarget,
} from "@/entities/job-application/api/posting.api";
import { POSTING_FIELDS } from "@/entities/job-application/model/application.type";
import type {
  JobApplication,
  PostingField,
} from "@/entities/job-application/model/application.type";
import { filterProposableSchedules } from "@/entities/job-application/model/posting";
import { parsePostingSchedules } from "@/entities/job-application/model/postingSchedule";
import type { PostingScheduleDraft } from "@/entities/job-application/model/postingSchedule";
import type { StageKey } from "@/entities/job-application/model/stage";

interface UseJobPostingExtractOptions {
  /**
   * 반영 대상 판정과 기존 값 비교에 쓴다.
   * 신규 등록 폼처럼 아직 저장 전이면 null — 그때는 모든 일정을 제안한다.
   */
  application: JobApplication | null;
  /**
   * 공고에 연도가 없을 때 채울 기준 연도.
   * 보고 있는 반기의 연도를 넘긴다 — 수동 일정 입력과 같은 기준이라 결과가 어긋나지 않는다.
   */
  referenceYear: number;
}

/**
 * 공고 추출 AI 실행 상태.
 *
 * 결과는 곧바로 저장하지 않는다 — AI 응답은 초안이므로 사용자가 항목별로 골라 반영한다.
 * 기업 조사(`useCompanyAiResearch`)에서 확립한 정책을 그대로 따른다.
 *
 * 화면을 벗어나면 요청을 끊는다. 서버 도구로 공고를 가져오느라 수십 초 걸리는
 * 호출이라, 받을 곳이 사라진 뒤에도 계속 돌면 사용자 본인의 한도만 축낸다.
 */
export function useJobPostingExtract({
  application,
  referenceYear,
}: UseJobPostingExtractOptions) {
  const { provider, apiKey, hasApiKey } = useAiKey();

  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<PostingExtractResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  /**
   * 실패 종류.
   *
   * 공고를 못 읽은 실패(`fetchBlocked`)는 사용자가 본문을 붙여넣으면 해결되므로,
   * 화면이 폴백 경로로 유도할 수 있게 종류를 따로 노출한다.
   */
  const [errorKind, setErrorKind] = useState<PostingExtractErrorKind | null>(null);
  /** 반영할 항목 — 기본값은 내용이 있는 항목 전부 선택 */
  const [selectedFields, setSelectedFields] = useState<PostingField[]>([]);
  /** 검증을 통과하고 제안해도 되는 일정만 남긴 목록 */
  const [scheduleDrafts, setScheduleDrafts] = useState<PostingScheduleDraft[]>([]);
  const [selectedStages, setSelectedStages] = useState<StageKey[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  /**
   * 실행하고 결과를 돌려준다.
   *
   * 상태로도 남기지만 반환도 하는 것은, 신규 등록 폼처럼 결과를 곧바로 폼에 채워야 하는
   * 화면이 `result` 변화를 effect 로 감시하지 않아도 되게 하기 위해서다.
   * 실패·취소·키 없음이면 null.
   */
  const run = useCallback(
    async (
      target: PostingExtractTarget,
    ): Promise<{
      result: PostingExtractResult;
      scheduleDrafts: PostingScheduleDraft[];
    } | null> => {
      if (!apiKey) return null;

      // 다시 실행하면 이전 요청은 결과를 쓸 데가 없으므로 끊는다
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsExtracting(true);
      setError(null);
      setErrorKind(null);
      setResult(null);
      setScheduleDrafts([]);

      try {
        const extracted = await extractPosting({
          ...target,
          provider,
          apiKey,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return null;

        setResult(extracted);
        setSelectedFields(
          POSTING_FIELDS.filter((field) => extracted[field]?.trim()),
        );

        // 손대지 않은 칸에만 제안한다 — 여기서 걸러 화면에 아예 올리지 않는다
        const drafts = filterProposableSchedules(
          application,
          parsePostingSchedules(extracted.rawSchedules, referenceYear),
        );
        setScheduleDrafts(drafts);
        setSelectedStages(drafts.map((draft) => draft.stage));

        return { result: extracted, scheduleDrafts: drafts };
      } catch (cause) {
        // 취소는 실패가 아니다 — 떠난 화면에 에러를 남기지 않는다
        if (controller.signal.aborted) return null;

        // 키가 섞여 나갈 수 있으므로 원본 에러를 콘솔에 찍지 않는다
        if (cause instanceof PostingExtractError) {
          setError(cause.message);
          setErrorKind(cause.kind);
        } else {
          setError("공고를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
          setErrorKind("unknown");
        }

        return null;
      } finally {
        // 취소됐다면 뒤이은 실행이 이미 진행 중이거나 화면을 떠난 뒤다
        if (!controller.signal.aborted) setIsExtracting(false);
      }
    },
    [apiKey, provider, application, referenceYear],
  );

  const toggleField = useCallback((field: PostingField) => {
    setSelectedFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field],
    );
  }, []);

  const toggleStage = useCallback((stage: StageKey) => {
    setSelectedStages((current) =>
      current.includes(stage)
        ? current.filter((item) => item !== stage)
        : [...current, stage],
    );
  }, []);

  const dismiss = useCallback(() => {
    setResult(null);
    setError(null);
    setErrorKind(null);
    setSelectedFields([]);
    setScheduleDrafts([]);
    setSelectedStages([]);
  }, []);

  return {
    hasApiKey,
    isExtracting,
    result,
    error,
    /** `fetchBlocked` 면 본문 붙여넣기로 유도한다 */
    errorKind,
    selectedFields,
    scheduleDrafts,
    selectedStages,
    run,
    toggleField,
    toggleStage,
    dismiss,
  };
}
