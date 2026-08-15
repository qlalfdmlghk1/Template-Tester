import { useCallback, useState } from "react";
import { useToast } from "@/shared/ui/molecules/AppToast";
import { deleteAllCompanies } from "@/entities/company/api/company.api";
import { deleteAllApplications } from "@/entities/job-application/api/application.api";
import {
  ALL_HALF_ID,
  getCurrentHalfId,
  getStagesHalfId,
  parseHalfId,
} from "@/entities/job-application/model/half";
import { useRecruitmentBoard } from "./useRecruitmentBoard";
import { useXlsxImport } from "./useXlsxImport";
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
  const [importOpen, setImportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    rows,
    activeHalfId,
    addCompany,
    addApplication,
    editApplication,
    removeApplication,
    editStage,
    selectHalf,
  } = board;

  const xlsxImport = useXlsxImport({ companies: board.companies, onDone: board.reload });

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
          postingUrl: value.postingUrl,
          jobTag: value.jobTag,
          headcount: value.headcount,
          notAppliedReason: value.notAppliedReason,
          memo: value.memo,
          jobDescription: value.jobDescription,
          requirements: value.requirements,
          preferredQualifications: value.preferredQualifications,
          extractedAt: value.extractedAt,
          // 단계 맵은 폼이 들고 있는 필드가 아니라 공고 추출이 채웠을 때만 생긴다.
          // 키를 항상 실으면 추출 없이 저장한 수정에서 undefined 가 넘어가고,
          // toUpdatePayload 가 그걸 deleteField() 로 바꿔 전형 상태·일정·메모가 통째로 지워진다.
          ...(value.stages ? { stages: value.stages } : {}),
        };

        if (formTarget) {
          await editApplication(formTarget.id, payload);
        } else {
          await addApplication(payload);
          // 새 건이 어느 반기에 붙는지는 일정이 정한다. 공고 추출로 자소서 마감일이
          // 채워졌다면 등록 시점이 아니라 그 날짜의 반기로 귀속되므로, 일정에서 먼저
          // 계산하고 없을 때만 등록 시점으로 떨어뜨린다.
          //
          // 다른 반기를 보고 있었다면 방금 만든 건이 목록에 없어 사라진 것처럼 보이므로
          // 그 건이 있는 반기로 옮겨 준다.
          //
          // "전체"를 보고 있을 때는 옮기지 않는다 — 새 건이 이미 목록에 있는데
          // 반기를 지정하면 사용자가 일부러 넓혀 둔 시야를 도로 좁히게 된다.
          if (activeHalfId !== ALL_HALF_ID) {
            const half =
              (value.stages ? getStagesHalfId(value.stages) : null) ?? getCurrentHalfId();
            selectHalf(half);
          }
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
    [formTarget, addCompany, addApplication, editApplication, activeHalfId, selectHalf, showToast],
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

  /**
   * 채용 데이터를 통째로 지운다.
   * 시트를 다시 가져올 때 기존 건 위에 중복으로 쌓이는 것을 막는 용도이며 되돌릴 수 없다.
   */
  const confirmResetAll = useCallback(async () => {
    setSaving(true);
    try {
      // 지원 건을 먼저 지운다 — 기업이 먼저 사라지면 참조가 끊긴 지원 건이 남는다
      const removedApplications = await deleteAllApplications();
      const removedCompanies = await deleteAllCompanies();

      setSelectedApplicationId(null);
      setResetOpen(false);
      await board.reload();

      showToast(`지원 건 ${removedApplications}건, 기업 ${removedCompanies}건을 삭제했습니다.`);
    } catch (error) {
      console.error("채용 데이터 전체 삭제 실패:", error);
      showToast("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      setSaving(false);
    }
  }, [board, showToast]);

  const closeImport = useCallback(() => {
    setImportOpen(false);
    xlsxImport.reset();
  }, [xlsxImport]);

  const applyImport = useCallback(async () => {
    const { created, failed, research } = await xlsxImport.applySelected();

    if (created > 0 || research > 0) {
      const done = [
        created > 0 ? `지원 건 ${created}건` : null,
        research > 0 ? `기업 조사 ${research}건` : null,
      ]
        .filter(Boolean)
        .join(", ");

      showToast(
        failed > 0 ? `${done}을 가져왔습니다. ${failed}건은 실패했습니다.` : `${done}을 가져왔습니다.`,
        failed > 0 ? "error" : "success",
      );
      closeImport();
      return;
    }

    showToast("가져오지 못했습니다. 잠시 후 다시 시도해 주세요.", "error");
  }, [xlsxImport, showToast, closeImport]);

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

    resetOpen,
    openReset: () => setResetOpen(true),
    cancelReset: () => setResetOpen(false),
    confirmResetAll,

    importOpen,
    openImport: () => setImportOpen(true),
    closeImport,
    applyImport,
    xlsxImport,

    saving,
  };
}
