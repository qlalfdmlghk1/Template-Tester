import { useCallback, useState } from "react";
import { useToast } from "@/shared/ui/molecules/AppToast";
import { parseHalfId } from "@/entities/job-application/model/half";
import { useRecruitmentBoard } from "./useRecruitmentBoard";
import type { StageKey } from "@/entities/job-application/model/stage";
import type { StageEntry } from "@/entities/job-application/model/application.type";
import type { JobApplication } from "@/entities/job-application/model/application.type";
import type { ApplicationFormValue } from "../ui/ApplicationFormDialog/ApplicationFormDialog";

interface StageTarget {
  applicationId: string;
  stageKey: StageKey;
}

/**
 * 채용 페이지의 화면 상태와 액션.
 * 보드 데이터는 useRecruitmentBoard가 맡고, 여기서는 다이얼로그 개폐와
 * 저장·삭제 시 토스트·롤백 처리를 묶는다.
 */
export function useRecruitmentPage() {
  const board = useRecruitmentBoard();
  const { showToast } = useToast();

  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [stageTarget, setStageTarget] = useState<StageTarget | null>(null);
  const [formTarget, setFormTarget] = useState<JobApplication | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<JobApplication | null>(null);
  const [saving, setSaving] = useState(false);

  const { rows, addCompany, addApplication, editApplication, removeApplication, editStage } = board;

  const selectedRow = rows.find((row) => row.application.id === selectedApplicationId) ?? null;

  const stageRow = stageTarget
    ? (rows.find((row) => row.application.id === stageTarget.applicationId) ?? null)
    : null;

  /** 러프 일정 입력의 기본 연도 — 보고 있는 반기를 따른다 */
  const defaultYear =
    (board.activeHalfId ? parseHalfId(board.activeHalfId)?.year : null) ??
    new Date().getFullYear();

  const toggleRow = useCallback((applicationId: string) => {
    setSelectedApplicationId((current) => (current === applicationId ? null : applicationId));
  }, []);

  const openStageEditor = useCallback((applicationId: string, stageKey: StageKey) => {
    setStageTarget({ applicationId, stageKey });
  }, []);

  const submitForm = useCallback(
    async (value: ApplicationFormValue) => {
      setSaving(true);
      try {
        // 새 기업이면 먼저 만들고, 그 id로 지원 건을 건다
        const companyId =
          value.companyId ?? (value.newCompany ? await addCompany(value.newCompany) : null);

        if (!companyId) throw new Error("기업 정보가 없습니다.");

        const payload = {
          companyId,
          postingTitle: value.postingTitle,
          jobTag: value.jobTag,
          headcount: value.headcount,
          notAppliedReason: value.notAppliedReason,
          memo: value.memo,
        };

        if (formTarget) {
          await editApplication(formTarget.id, payload);
        } else {
          await addApplication(payload);
        }

        setFormTarget(undefined);
        showToast(formTarget ? "지원 건을 수정했습니다." : "지원 건을 추가했습니다.");
      } catch (error) {
        console.error("지원 건 저장 실패:", error);
        showToast("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", "error");
      } finally {
        setSaving(false);
      }
    },
    [formTarget, addCompany, addApplication, editApplication, showToast],
  );

  const saveStage = useCallback(
    async (entry: StageEntry) => {
      if (!stageTarget) return;

      setSaving(true);
      try {
        await editStage(stageTarget.applicationId, stageTarget.stageKey, entry);
        setStageTarget(null);
      } catch (error) {
        console.error("전형 단계 저장 실패:", error);
        showToast("저장하지 못했습니다. 이전 값으로 되돌렸습니다.", "error");
      } finally {
        setSaving(false);
      }
    },
    [stageTarget, editStage, showToast],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setSaving(true);
    try {
      await removeApplication(deleteTarget.id);
      if (selectedApplicationId === deleteTarget.id) setSelectedApplicationId(null);
      setDeleteTarget(null);
      showToast("지원 건을 삭제했습니다.");
    } catch (error) {
      console.error("지원 건 삭제 실패:", error);
      showToast("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, removeApplication, selectedApplicationId, showToast]);

  return {
    ...board,
    selectedApplicationId,
    selectedRow,
    toggleRow,

    stageTarget,
    stageRow,
    defaultYear,
    openStageEditor,
    closeStageEditor: () => setStageTarget(null),
    saveStage,

    /** undefined = 닫힘, null = 신규 등록, 객체 = 수정 */
    formTarget,
    openCreateForm: () => setFormTarget(null),
    openEditForm: (application: JobApplication) => setFormTarget(application),
    closeForm: () => setFormTarget(undefined),
    submitForm,

    deleteTarget,
    requestDelete: (application: JobApplication) => setDeleteTarget(application),
    cancelDelete: () => setDeleteTarget(null),
    confirmDelete,

    saving,
  };
}
