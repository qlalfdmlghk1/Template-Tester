import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "@/shared/ui/molecules/AppToast";
import { useCompanies } from "@/entities/company/model/useCompanies";
import type { CompanyInput } from "@/entities/company/model/company.type";

/** 저장·취소 후 돌아갈 목록 */
const LIST_PATH = "/companies/research";

/**
 * 기업 등록·수정 화면.
 *
 * `companyId` 가 없으면 신규 등록이다. 조사 항목이 많아 모달로는 좁아서
 * 별도 페이지로 두고, 저장·취소 시 목록으로 돌아간다.
 */
export function useCompanyForm(companyId?: string) {
  const { companies, isLoading, error, addCompany, editCompany, reload } = useCompanies();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { search } = useLocation();

  const [saving, setSaving] = useState(false);

  const company = companyId
    ? (companies.find((item) => item.id === companyId) ?? null)
    : null;

  /** 목록을 다 받아온 뒤에도 못 찾았다면 없는 기업이다 (삭제됐거나 잘못된 주소) */
  const notFound = Boolean(companyId) && !isLoading && !error && !company;

  /**
   * 목록으로 돌아갈 때 검색어·필터를 그대로 들고 간다.
   * 목록이 필터를 URL 쿼리에 두고, 여기까지 그 쿼리를 물고 왔기에 가능하다.
   */
  const goToList = useCallback(
    () => navigate({ pathname: LIST_PATH, search }),
    [navigate, search],
  );

  const submit = useCallback(
    async (input: CompanyInput) => {
      setSaving(true);
      try {
        if (companyId) {
          await editCompany(companyId, input);
        } else {
          await addCompany(input);
        }
        showToast(companyId ? "기업 정보를 수정했습니다." : "기업을 추가했습니다.");
        goToList();
      } catch (cause) {
        console.error("기업 저장 실패:", cause);
        showToast("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", "error");
      } finally {
        setSaving(false);
      }
    },
    [companyId, addCompany, editCompany, showToast, goToList],
  );

  return {
    company,
    isLoading,
    error,
    notFound,
    saving,
    submit,
    cancel: goToList,
    reload,
  };
}
