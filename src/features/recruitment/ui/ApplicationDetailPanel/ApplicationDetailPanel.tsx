import AppIcon from "@/shared/ui/atoms/AppIcon/AppIcon";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import { formatSchedule } from "@/entities/job-application/model/schedule";
import {
  JOB_TAG_CLASSES,
  STAGE_KEYS,
  STAGE_LABELS,
  STAGE_STATUS_DISPLAY,
  STAGE_STATUS_LABELS,
} from "@/entities/job-application/model/stage";
import { APPLICATION_STATUS_LABELS } from "@/entities/job-application/model/application.type";
import type { StageKey } from "@/entities/job-application/model/stage";
import type { RecruitmentRow } from "../../model/useRecruitmentBoard";

interface ApplicationDetailPanelProps {
  row: RecruitmentRow;
  onClose: () => void;
  onSelectStage: (stageKey: StageKey) => void;
  onEdit: () => void;
  onDelete: () => void;
}

/** 지원 건 상세 — 공고 링크, 메모, 전형 타임라인 */
export function ApplicationDetailPanel({
  row,
  onClose,
  onSelectStage,
  onEdit,
  onDelete,
}: ApplicationDetailPanelProps) {
  const { application, company, status } = row;

  return (
    <aside className="flex flex-col gap-4 p-4 bg-surface border border-border rounded-md">
      <header className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-sm text-xs font-medium",
                JOB_TAG_CLASSES[application.jobTag],
              )}
            >
              {application.jobTag}
            </span>
            <h2 className="text-base font-semibold text-text truncate">
              {company?.name ?? "(삭제된 기업)"}
            </h2>
          </div>
          {application.postingTitle && (
            <p className="m-0 text-sm text-textSecondary">{application.postingTitle}</p>
          )}
        </div>

        <AppButton
          variant="ghost"
          color="gray"
          size="sm"
          onClick={onClose}
          aria-label="상세 닫기"
        >
          <AppIcon name="x-mark" size={16} />
        </AppButton>
      </header>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-textSecondary">상태</dt>
        <dd className="m-0 text-text">{APPLICATION_STATUS_LABELS[status]}</dd>

        <dt className="text-textSecondary">채용 인원</dt>
        <dd className="m-0 text-text">
          {application.headcount === null ? "미정" : `${application.headcount}명`}
        </dd>

        {company?.location && (
          <>
            <dt className="text-textSecondary">위치</dt>
            <dd className="m-0 text-text">{company.location}</dd>
          </>
        )}

        {company?.postingUrl && (
          <>
            <dt className="text-textSecondary">공고</dt>
            <dd className="m-0">
              <a
                href={company.postingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline break-all"
              >
                링크 열기
              </a>
            </dd>
          </>
        )}

        {application.notAppliedReason && (
          <>
            <dt className="text-textSecondary">미지원 사유</dt>
            <dd className="m-0 text-text">{application.notAppliedReason}</dd>
          </>
        )}
      </dl>

      {application.memo && (
        <section>
          <h3 className="m-0 mb-1 text-sm font-semibold text-text">메모</h3>
          <p className="m-0 text-sm text-textSecondary whitespace-pre-wrap">
            {application.memo}
          </p>
        </section>
      )}

      <section>
        <h3 className="m-0 mb-2 text-sm font-semibold text-text">전형 진행</h3>
        <ol className="flex flex-col gap-1">
          {STAGE_KEYS.map((stageKey) => {
            const entry = application.stages[stageKey];
            const display = STAGE_STATUS_DISPLAY[entry.status];
            const scheduleText = formatSchedule(entry.schedule);

            return (
              <li key={stageKey}>
                <button
                  type="button"
                  onClick={() => onSelectStage(stageKey)}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 text-left rounded-sm transition-colors hover:bg-blue-50",
                    entry.status === "NOT_APPLICABLE" && "opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-5 h-5 shrink-0 rounded-sm",
                      display.cellClass,
                    )}
                  >
                    {display.icon && (
                      <AppIcon name={display.icon} size={12} className={display.iconClass} />
                    )}
                  </span>
                  <span className="flex-1 text-sm text-text">{STAGE_LABELS[stageKey]}</span>
                  <span className="text-xs text-textSecondary">
                    {scheduleText || STAGE_STATUS_LABELS[entry.status]}
                  </span>
                </button>
                {entry.memo && (
                  <p className="m-0 pl-9 pr-2 pb-1 text-xs text-textSecondary whitespace-pre-wrap">
                    {entry.memo}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <footer className="flex justify-end gap-2 pt-1 border-t border-border">
        <AppButton variant="outline" color="gray" size="sm" onClick={onEdit}>
          수정
        </AppButton>
        <AppButton variant="outline" color="red" size="sm" onClick={onDelete}>
          삭제
        </AppButton>
      </footer>
    </aside>
  );
}
