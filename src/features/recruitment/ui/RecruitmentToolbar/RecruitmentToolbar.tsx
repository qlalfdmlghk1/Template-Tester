import { AppSelect } from "@/shared/ui/atoms/AppSelect";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { formatHalfId } from "@/entities/job-application/model/half";
import { JOB_TAGS } from "@/entities/job-application/model/stage";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
} from "@/entities/job-application/model/application.type";
import type { SelectValue } from "@/shared/ui/atoms/AppSelect";
import type { HalfId } from "@/entities/job-application/model/half";
import type { JobTag } from "@/entities/job-application/model/stage";
import type { ApplicationStatus } from "@/entities/job-application/model/application.type";
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

/** 반기 선택 + 직무·상태 필터 */
export function RecruitmentToolbar({
  halfIds,
  activeHalfId,
  onSelectHalf,
  filter,
  onChangeFilter,
  onResetFilter,
}: RecruitmentToolbarProps) {
  const hasFilter = filter.jobTags.length > 0 || filter.statuses.length > 0;

  const handleJobTagChange = (value: SelectValue | SelectValue[]) => {
    onChangeFilter({ ...filter, jobTags: toArray(value) as JobTag[] });
  };

  const handleStatusChange = (value: SelectValue | SelectValue[]) => {
    onChangeFilter({ ...filter, statuses: toArray(value) as ApplicationStatus[] });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AppSelect
        size="sm"
        width="160px"
        options={halfIds.map((id) => ({ value: id, label: formatHalfId(id) }))}
        value={activeHalfId ?? undefined}
        onChange={(value) => onSelectHalf(String(value))}
        placeholder="반기 선택"
      />

      <AppSelect
        size="sm"
        width="150px"
        multiple
        options={JOB_TAGS.map((tag) => ({ value: tag, label: tag }))}
        value={filter.jobTags}
        onChange={handleJobTagChange}
        placeholder="직무 전체"
      />

      <AppSelect
        size="sm"
        width="150px"
        multiple
        options={APPLICATION_STATUSES.map((status) => ({
          value: status,
          label: APPLICATION_STATUS_LABELS[status],
        }))}
        value={filter.statuses}
        onChange={handleStatusChange}
        placeholder="상태 전체"
      />

      {hasFilter && (
        <AppButton variant="ghost" color="gray" size="sm" onClick={onResetFilter}>
          필터 초기화
        </AppButton>
      )}
    </div>
  );
}
