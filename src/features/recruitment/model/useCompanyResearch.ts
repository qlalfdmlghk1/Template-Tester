import { useCallback, useMemo, useState } from "react";
import { useToast } from "@/shared/ui/molecules/AppToast";
import { useCompanies } from "@/entities/company/model/useCompanies";
import { useApplications } from "@/entities/job-application/model/useApplications";
import { deleteApplicationsByCompany } from "@/entities/job-application/api/application.api";
import { hasResearch } from "@/entities/company/model/company.type";
import type {
  Company,
  CompanyCategory,
  CompanyInput,
} from "@/entities/company/model/company.type";

/**
 * 기업 조사 화면.
 * 지원 여부와 무관하게 기업 단위로 직무 설명·자격 요건을 모아 보고 편집한다.
 */
export function useCompanyResearch() {
  const { companies, isLoading, error, addCompany, editCompany, removeCompany, reload } =
    useCompanies();
  // 기업을 지울 때 딸린 지원 건이 몇 건인지 보여주기 위해 함께 읽는다
  const { applications, reload: reloadApplications } = useApplications();
  const { showToast } = useToast();

  const [keyword, setKeyword] = useState("");
  const [onlyResearched, setOnlyResearched] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<CompanyCategory[]>([]);
  /** undefined = 닫힘, null = 신규 등록, 객체 = 수정 */
  const [formTarget, setFormTarget] = useState<Company | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  /** 기업과 함께 딸린 지원 건도 지울지 */
  const [cascadeDelete, setCascadeDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const query = keyword.trim().toLowerCase();

    return companies.filter((company) => {
      if (onlyResearched && !hasResearch(company)) return false;

      // 분류는 여러 개 달 수 있으므로 하나라도 걸리면 통과시킨다
      if (
        selectedCategories.length > 0 &&
        !selectedCategories.some((category) => company.categories?.includes(category))
      ) {
        return false;
      }

      if (!query) return true;

      return [company.name, company.targetJob, company.jobDescription, company.requirements]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [companies, keyword, onlyResearched, selectedCategories]);

  const researchedCount = useMemo(
    () => companies.filter(hasResearch).length,
    [companies],
  );

  const submitForm = useCallback(
    async (input: CompanyInput) => {
      setSaving(true);
      try {
        if (formTarget) {
          await editCompany(formTarget.id, input);
        } else {
          await addCompany(input);
        }
        setFormTarget(undefined);
        showToast(formTarget ? "기업 정보를 수정했습니다." : "기업을 추가했습니다.");
      } catch (cause) {
        console.error("기업 저장 실패:", cause);
        showToast("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", "error");
      } finally {
        setSaving(false);
      }
    },
    [formTarget, addCompany, editCompany, showToast],
  );

  /** 삭제하려는 기업에 걸린 지원 건 수 */
  const deleteTargetApplicationCount = useMemo(
    () =>
      deleteTarget
        ? applications.filter((application) => application.companyId === deleteTarget.id).length
        : 0,
    [deleteTarget, applications],
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setSaving(true);
    try {
      // 지원 건을 먼저 지운다 — 기업이 먼저 사라지면 참조가 끊긴 지원 건이 남는다
      let removedApplications = 0;
      if (cascadeDelete) {
        removedApplications = await deleteApplicationsByCompany(deleteTarget.id);
      }

      await removeCompany(deleteTarget.id);
      if (removedApplications > 0) await reloadApplications();

      setDeleteTarget(null);
      showToast(
        removedApplications > 0
          ? `기업과 지원 건 ${removedApplications}건을 삭제했습니다.`
          : "기업을 삭제했습니다.",
      );
    } catch (cause) {
      console.error("기업 삭제 실패:", cause);
      showToast("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, cascadeDelete, removeCompany, reloadApplications, showToast]);

  return {
    companies: filtered,
    totalCount: companies.length,
    researchedCount,
    isLoading,
    error,
    reload,

    keyword,
    setKeyword,
    onlyResearched,
    setOnlyResearched,
    selectedCategories,
    setSelectedCategories,

    formTarget,
    openCreateForm: () => setFormTarget(null),
    openEditForm: (company: Company) => setFormTarget(company),
    closeForm: () => setFormTarget(undefined),
    submitForm,

    deleteTarget,
    deleteTargetApplicationCount,
    cascadeDelete,
    setCascadeDelete,
    requestDelete: (company: Company) => {
      setDeleteTarget(company);
      // 딸린 지원 건까지 지우는 것은 매번 새로 선택하게 둔다
      setCascadeDelete(false);
    },
    cancelDelete: () => setDeleteTarget(null),
    confirmDelete,

    saving,
  };
}
