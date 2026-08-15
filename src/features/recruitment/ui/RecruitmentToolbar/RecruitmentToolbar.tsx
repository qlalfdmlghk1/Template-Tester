import { AppSelect } from "@/shared/ui/atoms/AppSelect";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { formatHalfId } from "@/entities/job-application/model/half";
import {
  COMPANY_CATEGORIES,
  COMPANY_CATEGORY_LABELS,
} from "@/entities/company/model/company.type";
import { JOB_TAGS } from "@/entities/job-application/model/stage";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
} from "@/entities/job-application/model/application.type";
import type { SelectValue } from "@/shared/ui/atoms/AppSelect";
import type { HalfId } from "@/entities/job-application/model/half";
import type { JobTag } from "@/entities/job-application/model/stage";
import type { ApplicationStatus } from "@/entities/job-application/model/application.type";
import type { CompanyCategory } from "@/entities/company/model/company.type";
import type { RecruitmentFilter } from "../../model/useRecruitmentBoard";

interface RecruitmentToolbarProps {
  halfIds: HalfId[];
  activeHalfId: HalfId | null;
  onSelectHalf: (halfId: HalfId) => void;
  filter: RecruitmentFilter;
  onChangeFilter: (filter: RecruitmentFilter) => void;
  onResetFilter: () => void;
}

function toArray(value: SelectValue | SelectValue[]): string[] {
  return (Array.isArray(value) ? value : [value]).map(String);
}

/**
 * 넓은 폭에서 셀렉트 4개가 갖는 공통 너비.
 * 좁은 폭에서는 부모의 2열 그리드가 너비를 정하므로 여기서는 sm 이상만 지정한다.
 */
const FILTER_WIDTH = "sm:w-40";

/** 반기 선택 + 직무·상태 필터 */
export function RecruitmentToolbar({
  halfIds,
  activeHalfId,
  onSelectHalf,
  filter,
  onChangeFilter,
  onResetFilter,
}: RecruitmentToolbarProps) {
  const hasFilter =
    filter.jobTags.length > 0 ||
    filter.statuses.length > 0 ||
    filter.categories.length > 0 ||
    filter.keyword.trim().length > 0;

  const handleJobTagChange = (value: SelectValue | SelectValue[]) => {
    onChangeFilter({ ...filter, jobTags: toArray(value) as JobTag[] });
  };

  const handleStatusChange = (value: SelectValue | SelectValue[]) => {
    onChangeFilter({ ...filter, statuses: toArray(value) as ApplicationStatus[] });
  };

  const handleCategoryChange = (value: SelectValue | SelectValue[]) => {
    onChangeFilter({ ...filter, categories: toArray(value) as CompanyCategory[] });
  };

  return (
    // 좁은 폭에서는 2열 그리드로 셀렉트 너비를 균등하게 맞춘다.
    // 고정 px 너비(160/150)를 주면 줄바꿈됐을 때 열 오른쪽 끝이 어긋나므로,
    // 너비는 레이아웃이 정하고 AppSelect는 fullWidth로 칸을 채우게 한다.
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      {/* 좁은 폭에서는 한 줄을 통째로 쓴다 — 셀렉트와 나란히 두면 검색어가 잘려 보인다 */}
      <input
        type="search"
        value={filter.keyword}
        onChange={(event) => onChangeFilter({ ...filter, keyword: event.target.value })}
        placeholder="기업명 검색"
        aria-label="기업명 검색"
        // 높이·좌우 여백은 옆에 서는 AppSelect(size="sm")와 맞춘다 — 한 줄에 나란히 놓이므로
        className="col-span-2 sm:col-span-1 sm:w-48 h-9 px-3 text-sm bg-surface text-text border border-border rounded-sm"
      />

      <AppSelect
        size="sm"
        fullWidth
        className={FILTER_WIDTH}
        options={halfIds.map((id) => ({ value: id, label: formatHalfId(id) }))}
        value={activeHalfId ?? undefined}
        onChange={(value) => onSelectHalf(String(value))}
        placeholder="반기 선택"
      />

      <AppSelect
        size="sm"
        fullWidth
        className={FILTER_WIDTH}
        multiple
        options={JOB_TAGS.map((tag) => ({ value: tag, label: tag }))}
        value={filter.jobTags}
        onChange={handleJobTagChange}
        placeholder="직무 전체"
      />

      <AppSelect
        size="sm"
        fullWidth
        className={FILTER_WIDTH}
        multiple
        options={APPLICATION_STATUSES.map((status) => ({
          value: status,
          label: APPLICATION_STATUS_LABELS[status],
        }))}
        value={filter.statuses}
        onChange={handleStatusChange}
        placeholder="상태 전체"
      />

      <AppSelect
        size="sm"
        fullWidth
        className={FILTER_WIDTH}
        multiple
        options={COMPANY_CATEGORIES.map((category) => ({
          value: category,
          label: COMPANY_CATEGORY_LABELS[category],
        }))}
        value={filter.categories}
        onChange={handleCategoryChange}
        placeholder="분류 전체"
      />

      {hasFilter && (
        // 그리드에서는 한 줄을 통째로 쓰되 버튼이 늘어나지 않게 시작점에 붙인다
        <AppButton
          variant="ghost"
          color="gray"
          size="sm"
          className="col-span-2 justify-self-start sm:col-span-1"
          onClick={onResetFilter}
        >
          필터 초기화
        </AppButton>
      )}
    </div>
  );
}
