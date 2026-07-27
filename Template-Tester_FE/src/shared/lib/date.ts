// 날짜 유틸 — 순수 함수 계층 (React·저장소를 참조하지 않음)
//
// 날짜 키는 항상 KST(UTC+9) 기준 "YYYY-MM-DD" 문자열이다.
// GitHub 커밋 시각은 UTC로 오는데, UTC 기준으로 날짜를 끊으면
// 예를 들어 2026-07-25T16:27:50Z(= KST 07-26 01:27)가 하루 앞 칸에 찍힌다.
// 한국은 서머타임이 없어 고정 오프셋으로 계산해도 안전하다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 요일 헤더용 라벨 (일요일 시작) */
export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/** 달력 한 칸 */
export interface CalendarCell {
  /** KST 기준 YYYY-MM-DD */
  dateKey: string;
  /** 1~31 */
  day: number;
  /** 이번 달 날짜인가 (앞뒤 달에서 채워진 칸은 false) */
  isCurrentMonth: boolean;
  /** 0(일) ~ 6(토) */
  weekday: number;
}

/** Date → KST 기준 YYYY-MM-DD */
export function toKstDateKey(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  // +9시간 이동 후 UTC 파트를 읽으면 KST 달력 값이 된다
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 오늘의 KST 날짜 키 */
export function getTodayKey(now: Date = new Date()): string {
  return toKstDateKey(now);
}

/** 날짜 키에 일수를 더한 키 (음수면 과거) */
export function addDaysToDateKey(dateKey: string, days: number): string {
  const base = Date.parse(`${dateKey}T00:00:00Z`);
  return new Date(base + days * DAY_MS).toISOString().slice(0, 10);
}

/** 날짜 키에서 연·월 추출 (month는 1~12) */
export function parseDateKey(dateKey: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateKey.split("-").map(Number);
  return { year, month, day };
}

/** 연·월·일 → 날짜 키 (month는 1~12) */
export function toDateKey(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

/**
 * 월간 달력 매트릭스 (6주 × 7일 고정).
 *
 * 항상 6주로 고정하는 이유는 달마다 행 수가 바뀌면 달을 넘길 때 그리드 높이가
 * 출렁이기 때문이다. 앞뒤로 남는 칸은 이전·다음 달 날짜로 채우고
 * `isCurrentMonth: false`로 표시한다.
 *
 * @param month 1~12 (JS Date의 0-based month가 아님)
 */
export function getMonthMatrix(year: number, month: number): CalendarCell[][] {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  // 그리드 시작점 = 1일이 속한 주의 일요일
  const gridStart = firstDay.getTime() - firstDay.getUTCDay() * DAY_MS;

  const weeks: CalendarCell[][] = [];

  for (let week = 0; week < 6; week++) {
    const cells: CalendarCell[] = [];

    for (let weekday = 0; weekday < 7; weekday++) {
      const date = new Date(gridStart + (week * 7 + weekday) * DAY_MS);
      cells.push({
        dateKey: date.toISOString().slice(0, 10),
        day: date.getUTCDate(),
        isCurrentMonth: date.getUTCMonth() === month - 1 && date.getUTCFullYear() === year,
        weekday,
      });
    }

    weeks.push(cells);
  }

  return weeks;
}

/** 이전 달 (1~12 유지) */
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

/** 다음 달 (1~12 유지) */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

/**
 * 연속 학습일 수.
 *
 * 오늘 기록이 없어도 어제까지 이어졌다면 그 연속은 살아 있는 것으로 본다
 * (오늘 아직 안 푼 것뿐이므로). 그저께까지만 있으면 0.
 */
export function calculateStreak(dateKeys: Iterable<string>, todayKey: string = getTodayKey()): number {
  const keySet = new Set(dateKeys);
  if (keySet.size === 0) return 0;

  let cursor = keySet.has(todayKey) ? todayKey : addDaysToDateKey(todayKey, -1);
  if (!keySet.has(cursor)) return 0;

  let streak = 0;
  while (keySet.has(cursor)) {
    streak++;
    cursor = addDaysToDateKey(cursor, -1);
  }

  return streak;
}
