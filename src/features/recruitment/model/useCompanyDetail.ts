import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCompanies } from "@/entities/company/model/useCompanies";

const LIST_PATH = "/companies/research";

/**
 * 기업 조사 보기 화면.
 *
 * 자소서를 쓸 때는 조사 내용을 읽기만 한다 — 편집 폼으로 읽으면
 * 입력 상자 안에서 스크롤하게 돼 불편하다. 읽기 전용 화면을 따로 둔다.
 */
export function useCompanyDetail(companyId?: string) {
  const { companies, isLoading, error, reload } = useCompanies();
  const navigate = useNavigate();
  // 목록의 검색어·필터를 그대로 들고 다닌다
  const { search } = useLocation();

  const company = companyId
    ? (companies.find((item) => item.id === companyId) ?? null)
    : null;

  /** 목록을 다 받아온 뒤에도 못 찾았다면 없는 기업이다 (삭제됐거나 잘못된 주소) */
  const notFound = Boolean(companyId) && !isLoading && !error && !company;

  const goToList = useCallback(
    () => navigate({ pathname: LIST_PATH, search }),
    [navigate, search],
  );

  const goToEdit = useCallback(
    () => navigate({ pathname: `${LIST_PATH}/${companyId}/edit`, search }),
    [navigate, companyId, search],
  );

  return {
    company,
    isLoading,
    error,
    notFound,
    reload,
    goToList,
    goToEdit,
  };
}
