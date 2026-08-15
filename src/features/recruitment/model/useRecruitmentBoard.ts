import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "@/shared/lib/useDebounce";
import { useCompanies } from "@/entities/company/model/useCompanies";
import { useApplications } from "@/entities/job-application/model/useApplications";
import {
  ALL_HALF_ID,
  collectHalfIds,
  getApplicationHalfId,
  getCurrentHalfId,
} from "@/entities/job-application/model/half";
import { compareSchedules } from "@/entities/job-application/model/schedule";
import { HALF_ANCHOR_STAGE } from "@/entities/job-application/model/stage";
import {
  calcPassRates,
  getApplicationStatus,
  getCurrentStage,
  getUpcomingSchedule,
} from "@/entities/job-application/model/stats";
import type { Company, CompanyCategory } from "@/entities/company/model/company.type";
import type { HalfId } from "@/entities/job-application/model/half";
import type { JobTag, StageKey } from "@/entities/job-application/model/stage";
import type { UpcomingSchedule } from "@/entities/job-application/model/stats";
import type {
  ApplicationStatus,
  JobApplication,
} from "@/entities/job-application/model/application.type";

/** 그리드 한 행 / 카드 한 장에 필요한 값 묶음 */
export interface RecruitmentRow {
  application: JobApplication;
  /** 참조가 끊긴 지원 건이 있을 수 있어 null을 허용한다 */
  company: Company | null;
  status: ApplicationStatus;
  currentStage: StageKey | null;
  upcoming: UpcomingSchedule | null;
}

export interface RecruitmentFilter {
  jobTags: JobTag[];
  statuses: ApplicationStatus[];
  /** 기업 유형 — 지원 건이 아니라 참조하는 기업의 속성으로 거른다 */
  categories: CompanyCategory[];
  /** 기업명 검색어 */
  keyword: string;
}

const EMPTY_FILTER: RecruitmentFilter = {
  jobTags: [],
  statuses: [],
  categories: [],
  keyword: "",
};

/**
 * 채용 현황 보드.
 * 기업·지원 건을 조인하고 반기 선택, 정렬(자소서 마감일순), 필터, 합격률 집계를 묶어 돌려준다.
 */
export function useRecruitmentBoard() {
  const {
    companies,
    isLoading: isCompaniesLoading,
    error: companiesError,
    addCompany,
    editCompany,
    reload: reloadCompanies,
  } = useCompanies();

  const {
    applications,
    isLoading: isApplicationsLoading,
    error: applicationsError,
    addApplication,
    editApplication,
    removeApplication,
    editStage,
    reload: reloadApplications,
  } = useApplications();

  const [selectedHalfId, setSelectedHalfId] = useState<HalfId | null>(null);
  const [filter, setFilter] = useState<RecruitmentFilter>(EMPTY_FILTER);

  /**
   * 검색어는 잠잠해진 뒤에만 목록에 반영한다.
   *
   * 입력값(`filter.keyword`) 자체는 즉시 반영해야 한글 조합이 끊기지 않으므로,
   * 걸러내는 쪽만 늦춘다.
   */
  const debouncedKeyword = useDebounce(filter.keyword);

  const halfIds = useMemo(() => collectHalfIds(applications), [applications]);

  // 선택값이 없거나 더 이상 존재하지 않는 반기를 가리키면 현재 반기로, 그마저 없으면 최신 반기로 떨어진다.
  // "전체"는 halfIds 맨 앞에 있지만 최후 폴백으로만 쓴다 — 실제 반기가 있으면 그쪽을 먼저 보여준다.
  const activeHalfId = useMemo(() => {
    if (selectedHalfId && halfIds.includes(selectedHalfId)) return selectedHalfId;
    const currentHalfId = getCurrentHalfId();
    if (halfIds.includes(currentHalfId)) return currentHalfId;
    return halfIds.find((id) => id !== ALL_HALF_ID) ?? ALL_HALF_ID;
  }, [selectedHalfId, halfIds]);

  const companyMap = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );

  /**
   * 선택된 반기에 속한 지원 건.
   * "전체"를 고르면 반기를 가리지 않고 미분류 건까지 모두 포함한다.
   */
  const halfApplications = useMemo(
    () =>
      activeHalfId === ALL_HALF_ID
        ? applications
        : applications.filter((application) => getApplicationHalfId(application) === activeHalfId),
    [applications, activeHalfId],
  );

  /**
   * 합격률 모수 — 반기에 직무·기업분류 필터까지 적용한 집합.
   *
   * 상태 필터는 일부러 뺀다. 상태로 걸러낸 뒤 합격률을 내면 "탈락만 보기 → 전 단계 0%",
   * "합격만 보기 → 100%"처럼 필터가 곧 답이 되어 수치가 의미를 잃는다.
   * 반면 직무·기업분류는 "FE 합격률", "대기업 합격률"처럼 묻는 값이 성립한다.
   */
  const scopedApplications = useMemo(
    () =>
      halfApplications.filter((application) => {
        if (filter.jobTags.length > 0 && !filter.jobTags.includes(application.jobTag)) {
          return false;
        }
        if (filter.categories.length > 0) {
          const categories = companyMap.get(application.companyId)?.categories ?? [];
          if (!filter.categories.some((category) => categories.includes(category))) return false;
        }
        return true;
      }),
    [halfApplications, filter.jobTags, filter.categories, companyMap],
  );

  const rows = useMemo(() => {
    // 기업명 검색은 합격률 모수에서 뺀다 — 특정 기업을 찾아보는 조회이지
    // "이 조건의 합격률"처럼 물을 수 있는 구분이 아니다(상태 필터와 같은 이유).
    const query = debouncedKeyword.trim().toLowerCase();

    const filtered = scopedApplications.filter((application) => {
      if (
        filter.statuses.length > 0 &&
        !filter.statuses.includes(getApplicationStatus(application))
      ) {
        return false;
      }

      if (!query) return true;

      // 참조가 끊긴 지원 건은 기업명을 알 수 없어 검색어가 있으면 걸러진다
      return (companyMap.get(application.companyId)?.name ?? "")
        .toLowerCase()
        .includes(query);
    });

    const sorted = [...filtered].sort((a, b) =>
      compareSchedules(a.stages[HALF_ANCHOR_STAGE]?.schedule, b.stages[HALF_ANCHOR_STAGE]?.schedule),
    );

    return sorted.map<RecruitmentRow>((application) => ({
      application,
      company: companyMap.get(application.companyId) ?? null,
      status: getApplicationStatus(application),
      currentStage: getCurrentStage(application),
      upcoming: getUpcomingSchedule(application),
    }));
  }, [scopedApplications, filter.statuses, debouncedKeyword, companyMap]);

  const passRates = useMemo(() => calcPassRates(scopedApplications), [scopedApplications]);

  const reload = useCallback(async () => {
    await Promise.all([reloadCompanies(), reloadApplications()]);
  }, [reloadCompanies, reloadApplications]);

  const resetFilter = useCallback(() => setFilter(EMPTY_FILTER), []);

  return {
    rows,
    companies,
    passRates,
    halfIds,
    activeHalfId,
    selectHalf: setSelectedHalfId,
    filter,
    setFilter,
    resetFilter,
    isLoading: isCompaniesLoading || isApplicationsLoading,
    error: applicationsError ?? companiesError,
    /** 필터 때문이 아니라 실제로 데이터가 없는 상태 */
    isEmpty: applications.length === 0,
    /** 반기·필터와 무관한 전체 지원 건 수 */
    totalCount: applications.length,
    addCompany,
    editCompany,
    addApplication,
    editApplication,
    removeApplication,
    editStage,
    reload,
  };
}
