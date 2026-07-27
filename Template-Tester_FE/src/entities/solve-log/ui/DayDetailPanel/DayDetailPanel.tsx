import { useState } from "react";
import AppButton from "@/shared/ui/atoms/AppButton/AppButton";
import { cn } from "@/shared/lib/cn";
import { useManualLogForm } from "../../model/useManualLogForm";
import type { ManualLogInput } from "../../api/solveLog.api";
import type { SolveLog } from "../../model/solve-log.type";

interface DayDetailPanelProps {
  dateKey: string | null;
  logs: SolveLog[];
  onAddManualLog: (input: ManualLogInput) => Promise<void>;
  onRemoveLog: (logId: string) => Promise<void>;
}

const INPUT_CLASS =
  "w-full px-3 py-2 text-sm outline outline-1 outline-border rounded-md bg-surface text-text hover:outline-primary focus:outline-primary focus:ring-2 focus:ring-blue-200 transition-all";

const PLATFORM_LABEL = { programmers: "프로그래머스", boj: "백준" } as const;

function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");
  return `${year}년 ${Number(month)}월 ${Number(day)}일`;
}

export default function DayDetailPanel({
  dateKey,
  logs,
  onAddManualLog,
  onRemoveLog,
}: DayDetailPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const form = useManualLogForm({
    dateKey: dateKey ?? "",
    onSubmit: async (input) => {
      await onAddManualLog(input);
      setIsAdding(false);
    },
  });

  // 삭제 실패를 잡지 않으면 unhandled rejection만 남고 화면은 그대로여서,
  // 사용자에게는 "버튼이 안 먹는다"로 보인다.
  const handleRemove = async (log: SolveLog) => {
    if (!window.confirm(`"${log.title}" 기록을 삭제할까요?`)) return;

    setRemoveError(null);
    try {
      await onRemoveLog(log.id);
    } catch (cause) {
      console.error("기록 삭제 실패:", cause);
      setRemoveError("기록을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  if (!dateKey) {
    return (
      <aside className="bg-surface border border-border rounded-lg p-5">
        <p className="text-sm text-textSecondary m-0">
          달력에서 날짜를 선택하면 그날의 기록을 볼 수 있습니다.
        </p>
      </aside>
    );
  }

  return (
    <aside className="bg-surface border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-text m-0">{formatDateLabel(dateKey)}</h3>
        <AppButton
          variant={isAdding ? "ghost" : "outline"}
          size="xs"
          onClick={() => setIsAdding((prev) => !prev)}
        >
          {isAdding ? "취소" : "+ 직접 추가"}
        </AppButton>
      </div>

      {isAdding && (
        <div className="space-y-2 pb-4 border-b border-border">
          <div className="flex gap-1">
            {(["programmers", "boj"] as const).map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => form.setPlatform(platform)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md border transition-colors",
                  form.platform === platform
                    ? "border-primary text-primary bg-blue-50 font-medium"
                    : "border-border text-textSecondary hover:text-text",
                )}
              >
                {PLATFORM_LABEL[platform]}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={form.title}
            onChange={(event) => form.setTitle(event.target.value)}
            placeholder="문제 제목 (필수)"
            className={INPUT_CLASS}
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={form.problemNo}
              onChange={(event) => form.setProblemNo(event.target.value)}
              placeholder="번호"
              className={INPUT_CLASS}
            />
            <input
              type="text"
              value={form.difficulty}
              onChange={(event) => form.setDifficulty(event.target.value)}
              placeholder="난이도"
              className={INPUT_CLASS}
            />
            <input
              type="text"
              value={form.language}
              onChange={(event) => form.setLanguage(event.target.value)}
              placeholder="언어"
              className={INPUT_CLASS}
            />
          </div>
          <input
            type="text"
            value={form.memo}
            onChange={(event) => form.setMemo(event.target.value)}
            placeholder="메모 (선택)"
            className={INPUT_CLASS}
          />

          {form.hasInvalidProblemNo && (
            <p className="text-xs text-error m-0" role="alert">
              문제 번호는 숫자만 입력해주세요. (예: 42578)
            </p>
          )}
          {form.error && (
            <p className="text-xs text-error m-0" role="alert">
              {form.error}
            </p>
          )}

          <AppButton
            variant="solid"
            size="sm"
            fullWidth
            onClick={form.handleSubmit}
            disabled={!form.isValid}
            loading={form.isSubmitting}
          >
            기록 추가
          </AppButton>
        </div>
      )}

      {removeError && (
        <p className="text-xs text-error m-0" role="alert">
          {removeError}
        </p>
      )}

      {logs.length === 0 ? (
        <p className="text-sm text-textSecondary m-0">이 날의 기록이 없습니다.</p>
      ) : (
        <ul className="space-y-2 list-none p-0 m-0">
          {logs.map((log) => (
            <li key={log.id} className="p-3 border border-border rounded-md">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                        log.platform === "programmers"
                          ? "bg-blue-100 text-primary"
                          : "bg-green-100 text-green-700",
                      )}
                    >
                      {PLATFORM_LABEL[log.platform]}
                    </span>
                    {log.difficulty && (
                      <span className="text-[10px] text-textSecondary">{log.difficulty}</span>
                    )}
                    {log.language && (
                      <span className="text-[10px] text-textSecondary">· {log.language}</span>
                    )}
                    {log.source === "manual" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        직접 입력
                      </span>
                    )}
                  </div>

                  {log.url ? (
                    <a
                      href={log.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-text hover:text-primary transition-colors break-words"
                    >
                      {log.title}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-text break-words">{log.title}</span>
                  )}

                  {(log.runtime || log.memory) && (
                    <p className="text-[11px] text-textSecondary mt-1 m-0">
                      {[log.runtime, log.memory].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {log.memo && <p className="text-xs text-textSecondary mt-1 m-0">{log.memo}</p>}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(log)}
                  className="p-1 text-textSecondary hover:text-error transition-colors shrink-0"
                  aria-label={`${log.title} 기록 삭제`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
