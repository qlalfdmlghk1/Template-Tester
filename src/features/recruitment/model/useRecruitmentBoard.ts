import { useCallback, useMemo, useState } from "react";
import { useCompanies } from "@/entities/company/model/useCompanies";
import { useApplications } from "@/entities/job-application/model/useApplications";
import {
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
}

const EMPTY_FILTER: RecruitmentFilter = { jobTags: [], statuses: [], categories: [] };

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

  const halfIds = useMemo(() => collectHalfIds(applications), [applications]);

  // 선택값이 없거나 더 이상 존재하지 않는 반기를 가리키면 현재 반기로, 그마저 없으면 첫 반기로 떨어진다.
  const activeHalfId = useMemo(() => {
    if (selectedHalfId && halfIds.includes(selectedHalfId)) return selectedHalfId;
    const currentHalfId = getCurrentHalfId();
    if (halfIds.includes(currentHalfId)) return currentHalfId;
    return halfIds[0] ?? null;
  }, [selectedHalfId, halfIds]);

  const companyMap = useMemo(
    () => new Map(companies.map((company) => [company.id, company])),
    [companies],
  );

  /** 선택된 반기에 속한 지원 건 — 합격률은 필터와 무관하게 이 집합으로 낸다 */
  const halfApplications = useMemo(
    () =>
      activeHalfId
        ? applications.filter((application) => getApplicationHalfId(application) === activeHalfId)
        : [],
    [applications, activeHalfId],
  );

  const rows = useMemo(() => {
    const filtered = halfApplications.filter((application) => {
      if (filter.jobTags.length > 0 && !filter.jobTags.includes(application.jobTag)) {
        return false;
      }
      if (
        filter.statuses.length > 0 &&
        !filter.statuses.includes(getApplicationStatus(application))
      ) {
        return false;
      }
      if (filter.categories.length > 0) {
        const categories = companyMap.get(application.companyId)?.categories ?? [];
        if (!filter.categories.some((category) => categories.includes(category))) return false;
      }
      return true;
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
  }, [halfApplications, filter, companyMap]);

  const passRates = useMemo(() => calcPassRates(halfApplications), [halfApplications]);

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
