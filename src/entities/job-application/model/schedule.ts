/**
 * 전형 일정 표기.
 *
 * 기존 구글 시트에는 "03/11 17:00"(정확), "04/03 ~ 04/11"(기간),
 * "4월 중"·"5월 초"(러프) 표기가 섞여 있었다. 단일 Date로 강제할 수 없어
 * 세 종류를 구조화해 보관하고, 정렬·임박 계산에는 대표 시점(anchor)을 쓴다.
 */

/** 러프 표기의 월 내 위치 */
export const ROUGH_PARTS = ["early", "mid", "late", "whole"] as const;

export type RoughPart = (typeof ROUGH_PARTS)[number];

export const ROUGH_PART_LABELS: Record<RoughPart, string> = {
  early: "초",
  mid: "중순",
  late: "말",
  whole: "중",
};

/** 러프 표기를 정렬·비교할 때 쓰는 대표 일자 */
const ROUGH_PART_ANCHOR_DAY: Record<RoughPart, number> = {
  early: 5,
  mid: 15,
  late: 25,
  whole: 15,
};

/** 정확한 일시 — hasTime이 false면 날짜만 의미가 있다 */
export interface ExactSchedule {
  kind: "exact";
  /** ISO 로컬 표기 "YYYY-MM-DD" 또는 "YYYY-MM-DDTHH:mm" */
  at: string;
  hasTime: boolean;
}

/** 기간 */
export interface RangeSchedule {
  kind: "range";
  start: string;
  end: string;
  hasTime: boolean;
}

/** 러프 표기 — "4월 중", "7월 말" */
export interface RoughSchedule {
  kind: "rough";
  year: number;
  /** 1~12 */
  month: number;
  part: RoughPart;
}

export type Schedule = ExactSchedule | RangeSchedule | RoughSchedule;

/** "YYYY-MM-DD" / "YYYY-MM-DDTHH:mm" → Date (로컬 기준). 형식이 어긋나면 null */
function parseIsoLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour ?? 0),
    Number(minute ?? 0),
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * 정렬·임박 계산에 쓸 대표 시점.
 * 기간은 시작일, 러프 표기는 월 내 대표 일자로 환산한다.
 */
export function getScheduleAnchor(schedule: Schedule | null): Date | null {
  if (!schedule) return null;

  if (schedule.kind === "exact") return parseIsoLocal(schedule.at);
  if (schedule.kind === "range") return parseIsoLocal(schedule.start);

  const day = ROUGH_PART_ANCHOR_DAY[schedule.part];
  return new Date(schedule.year, schedule.month - 1, day);
}

/** 마감 시점 — 기간은 종료일, 나머지는 대표 시점과 같다 */
export function getScheduleDeadline(schedule: Schedule | null): Date | null {
  if (schedule?.kind === "range") return parseIsoLocal(schedule.end);
  return getScheduleAnchor(schedule);
}

function formatMonthDay(value: string): string {
  const date = parseIsoLocal(value);
  if (!date) return value;
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function formatTime(value: string): string {
  const date = parseIsoLocal(value);
  if (!date) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** 화면 표시용 문자열 — 기존 시트 표기를 그대로 재현한다 */
export function formatSchedule(schedule: Schedule | null): string {
  if (!schedule) return "";

  if (schedule.kind === "exact") {
    const day = formatMonthDay(schedule.at);
    return schedule.hasTime ? `${day} ${formatTime(schedule.at)}` : day;
  }

  if (schedule.kind === "range") {
    const start = formatMonthDay(schedule.start);
    const end = formatMonthDay(schedule.end);
    if (!schedule.hasTime) return `${start} ~ ${end}`;
    return `${start} ~ ${end} ${formatTime(schedule.end)}`;
  }

  return `${schedule.month}월 ${ROUGH_PART_LABELS[schedule.part]}`;
}

/** 두 일정을 대표 시점 기준으로 비교한다. 일정이 없는 쪽을 뒤로 보낸다. */
export function compareSchedules(a: Schedule | null, b: Schedule | null): number {
  const anchorA = getScheduleAnchor(a);
  const anchorB = getScheduleAnchor(b);

  if (!anchorA && !anchorB) return 0;
  if (!anchorA) return 1;
  if (!anchorB) return -1;

  return anchorA.getTime() - anchorB.getTime();
}
