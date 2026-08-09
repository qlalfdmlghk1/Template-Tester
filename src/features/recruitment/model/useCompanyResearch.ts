import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "@/shared/lib/useDebounce";
import { useCompanies } from "@/entities/company/model/useCompanies";
import {
  COMPANY_CATEGORIES,
  hasResearch,
} from "@/entities/company/model/company.type";
import type { CompanyCategory } from "@/entities/company/model/company.type";

/**
 * 기업 조사 목록 화면.
 *
 * 보기·등록·수정은 별도 페이지에서 처리한다. 삭제도 편집 화면으로 옮겼다 —
 * 목록 카드에 파괴적인 버튼을 두면 잘못 누르기 쉽다.
 *
 * 검색어·필터는 URL 쿼리에 둔다. 수정 페이지에 다녀와도 유지돼야 하고,
 * 그 김에 필터가 걸린 목록을 링크로 공유할 수도 있다.
 */
export function useCompanyResearch() {
  const { companies, isLoading, error, reload } = useCompanies();

  const [searchParams, setSearchParams] = useSearchParams();

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

  // 뒤로가기 등으로 주소가 밖에서 바뀌면 입력창을 맞춘다.
  // effect 로 하면 한 박자 늦게 반영되므로 렌더 중에 조정한다(React 권장 패턴).
  const [syncedKeyword, setSyncedKeyword] = useState(urlKeyword);
  if (syncedKeyword !== urlKeyword) {
    setSyncedKeyword(urlKeyword);
    setKeyword(urlKeyword);
  }

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

      // 인재상·사업 내용·최근 이슈는 일부러 뺐다.
      // AI가 채우는 항목이라 문단 단위로 길어, 인덱스 없이 전건을 훑는 지금 방식에서는
      // 부담이 커진다. 검색이 필요해지면 별도 색인을 두고 다시 검토한다.
      return [company.name, company.targetJob, company.jobDescription, company.requirements]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [companies, debouncedKeyword, onlyResearched, selectedCategories]);

  const researchedCount = useMemo(
    () => companies.filter(hasResearch).length,
    [companies],
  );

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
  };
}
