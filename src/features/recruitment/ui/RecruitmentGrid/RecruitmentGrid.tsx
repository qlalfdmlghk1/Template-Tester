import { cn } from "@/shared/lib/cn";
import { JOB_TAG_CLASSES, PASS_RATE_STAGE_KEYS, STAGE_KEYS, STAGE_LABELS } from "@/entities/job-application/model/stage";
import { formatPassRate } from "@/entities/job-application/model/stats";
import { StageStatusCell } from "../StageStatusCell/StageStatusCell";
import type { StageKey } from "@/entities/job-application/model/stage";
import type { StagePassRate } from "@/entities/job-application/model/stats";
import type { RecruitmentRow } from "../../model/useRecruitmentBoard";

interface RecruitmentGridProps {
  rows: RecruitmentRow[];
  passRates: Record<StageKey, StagePassRate>;
  selectedApplicationId: string | null;
  onSelectRow: (applicationId: string) => void;
  onSelectStage: (applicationId: string, stageKey: StageKey) => void;
}

/** 데스크톱 전용 지원 건 × 전형 그리드 */
export function RecruitmentGrid({
  rows,
  passRates,
  selectedApplicationId,
  onSelectRow,
  onSelectStage,
}: RecruitmentGridProps) {
  return (
    <div className="overflow-x-auto border border-border rounded-md bg-surface">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th
              scope="col"
              className="sticky left-0 z-10 bg-gray-100 px-3 py-2 text-left font-semibold text-text border-b border-r border-border min-w-[180px]"
            >
              기업 / 공고
            </th>
            {STAGE_KEYS.map((stageKey) => (
              <th
                key={stageKey}
                scope="col"
                className="px-2 py-2 text-center font-semibold text-text border-b border-r border-border last:border-r-0 min-w-[110px]"
              >
                <span className="block whitespace-nowrap">{STAGE_LABELS[stageKey]}</span>
                {/* 최종발표·출근은 합격률 개념이 없어 집계 대상에서 빠진다 */}
                {PASS_RATE_STAGE_KEYS.includes(stageKey) && (
                  <span className="block mt-0.5 text-xs font-normal text-textSecondary">
                    {formatPassRate(passRates[stageKey].rate)}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ application, company, status }) => {
            const isSelected = application.id === selectedApplicationId;
            const companyName = company?.name ?? "(삭제된 기업)";

            return (
              <tr
                key={application.id}
                className={cn(
                  "hover:bg-blue-50",
                  isSelected && "bg-blue-50",
                  // 미지원 건은 목록에 남기되 흐리게 두어 진행 중인 건과 구분한다
                  status === "NOT_APPLIED" && "opacity-50",
                )}
              >
                <th
                  scope="row"
                  className={cn(
                    "sticky left-0 z-10 bg-surface px-3 py-2 text-left font-normal border-b border-r border-border",
                    isSelected && "bg-blue-50",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectRow(application.id)}
                    className="flex flex-col items-start gap-0.5 w-full text-left"
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-sm text-xs font-medium",
                          JOB_TAG_CLASSES[application.jobTag],
                        )}
                      >
                        {application.jobTag}
                      </span>
                      <span className="font-medium text-text">{companyName}</span>
                    </span>
                    {application.postingTitle && (
                      <span className="text-xs text-textSecondary">
                        {application.postingTitle}
                      </span>
                    )}
                  </button>
                </th>

                {STAGE_KEYS.map((stageKey) => (
                  <StageStatusCell
                    key={stageKey}
                    stageKey={stageKey}
                    entry={application.stages[stageKey]}
                    companyName={companyName}
                    onClick={() => onSelectStage(application.id, stageKey)}
                  />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
