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

  const isValid = title.trim().length > 0;

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
    } finally {
      setIsSubmitting(false);
    }
  }, [isValid, isSubmitting, onSubmit, platform, title, problemNo, difficulty, language, dateKey, memo, reset]);

  return {
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
    isSubmitting,
    handleSubmit,
    reset,
  };
}
