import { useState } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import AppIcon from "@/shared/ui/atoms/AppIcon/AppIcon";
import { cn } from "@/shared/lib/cn";
import {
  STAGE_LABELS,
  STAGE_STATUSES,
  STAGE_STATUS_DISPLAY,
  STAGE_STATUS_LABELS,
} from "@/entities/job-application/model/stage";
import { ScheduleInput } from "../ScheduleInput/ScheduleInput";
import type { StageKey, StageStatus } from "@/entities/job-application/model/stage";
import type { Schedule } from "@/entities/job-application/model/schedule";
import type { StageEntry } from "@/entities/job-application/model/application.type";

interface StageEditDialogProps {
  stageKey: StageKey;
  entry: StageEntry;
  companyName: string;
  defaultYear: number;
  saving: boolean;
  onSave: (entry: StageEntry) => void;
  onClose: () => void;
}

/** 전형 단계 한 칸 편집 — 저장하면 해당 칸만 즉시 반영된다 */
export function StageEditDialog({
  stageKey,
  entry,
  companyName,
  defaultYear,
  saving,
  onSave,
  onClose,
}: StageEditDialogProps) {
  const [status, setStatus] = useState<StageStatus>(entry.status);
  const [schedule, setSchedule] = useState<Schedule | null>(entry.schedule);
  const [memo, setMemo] = useState(entry.memo ?? "");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({ status, schedule, memo: memo.trim() || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <form
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stage-edit-title"
        className="relative flex flex-col gap-4 w-full max-w-[420px] max-h-[90vh] overflow-y-auto p-5 bg-surface border border-border rounded-lg shadow-[0_12px_32px_rgba(0,0,0,0.18)]"
      >
        <header>
          <p className="m-0 text-xs text-textSecondary">{companyName}</p>
          <h2 id="stage-edit-title" className="m-0 text-base font-semibold text-text">
            {STAGE_LABELS[stageKey]}
          </h2>
        </header>

        <fieldset className="m-0 p-0 border-0">
          <legend className="mb-1.5 text-sm font-medium text-text">상태</legend>
          <div className="flex flex-wrap gap-1.5">
            {STAGE_STATUSES.map((option) => {
              const display = STAGE_STATUS_DISPLAY[option];
              const isSelected = option === status;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatus(option)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-sm border transition-colors",
                    display.cellClass || "bg-surface",
                    isSelected
                      ? "border-blue-500 ring-1 ring-blue-500 text-text"
                      : "border-border text-textSecondary hover:border-gray-400",
                  )}
                >
                  {display.icon && (
                    <AppIcon name={display.icon} size={12} className={display.iconClass} />
                  )}
                  {STAGE_STATUS_LABELS[option]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <p className="m-0 mb-1.5 text-sm font-medium text-text">일정</p>
          <ScheduleInput value={schedule} defaultYear={defaultYear} onChange={setSchedule} />
        </div>

        <div>
          <label htmlFor="stage-memo" className="block mb-1.5 text-sm font-medium text-text">
            메모
          </label>
          <textarea
            id="stage-memo"
            rows={3}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="예: 1박 2일 합숙, 온라인 진행"
            className="w-full px-2 py-1.5 text-sm bg-surface text-text border border-border rounded-sm resize-y"
          />
        </div>

        <div className="flex justify-end gap-2">
          <AppButton type="button" variant="outline" color="gray" size="sm" onClick={onClose}>
            취소
          </AppButton>
          <AppButton type="submit" size="sm" loading={saving}>
            저장
          </AppButton>
        </div>
      </form>
    </div>
  );
}
