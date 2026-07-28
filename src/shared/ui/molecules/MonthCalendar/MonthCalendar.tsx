import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import {
  WEEKDAY_LABELS,
  getMonthMatrix,
  getPreviousMonth,
  getNextMonth,
  getTodayKey,
} from "@/shared/lib/date";

interface MonthCalendarProps {
  year: number;
  /** 1~12 (JS Date의 0-based month가 아님) */
  month: number;
  /** 선택된 날짜 키 (YYYY-MM-DD) */
  selectedDateKey?: string | null;
  /** 오늘 날짜 키 — 테스트·스토리에서 고정할 수 있게 주입받는다 */
  todayKey?: string;
  onSelectDate?: (dateKey: string) => void;
  onChangeMonth?: (year: number, month: number) => void;
  /** 날짜 숫자 아래에 그릴 내용 (뱃지·점 등) */
  renderDayContent?: (dateKey: string) => ReactNode;
}

const NAV_BUTTON_CLASS =
  "w-8 h-8 inline-flex items-center justify-center rounded-md text-textSecondary transition-colors hover:bg-blue-50 hover:text-primary";

/**
 * 도메인 무관 월간 달력 그리드.
 *
 * 항상 6주로 렌더링해 달을 넘길 때 높이가 출렁이지 않게 한다.
 * 날짜 칸의 내용은 `renderDayContent`로 위임해 달력 자체는 어떤 도메인에도 쓸 수 있다.
 */
export default function MonthCalendar({
  year,
  month,
  selectedDateKey = null,
  todayKey = getTodayKey(),
  onSelectDate,
  onChangeMonth,
  renderDayContent,
}: MonthCalendarProps) {
  const weeks = getMonthMatrix(year, month);

  const handlePrevious = () => {
    const previous = getPreviousMonth(year, month);
    onChangeMonth?.(previous.year, previous.month);
  };

  const handleNext = () => {
    const next = getNextMonth(year, month);
    onChangeMonth?.(next.year, next.month);
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={handlePrevious} className={NAV_BUTTON_CLASS} aria-label="이전 달">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h3 className="text-base sm:text-lg font-semibold text-text m-0">
          {year}년 {month}월
        </h3>

        <button type="button" onClick={handleNext} className={NAV_BUTTON_CLASS} aria-label="다음 달">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={label}
            className={cn(
              "text-center text-xs font-medium py-1",
              index === 0 && "text-error",
              index === 6 && "text-primary",
              index !== 0 && index !== 6 && "text-textSecondary",
            )}
          >
            {label}
          </div>
        ))}

        {weeks.flat().map((cell) => {
          const isSelected = cell.dateKey === selectedDateKey;
          const isToday = cell.dateKey === todayKey;

          return (
            <button
              key={cell.dateKey}
              type="button"
              onClick={() => onSelectDate?.(cell.dateKey)}
              aria-label={cell.dateKey}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              className={cn(
                "min-h-[56px] sm:min-h-[72px] p-1 flex flex-col items-center gap-1 rounded-md border transition-colors",
                "hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-1",
                isSelected ? "border-primary bg-blue-50" : "border-transparent",
                !cell.isCurrentMonth && "opacity-40",
              )}
            >
              <span
                className={cn(
                  "text-xs sm:text-sm leading-6 w-6 h-6 inline-flex items-center justify-center rounded-full",
                  isToday && "bg-primary text-white font-semibold",
                  !isToday && cell.weekday === 0 && "text-error",
                  !isToday && cell.weekday === 6 && "text-primary",
                  !isToday && cell.weekday !== 0 && cell.weekday !== 6 && "text-text",
                )}
              >
                {cell.day}
              </span>

              {renderDayContent?.(cell.dateKey)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
