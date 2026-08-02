/**
 * 반기 귀속.
 *
 * 경계는 1~6월 상반기 / 7~12월 하반기이며, 지원 건은 자소서 마감일 기준으로
 * 자동 귀속된다. 별도의 "반기 생성" 동작은 없고, 지원 건이 추가되면
 * 해당 반기가 선택지에 자연히 생긴다.
 */

import { getScheduleAnchor } from "./schedule";
import { HALF_ANCHOR_STAGE } from "./stage";
import type { JobApplication } from "./application.type";

export interface Half {
  year: number;
  /** 1 = 상반기(1~6월), 2 = 하반기(7~12월) */
  half: 1 | 2;
}

/** 정렬·비교·선택 값으로 쓰는 문자열 식별자 — "2026-H1" */
export type HalfId = string;

/** 자소서 일정이 없어 반기를 판정할 수 없는 지원 건을 담는 그룹 */
export const UNASSIGNED_HALF_ID: HalfId = "unassigned";

export function toHalfId(half: Half): HalfId {
  return `${half.year}-H${half.half}`;
}

export function parseHalfId(id: HalfId): Half | null {
  const match = /^(\d{4})-H([12])$/.exec(id);
  if (!match) return null;
  return { year: Number(match[1]), half: Number(match[2]) as 1 | 2 };
}

export function formatHalfId(id: HalfId): string {
  if (id === UNASSIGNED_HALF_ID) return "미분류";
  const half = parseHalfId(id);
  if (!half) return id;
  return `${half.year} ${half.half === 1 ? "상반기" : "하반기"}`;
}

export function getHalfOfDate(date: Date): Half {
  return {
    year: date.getFullYear(),
    half: date.getMonth() < 6 ? 1 : 2,
  };
}

/**
 * 지원 건이 속한 반기.
 * 자소서 일정이 비어 있으면 판정할 수 없으므로 미분류로 둔다.
 */
export function getApplicationHalfId(application: JobApplication): HalfId {
  const anchor = getScheduleAnchor(application.stages[HALF_ANCHOR_STAGE]?.schedule ?? null);
  if (!anchor) return UNASSIGNED_HALF_ID;
  return toHalfId(getHalfOfDate(anchor));
}

/**
 * 목록에 존재하는 반기 선택지.
 * 최신 반기가 앞에 오고, 미분류가 있으면 맨 뒤에 붙는다.
 */
export function collectHalfIds(applications: JobApplication[]): HalfId[] {
  const ids = new Set(applications.map(getApplicationHalfId));
  const hasUnassigned = ids.delete(UNASSIGNED_HALF_ID);

  const sorted = [...ids].sort((a, b) => b.localeCompare(a));
  return hasUnassigned ? [...sorted, UNASSIGNED_HALF_ID] : sorted;
}

/** 오늘 날짜가 속한 반기 */
export function getCurrentHalfId(today: Date = new Date()): HalfId {
  return toHalfId(getHalfOfDate(today));
}
