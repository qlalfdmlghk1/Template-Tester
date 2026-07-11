import { useState, useEffect, useCallback } from "react";
import type { DailyStats } from "./stats";
import { computeDailyStats } from "./stats";
import { getConcepts } from "../api/concept.api";
import { getAttempts } from "../api/attempt.api";
import { getSubjects } from "../api/subject.api";

/** 학습 통계 로드 (concepts + attempts + subjects → 순수 계산) */
export function useDailyStats() {
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [concepts, attempts, subjects] = await Promise.all([
        getConcepts(),
        getAttempts(),
        getSubjects(),
      ]);
      setStats(computeDailyStats(concepts, attempts, subjects, Date.now()));
    } catch (error) {
      console.error("학습 통계 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, isLoading, reload: load };
}
