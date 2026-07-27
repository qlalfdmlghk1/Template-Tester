import { useState, useEffect, useCallback, useMemo } from "react";
import { calculateStreak, getTodayKey } from "@/shared/lib/date";
import {
  getSolveLogs,
  saveManualSolveLog,
  updateManualSolveLog,
  deleteSolveLog,
  type ManualLogInput,
} from "../api/solveLog.api";
import { groupByDateKey } from "./toSolveLogs";
import type { SolveLog } from "./solve-log.type";

export interface SolveLogStats {
  /** 전체 풀이 건수 */
  total: number;
  /** 기록이 있는 날 수 */
  activeDays: number;
  /** 연속 학습일 */
  streak: number;
}

/** 풀이 기록 목록 + 달력 렌더링에 필요한 파생 값 */
export function useSolveLogs() {
  const [logs, setLogs] = useState<SolveLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** @param refresh true면 세션 캐시를 무시하고 다시 읽는다 (동기화 직후) */
  const load = useCallback(async (refresh = false) => {
    setIsLoading(true);
    try {
      setLogs(await getSolveLogs({ refresh }));
      setError(null);
    } catch (cause) {
      // 조회 실패를 빈 목록으로 두면 "기록 없음"과 구분되지 않는다
      console.error("풀이 기록 조회 실패:", cause);
      setError("기록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reload = useCallback(() => load(true), [load]);

  /** 날짜 키 → 그날의 기록 (같은 날은 최신 풀이가 위로) */
  const logsByDate = useMemo(() => {
    const grouped = groupByDateKey(logs);
    grouped.forEach((dayLogs) =>
      dayLogs.sort((a, b) => b.solvedAt.getTime() - a.solvedAt.getTime()),
    );
    return grouped;
  }, [logs]);

  const stats = useMemo<SolveLogStats>(() => {
    const dateKeys = logs.map((log) => log.dateKey);
    return {
      total: logs.length,
      activeDays: new Set(dateKeys).size,
      streak: calculateStreak(dateKeys, getTodayKey()),
    };
  }, [logs]);

  // 쓰기 실패는 삼키지 않고 호출부로 던진다. UI가 사용자에게 알려야 하기 때문이다.
  // (권한 거부·오프라인일 때 "버튼이 안 먹는다"로 보이는 것을 막는다)
  const addManualLog = useCallback(async (input: ManualLogInput) => {
    const saved = await saveManualSolveLog(input);
    setLogs((prev) => [...prev, saved]);
  }, []);

  const editManualLog = useCallback(async (log: SolveLog) => {
    await updateManualSolveLog(log);
    setLogs((prev) => prev.map((item) => (item.id === log.id ? log : item)));
  }, []);

  const removeLog = useCallback(async (logId: string) => {
    await deleteSolveLog(logId);
    setLogs((prev) => prev.filter((item) => item.id !== logId));
  }, []);

  return {
    logs,
    logsByDate,
    stats,
    isLoading,
    error,
    reload,
    addManualLog,
    editManualLog,
    removeLog,
  };
}
