import { useState, useEffect, useCallback, useRef } from "react";
// features 끼리는 import 하지 않는다 (같은 레이어 슬라이스 간 참조 금지).
// uid만 필요하므로 entities/solve-log 의 api 계층이 하듯 auth 를 직접 읽는다.
import { auth } from "@/shared/api/firebase";
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

/**
 * 증분 동기화 기준 시각에서 빼는 여유. 이 구간은 다음 동기화에서 다시 훑는다.
 * 시계 오차와 GitHub commits API 캐시 지연을 함께 흡수하는 값이다.
 */
const SYNC_SAFETY_MARGIN_MS = 60 * 60 * 1000;

export interface SyncResult {
  /** 저장한 기록 건수 */
  saved: number;
  /** 훑어본 커밋 수 */
  scanned: number;
  /** 커밋이 상한을 넘어 오래된 이력을 다 읽지 못했는가 */
  truncated: boolean;
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
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  // isSyncing(state)은 다음 렌더에야 반영되므로 연타를 못 막는다. 즉시 읽히는 ref로 잠근다.
  const isRunningRef = useRef(false);

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
  }, []);

  /** 실행 후 설정의 lastSyncedAt까지 갱신한다 */
  const runSync = useCallback(
    async (repo: RepoRef, since: Date | null): Promise<SyncResult> => {
      const user = auth.currentUser;
      if (!user) throw new Error("로그인이 필요합니다.");

      // 다음 증분 동기화의 기준은 fetch를 "시작하기 전" 시각이어야 한다.
      // 완료 시각으로 찍으면 fetch가 도는 동안 올라온 커밋이 이번 결과에도 없고
      // 다음 실행의 since 이전이라 영영 조회되지 않는다.
      // 여기에 안전 여유를 더 빼는 이유:
      //   - since는 GitHub 서버 시각과 비교되는데 기준값은 사용자 PC 시계다 (오차 가능)
      //   - commits API 응답은 최대 1분가량 캐시되어 갓 올라온 커밋이 빠질 수 있다
      // 문서 ID가 결정적 키라 구간이 겹쳐도 중복 대신 덮어쓰기이므로 여유는 공짜다.
      const syncStartedAt = new Date(Date.now() - SYNC_SAFETY_MARGIN_MS);

      // 트리는 증분 동기화에서도 필요하다 — 새로 푼 문제의 번호를 찾아야 하므로
      const [commitResult, treePaths] = await Promise.all([
        fetchCommits(repo, since),
        fetchRepoTree(repo),
      ]);

      // 커밋은 읽혔는데 트리를 못 읽은 경우(예: 트리 404) 색인이 비어 모든 기록이
      // 제목 기반 폴백 ID로 저장된다. 번호 기반으로 이미 저장된 기록과 별개 문서가 되어
      // 같은 풀이가 두 건으로 남고, ID가 달라 이후 동기화로도 합쳐지지 않는다.
      // 손상이 영구적이므로 저장하지 않고 실패시킨다.
      if (treePaths.length === 0 && commitResult.commits.length > 0) {
        throw new Error("저장소 파일 목록을 읽지 못했습니다. 잠시 후 다시 시도해주세요.");
      }

      const logs = toSolveLogs({ userId: user.uid, commits: commitResult.commits, treePaths });
      await saveSolveLogs(logs);

      const nextSettings: CalendarSettings = {
        repoOwner: repo.owner,
        repoName: repo.repo,
        lastSyncedAt: syncStartedAt,
      };
      await saveCalendarSettings(nextSettings);
      setSettings(nextSettings);

      return {
        saved: logs.length,
        scanned: commitResult.commits.length,
        truncated: commitResult.truncated,
      };
    },
    [],
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
      if (isRunningRef.current) return false;

      const repo = parseRepoPath(input);
      if (!repo) {
        setError("owner/repo 형식으로 입력해주세요. (예: qlalfdmlghk1/Algorism_Python)");
        return false;
      }

      isRunningRef.current = true;
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
        isRunningRef.current = false;
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
      if (isRunningRef.current) return false;

      if (!settings?.repoOwner || !settings?.repoName) {
        setError("연결된 저장소가 없습니다.");
        return false;
      }

      isRunningRef.current = true;
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
        isRunningRef.current = false;
        setIsSyncing(false);
      }
    },
    [settings, runSync, handleFailure, onSynced],
  );

  /** 연동 해제 — 이미 쌓인 기록은 지우지 않는다 */
  const disconnect = useCallback(async () => {
    try {
      await saveCalendarSettings({ repoOwner: "", repoName: "", lastSyncedAt: null });
      setSettings(null);
      setLastResult(null);
      setError(null);
    } catch (cause) {
      // 실패하면 설정이 그대로 남아 화면은 연동 상태여야 한다.
      // 여기서 상태만 비우면 실제와 어긋나고, 조용히 넘기면 "해제가 안 먹는다"가 된다.
      handleFailure(cause);
    }
  }, [handleFailure]);

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
