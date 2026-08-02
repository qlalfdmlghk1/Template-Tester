import { useCallback, useEffect, useState } from "react";
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
      let previous: StageEntry | undefined;

      setApplications((current) =>
        current.map((application) => {
          if (application.id !== applicationId) return application;
          previous = application.stages[stageKey];
          return {
            ...application,
            stages: { ...application.stages, [stageKey]: entry },
          };
        }),
      );

      try {
        await updateApplicationStage(applicationId, stageKey, entry);
      } catch (cause) {
        if (previous) {
          const rollback = previous;
          setApplications((current) =>
            current.map((application) =>
              application.id === applicationId
                ? {
                    ...application,
                    stages: { ...application.stages, [stageKey]: rollback },
                  }
                : application,
            ),
          );
        }
        throw cause;
      }
    },
    [],
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
