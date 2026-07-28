import { useState, useCallback } from "react";
import type { ManualLogInput } from "../api/solveLog.api";
import type { SolvePlatform } from "./solve-log.type";

interface UseManualLogFormOptions {
  dateKey: string;
  onSubmit: (input: ManualLogInput) => Promise<void>;
}

/** 수동 풀이 기록 입력 폼 상태 */
export function useManualLogForm({ dateKey, onSubmit }: UseManualLogFormOptions) {
  const [platform, setPlatform] = useState<SolvePlatform>("programmers");
  const [title, setTitle] = useState("");
  const [problemNo, setProblemNo] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [language, setLanguage] = useState("");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 문제 번호는 그대로 문제 URL에 들어간다. 숫자가 아니면 깨진 링크가 만들어지므로
  // 조용히 버리지 않고 입력 자체를 막아 사용자가 고칠 수 있게 한다.
  const hasInvalidProblemNo = problemNo.trim().length > 0 && !/^\d+$/.test(problemNo.trim());
  const isValid = title.trim().length > 0 && !hasInvalidProblemNo;

  const reset = useCallback(() => {
    setTitle("");
    setProblemNo("");
    setDifficulty("");
    setLanguage("");
    setMemo("");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        platform,
        title: title.trim(),
        problemNo: problemNo.trim() || null,
        difficulty: difficulty.trim() || null,
        language: language.trim() || null,
        dateKey,
        memo: memo.trim() || null,
      });
      reset();
    } catch (cause) {
      // 실패했으면 입력값을 지우지 않는다 — 사용자가 다시 타이핑하지 않아도 되게
      console.error("수동 기록 저장 실패:", cause);
      setError("기록을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, isSubmitting, onSubmit, platform, title, problemNo, difficulty, language, dateKey, memo, reset]);

  return {
    error,
    platform,
    setPlatform,
    title,
    setTitle,
    problemNo,
    setProblemNo,
    difficulty,
    setDifficulty,
    language,
    setLanguage,
    memo,
    setMemo,
    isValid,
    hasInvalidProblemNo,
    isSubmitting,
    handleSubmit,
    reset,
  };
}
