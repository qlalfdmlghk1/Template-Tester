import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/shared/lib/useDebounce";
import { useToast } from "@/shared/ui/molecules/AppToast";
import { useCompanies } from "@/entities/company/model/useCompanies";
import { useApplications } from "@/entities/job-application/model/useApplications";
import { deleteApplicationsByCompany } from "@/entities/job-application/api/application.api";
import {
  COMPANY_CATEGORIES,
  hasResearch,
} from "@/entities/company/model/company.type";
import type { Company, CompanyCategory } from "@/entities/company/model/company.type";

/**
 * 기업 조사 목록 화면.
 *
 * 등록·수정은 별도 페이지(`/companies/research/new`, `/:id`)에서 처리한다 —
 * 조사 항목이 많아 모달로는 좁다.
 *
 * 검색어·필터는 URL 쿼리에 둔다. 수정 페이지에 다녀와도 유지돼야 하고,
 * 그 김에 필터가 걸린 목록을 링크로 공유할 수도 있다.
 */
export function useCompanyResearch() {
  const { companies, isLoading, error, removeCompany, reload } = useCompanies();
  // 기업을 지울 때 딸린 지원 건이 몇 건인지 보여주기 위해 함께 읽는다
  const { applications, reload: reloadApplications } = useApplications();
  const { showToast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();

  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  /** 기업과 함께 딸린 지원 건도 지울지 */
  const [cascadeDelete, setCascadeDelete] = useState(false);
  const [saving, setSaving] = useState(false);

  const urlKeyword = searchParams.get("q") ?? "";
  const onlyResearched = searchParams.get("researched") === "1";
  const selectedCategories = useMemo(() => {
    const raw = searchParams.get("category")?.split(",") ?? [];
    return raw.filter((value): value is CompanyCategory =>
      COMPANY_CATEGORIES.includes(value as CompanyCategory),
    );
  }, [searchParams]);

  /** 빈 값은 쿼리에서 빼서 주소가 지저분해지지 않게 한다 */
  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          Object.entries(patch).forEach(([key, value]) => {
            if (value) next.set(key, value);
            else next.delete(key);
          });
          return next;
        },
        // 검색어는 타이핑마다 바뀌므로 기록을 쌓지 않는다
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /**
   * 입력창은 로컬 상태로 둔다.
   *
   * 타이핑마다 주소를 갱신하면 그때마다 리렌더가 일어나 한글 조합이 끊긴다
   * ("삼성" → "ㅅ사삼ㅅ서성"). 입력은 즉시 로컬에 반영하고, 잠잠해진 뒤에만
   * 주소·필터에 넘긴다.
   */
  const [keyword, setKeyword] = useState(urlKeyword);
  const debouncedKeyword = useDebounce(keyword);

  /** 우리가 방금 쓴 값인지 구분해, 되돌아온 주소로 입력창을 덮어쓰지 않는다 */
  const lastWritten = useRef(urlKeyword);

  useEffect(() => {
    if (debouncedKeyword === lastWritten.current) return;

    lastWritten.current = debouncedKeyword;
    updateParams({ q: debouncedKeyword });
  }, [debouncedKeyword, updateParams]);

  // 뒤로가기 등으로 주소가 밖에서 바뀌면 입력창을 맞춘다
  useEffect(() => {
    if (urlKeyword === lastWritten.current) return;

    lastWritten.current = urlKeyword;
    setKeyword(urlKeyword);
  }, [urlKeyword]);

  const setOnlyResearched = useCallback(
    (value: boolean) => updateParams({ researched: value ? "1" : null }),
    [updateParams],
  );

  const setSelectedCategories = useCallback(
    (values: CompanyCategory[]) =>
      updateParams({ category: values.length > 0 ? values.join(",") : null }),
    [updateParams],
  );

  const filtered = useMemo(() => {
    // 타이핑 중 매 글자마다 전체 목록을 다시 거르지 않는다
    const query = debouncedKeyword.trim().toLowerCase();

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
  }, [companies, debouncedKeyword, onlyResearched, selectedCategories]);

  const researchedCount = useMemo(
    () => companies.filter(hasResearch).length,
    [companies],
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
