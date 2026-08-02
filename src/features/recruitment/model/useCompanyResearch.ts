import { useCallback, useMemo, useState } from "react";
import { useToast } from "@/shared/ui/molecules/AppToast";
import { useCompanies } from "@/entities/company/model/useCompanies";
import { hasResearch } from "@/entities/company/model/company.type";
import type { Company, CompanyInput } from "@/entities/company/model/company.type";

/**
 * 기업 조사 화면.
 * 지원 여부와 무관하게 기업 단위로 직무 설명·자격 요건을 모아 보고 편집한다.
 */
export function useCompanyResearch() {
  const { companies, isLoading, error, addCompany, editCompany, removeCompany, reload } =
    useCompanies();
  const { showToast } = useToast();

  const [keyword, setKeyword] = useState("");
  const [onlyResearched, setOnlyResearched] = useState(false);
  /** undefined = 닫힘, null = 신규 등록, 객체 = 수정 */
  const [formTarget, setFormTarget] = useState<Company | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const query = keyword.trim().toLowerCase();

    return companies.filter((company) => {
      if (onlyResearched && !hasResearch(company)) return false;
      if (!query) return true;

      return [company.name, company.targetJob, company.jobDescription, company.requirements]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [companies, keyword, onlyResearched]);

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

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setSaving(true);
    try {
      await removeCompany(deleteTarget.id);
      setDeleteTarget(null);
      showToast("기업을 삭제했습니다.");
    } catch (cause) {
      console.error("기업 삭제 실패:", cause);
      showToast("삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.", "error");
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, removeCompany, showToast]);

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

    formTarget,
    openCreateForm: () => setFormTarget(null),
    openEditForm: (company: Company) => setFormTarget(company),
    closeForm: () => setFormTarget(undefined),
    submitForm,

    deleteTarget,
    requestDelete: (company: Company) => setDeleteTarget(company),
    cancelDelete: () => setDeleteTarget(null),
    confirmDelete,

    saving,
  };
}
