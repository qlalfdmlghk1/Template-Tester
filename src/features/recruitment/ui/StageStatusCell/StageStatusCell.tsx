import AppIcon from "@/shared/ui/atoms/AppIcon/AppIcon";
import { cn } from "@/shared/lib/cn";
import { formatSchedule } from "@/entities/job-application/model/schedule";
import {
  STAGE_LABELS,
  STAGE_STATUS_DISPLAY,
  STAGE_STATUS_LABELS,
} from "@/entities/job-application/model/stage";
import type { StageKey } from "@/entities/job-application/model/stage";
import type { StageEntry } from "@/entities/job-application/model/application.type";

interface StageStatusCellProps {
  stageKey: StageKey;
  entry: StageEntry;
  companyName: string;
  onClick: () => void;
}

/**
 * 그리드의 전형 단계 한 칸.
 * 상태는 배경색과 아이콘을 함께 써서 색상만으로 구분되지 않게 한다.
 */
export function StageStatusCell({
  stageKey,
  entry,
  companyName,
  onClick,
}: StageStatusCellProps) {
  const display = STAGE_STATUS_DISPLAY[entry.status];
  const scheduleText = formatSchedule(entry.schedule);
  const hasMemo = Boolean(entry.memo?.trim());

  return (
    <td className="p-0 border-b border-r border-border last:border-r-0">
      <button
        type="button"
        onClick={onClick}
        aria-label={`${companyName} ${STAGE_LABELS[stageKey]} — ${STAGE_STATUS_LABELS[entry.status]}${scheduleText ? ` ${scheduleText}` : ""}`}
        className={cn(
          "relative flex items-center justify-center gap-1 w-full h-full min-h-[44px] px-2 py-1.5 text-xs text-text transition-colors hover:ring-1 hover:ring-inset hover:ring-blue-400",
          display.cellClass,
        )}
      >
        {display.icon && (
          <AppIcon
            name={display.icon}
            size={14}
            className={cn("shrink-0", display.iconClass)}
          />
        )}
        <span className="truncate">{scheduleText}</span>
        {hasMemo && (
          <span
            aria-hidden="true"
            className="absolute top-0.5 right-0.5 w-0 h-0 border-t-4 border-l-4 border-t-gray-600 border-l-transparent"
          />
        )}
      </button>
    </td>
  );
}
