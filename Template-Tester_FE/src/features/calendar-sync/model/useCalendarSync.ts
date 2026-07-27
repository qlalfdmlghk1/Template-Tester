import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth/model/useAuth";
import {
  fetchCommits,
  fetchRepoTree,
  verifyRepo,
  GithubApiError,
  type RepoRef,
} from "@/entities/solve-log/api/github.api";
import {
  getCalendarSettings,
  saveCalendarSettings,
  parseRepoPath,
} from "@/entities/solve-log/api/calendarSettings.api";
import { saveSolveLogs } from "@/entities/solve-log/api/solveLog.api";
import { toSolveLogs } from "@/entities/solve-log/model/toSolveLogs";
import type { CalendarSettings } from "@/entities/solve-log/model/solve-log.type";

export interface SyncResult {
  /** 저장한 기록 건수 */
  saved: number;
  /** 훑어본 커밋 수 */
  scanned: number;
}

interface UseCalendarSyncOptions {
  /** 동기화가 끝나 기록이 바뀌었을 때 (목록 새로고침용) */
  onSynced?: () => void;
}

/**
 * GitHub 저장소 연동과 동기화 실행.
 *
 * 전체 백필과 증분 동기화 모두 같은 경로를 탄다. 차이는 커밋 조회에 `since`를
 * 붙이는지 뿐이고, 문서 ID가 결정적이라 구간이 겹쳐도 중복이 생기지 않는다.
 */
export function useCalendarSync({ onSynced }: UseCalendarSyncOptions = {}) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    getCalendarSettings()
      .then((loaded) => {
        if (!cancelled) setSettings(loaded);
      })
      .catch((cause) => console.error("달력 설정 조회 실패:", cause))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  /** 실행 후 설정의 lastSyncedAt까지 갱신한다 */
  const runSync = useCallback(
    async (repo: RepoRef, since: Date | null): Promise<SyncResult> => {
      if (!user) throw new Error("로그인이 필요합니다.");

      // 트리는 증분 동기화에서도 필요하다 — 새로 푼 문제의 번호를 찾아야 하므로
      const [commits, treePaths] = await Promise.all([
        fetchCommits(repo, since),
        fetchRepoTree(repo),
      ]);

      const logs = toSolveLogs({ userId: user.uid, commits, treePaths });
      await saveSolveLogs(logs);

      const nextSettings: CalendarSettings = {
        repoOwner: repo.owner,
        repoName: repo.repo,
        lastSyncedAt: new Date(),
      };
      await saveCalendarSettings(nextSettings);
      setSettings(nextSettings);

      return { saved: logs.length, scanned: commits.length };
    },
    [user],
  );

  const handleFailure = useCallback((cause: unknown) => {
    if (cause instanceof GithubApiError) {
      const suffix = cause.resetAt
        ? ` (${cause.resetAt.toLocaleTimeString("ko-KR")} 이후 재시도 가능)`
        : "";
      setError(`${cause.message}${suffix}`);
      return;
    }

    console.error("동기화 실패:", cause);
    setError(cause instanceof Error ? cause.message : "동기화에 실패했습니다.");
  }, []);

  /**
   * 저장소 연결 — 경로 검증 후 전체 히스토리를 백필한다.
   *
   * @param input `owner/repo` 또는 GitHub URL
   */
  const connectRepo = useCallback(
    async (input: string): Promise<boolean> => {
      const repo = parseRepoPath(input);
      if (!repo) {
        setError("owner/repo 형식으로 입력해주세요. (예: qlalfdmlghk1/Algorism_Python)");
        return false;
      }

      setIsSyncing(true);
      setError(null);
      try {
        await verifyRepo(repo);
        setLastResult(await runSync(repo, null));
        onSynced?.();
        return true;
      } catch (cause) {
        handleFailure(cause);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [runSync, handleFailure, onSynced],
  );

  /**
   * 이미 연결된 저장소 재동기화.
   *
   * @param full true면 전체 히스토리를 다시 훑는다 (기록이 어긋났을 때 복구용)
   */
  const resync = useCallback(
    async (full = false): Promise<boolean> => {
      if (!settings) {
        setError("연결된 저장소가 없습니다.");
        return false;
      }

      setIsSyncing(true);
      setError(null);
      try {
        const repo: RepoRef = { owner: settings.repoOwner, repo: settings.repoName };
        setLastResult(await runSync(repo, full ? null : settings.lastSyncedAt));
        onSynced?.();
        return true;
      } catch (cause) {
        handleFailure(cause);
        return false;
      } finally {
        setIsSyncing(false);
      }
    },
    [settings, runSync, handleFailure, onSynced],
  );

  /** 연동 해제 — 이미 쌓인 기록은 지우지 않는다 */
  const disconnect = useCallback(async () => {
    await saveCalendarSettings({ repoOwner: "", repoName: "", lastSyncedAt: null });
    setSettings(null);
    setLastResult(null);
    setError(null);
  }, []);

  const isConnected = Boolean(settings?.repoOwner && settings?.repoName);

  return {
    settings,
    isConnected,
    isLoading,
    isSyncing,
    error,
    lastResult,
    connectRepo,
    resync,
    disconnect,
    clearError: () => setError(null),
  };
}
