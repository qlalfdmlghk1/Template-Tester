import { useCallback, useEffect, useRef, useState } from "react";
import {
  createApplication,
  deleteApplication,
  getApplications,
  updateApplication,
  updateApplicationStage,
} from "../api/application.api";
import type { StageKey } from "./stage";
import type {
  JobApplication,
  JobApplicationInput,
  StageEntry,
} from "./application.type";

/** 지원 건 목록 관리 (Firestore `jobApplications`) */
export function useApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 낙관적 업데이트 롤백 시 "편집 직전 값"을 렌더 밖에서 읽기 위한 최신 스냅샷
  const applicationsRef = useRef<JobApplication[]>([]);
  applicationsRef.current = applications;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setApplications(await getApplications());
    } catch (cause) {
      console.error("지원 건 목록 조회 실패:", cause);
      setError(cause instanceof Error ? cause : new Error("지원 현황을 불러오지 못했습니다."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addApplication = useCallback(
    async (input: JobApplicationInput): Promise<string> => {
      const id = await createApplication(input);
      await load();
      return id;
    },
    [load],
  );

  const editApplication = useCallback(
    async (applicationId: string, input: Partial<JobApplicationInput>): Promise<void> => {
      await updateApplication(applicationId, input);
      await load();
    },
    [load],
  );

  const removeApplication = useCallback(
    async (applicationId: string): Promise<void> => {
      await deleteApplication(applicationId);
      await load();
    },
    [load],
  );

  /**
   * 그리드 셀 편집 — 즉시 저장.
   * 화면을 먼저 바꾸고 저장하며, 실패하면 편집 직전 값으로 되돌린다.
   */
  const editStage = useCallback(
    async (applicationId: string, stageKey: StageKey, entry: StageEntry): Promise<void> => {
      // 롤백 값은 setState updater 안이 아니라 밖에서 확정한다.
      // updater 는 순수해야 하고 호출 시점도 React 가 정하므로, 그 안에서 캡처하면
      // 저장 실패 시 값이 비어 롤백이 조용히 건너뛰어질 수 있다.
      const previous = applicationsRef.current
        .find((application) => application.id === applicationId)
        ?.stages[stageKey];

      const replaceStage = (next: StageEntry) => {
        setApplications((current) =>
          current.map((application) =>
            application.id === applicationId
              ? { ...application, stages: { ...application.stages, [stageKey]: next } }
              : application,
          ),
        );
      };

      replaceStage(entry);

      try {
        await updateApplicationStage(applicationId, stageKey, entry);
      } catch (cause) {
        if (previous) {
          replaceStage(previous);
        } else {
          // 편집 직전 값을 못 잡았으면 화면이 실패한 값을 그대로 들고 있게 두지 않는다
          await load();
        }
        throw cause;
      }
    },
    [load],
  );

  return {
    applications,
    isLoading,
    error,
    addApplication,
    editApplication,
    removeApplication,
    editStage,
    reload: load,
  };
}
