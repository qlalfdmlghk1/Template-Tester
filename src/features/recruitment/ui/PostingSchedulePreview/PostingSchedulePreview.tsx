import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import { formatSchedule } from "@/entities/job-application/model/schedule";
import { STAGE_LABELS } from "@/entities/job-application/model/stage";
import type { StageKey } from "@/entities/job-application/model/stage";
import type { PostingScheduleDraft } from "@/entities/job-application/model/postingSchedule";

interface PostingSchedulePreviewProps {
  drafts: PostingScheduleDraft[];
  selectedStages: StageKey[];
  onToggleStage: (stage: StageKey) => void;
  onApply: () => void;
}

/** 일정에서 연도만 꺼낸다 — 추론한 연도를 사용자가 확인할 수 있게 보여준다 */
function getYear(draft: PostingScheduleDraft): number {
  const { schedule } = draft;
  if (schedule.kind === "rough") return schedule.year;
  const source = schedule.kind === "exact" ? schedule.at : schedule.start;
  return Number(source.slice(0, 4));
}

/**
 * 공고에서 뽑은 전형 일정 초안.
 *
 * 이미 일정이 있거나 사용자가 상태를 바꾼 칸은 목록에 오지 않는다
 * (`filterProposableSchedules` 에서 걸러진다).
 */
export function PostingSchedulePreview({
  drafts,
  selectedStages,
  onToggleStage,
  onApply,
}: PostingSchedulePreviewProps) {
  if (drafts.length === 0) return null;

  const hasInferredYear = drafts.some((draft) => draft.yearInferred);

  return (
    <section className="flex flex-col gap-3 p-3 bg-background border border-blue-300 rounded-sm">
      <header>
        <h3 className="m-0 text-sm font-semibold text-text">공고에서 찾은 전형 일정</h3>
        <p className="m-0 mt-0.5 text-xs text-textSecondary">
          아직 비어 있는 단계에만 제안합니다. 반영해도 전형 상태는 그대로 둡니다.
        </p>
      </header>

      <ul className="flex flex-col gap-2 m-0 p-0 list-none">
        {drafts.map((draft) => {
          const checked = selectedStages.includes(draft.stage);

          return (
            <li
              key={draft.stage}
              className={cn(
                "p-2 border rounded-sm transition-colors",
                checked
                  ? "border-blue-400 bg-surface"
                  : "border-border bg-surface opacity-60",
              )}
            >
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleStage(draft.stage)}
                  className="mt-0.5 shrink-0"
                />
                <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
                  <span className="text-xs font-semibold text-text">
                    {STAGE_LABELS[draft.stage]}
                  </span>
                  <span className="text-sm text-text">
                    {getYear(draft)}년 {formatSchedule(draft.schedule)}
                  </span>
                  {draft.yearInferred && (
                    <span className="px-1.5 py-0.5 rounded-sm text-xs bg-yellow-100 text-yellow-800">
                      연도 추정
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {hasInferredYear && (
        <p className="m-0 text-xs text-textSecondary">
          공고에 연도가 없어 보고 있는 반기의 연도로 채웠습니다. 자소서 마감일은 상·하반기
          분류 기준이라 연도가 맞는지 확인해 주세요.
        </p>
      )}

      <div className="flex justify-end">
        <AppButton
          type="button"
          size="xs"
          onClick={onApply}
          disabled={selectedStages.length === 0}
        >
          선택한 {selectedStages.length}개 일정 반영
        </AppButton>
      </div>
    </section>
  );
}
