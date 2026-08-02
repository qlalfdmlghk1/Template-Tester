import { cn } from "@/shared/lib/cn";
import { formatSchedule } from "@/entities/job-application/model/schedule";
import { JOB_TAG_CLASSES, STAGE_LABELS } from "@/entities/job-application/model/stage";
import { APPLICATION_STATUS_LABELS } from "@/entities/job-application/model/application.type";
import type { ApplicationStatus } from "@/entities/job-application/model/application.type";
import type { RecruitmentRow } from "../../model/useRecruitmentBoard";

interface RecruitmentCardListProps {
  rows: RecruitmentRow[];
  onSelectRow: (applicationId: string) => void;
}

const STATUS_CLASSES: Record<ApplicationStatus, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  FINAL_PASSED: "bg-green-100 text-green-800",
  NOT_APPLIED: "bg-gray-100 text-gray-600",
};

/**
 * 모바일 전용 카드 목록.
 * 좁은 화면에서 필요한 건 전체 표가 아니라 "다음에 뭘 해야 하는가"라서
 * 가장 임박한 일정과 현재 단계를 카드 전면에 올린다.
 */
export function RecruitmentCardList({ rows, onSelectRow }: RecruitmentCardListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map(({ application, company, status, currentStage, upcoming }) => (
        <li key={application.id}>
          <button
            type="button"
            onClick={() => onSelectRow(application.id)}
            className={cn(
              "flex flex-col gap-2 w-full p-3 text-left bg-surface border border-border rounded-md transition-colors hover:bg-blue-50",
              status === "NOT_APPLIED" && "opacity-60",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-sm text-xs font-medium shrink-0",
                      JOB_TAG_CLASSES[application.jobTag],
                    )}
                  >
                    {application.jobTag}
                  </span>
                  <span className="font-medium text-text truncate">
                    {company?.name ?? "(삭제된 기업)"}
                  </span>
                </div>
                {application.postingTitle && (
                  <span className="text-xs text-textSecondary truncate">
                    {application.postingTitle}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  "px-2 py-0.5 rounded-sm text-xs font-medium shrink-0",
                  STATUS_CLASSES[status],
                )}
              >
                {APPLICATION_STATUS_LABELS[status]}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              <span className="text-xs text-textSecondary">
                {currentStage ? STAGE_LABELS[currentStage] : "—"}
              </span>
              <span className="text-sm font-medium text-text">
                {upcoming
                  ? `${STAGE_LABELS[upcoming.stageKey]} ${formatSchedule(upcoming.schedule)}`
                  : "예정된 일정 없음"}
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
