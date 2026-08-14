/**
 * 반기 귀속.
 *
 * 경계는 1~6월 상반기 / 7~12월 하반기이며, 지원 건은 자소서 마감일 기준으로
 * 자동 귀속된다. 마감일이 없으면 다른 전형 단계의 가장 이른 일정을, 그것도
 * 없으면 등록 시점을 대신 쓴다.
 * 별도의 "반기 생성" 동작은 없고, 지원 건이 추가되면 해당 반기가 선택지에 자연히 생긴다.
 */

import { getScheduleAnchor } from "./schedule";
import { HALF_ANCHOR_STAGE, STAGE_KEYS } from "./stage";
import type { JobApplication } from "./application.type";

export interface Half {
  year: number;
  /** 1 = 상반기(1~6월), 2 = 하반기(7~12월) */
  half: 1 | 2;
}

/** 정렬·비교·선택 값으로 쓰는 문자열 식별자 — "2026-H1" */
export type HalfId = string;

/**
 * 반기를 판정할 수 없는 지원 건을 담는 그룹.
 * 자소서 일정도 없고 등록 시점도 읽을 수 없는 예외 케이스에만 쓰인다.
 */
export const UNASSIGNED_HALF_ID: HalfId = "unassigned";

/**
 * 반기를 가리지 않고 모든 지원 건을 보는 선택지.
 * 반기 판정 결과가 아니라 화면의 선택값으로만 쓰이며,
 * 판정 불가로 미분류에 남은 예외 케이스도 여기에 포함된다.
 */
export const ALL_HALF_ID: HalfId = "all";

export function toHalfId(half: Half): HalfId {
  return `${half.year}-H${half.half}`;
}

export function parseHalfId(id: HalfId): Half | null {
  const match = /^(\d{4})-H([12])$/.exec(id);
  if (!match) return null;
  return { year: Number(match[1]), half: Number(match[2]) as 1 | 2 };
}

export function formatHalfId(id: HalfId): string {
  if (id === ALL_HALF_ID) return "전체";
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
 * 전형 단계 중 가장 이른 일정.
 *
 * 자소서 마감일이 비어 있어도 코딩테스트·면접 일정은 적혀 있는 경우가 많다
 * (특히 시트에서 가져온 건). 그런 건까지 "날짜를 모르는 건"으로 취급하면
 * 실제로 아는 날짜를 두고 등록 시점으로 떨어뜨리게 된다.
 */
function getEarliestStageAnchor(application: JobApplication): Date | null {
  let earliest: Date | null = null;

  for (const stageKey of STAGE_KEYS) {
    const anchor = getScheduleAnchor(application.stages[stageKey]?.schedule ?? null);
    if (!anchor) continue;
    if (!earliest || anchor < earliest) earliest = anchor;
  }

  return earliest;
}

/**
 * 지원 건이 속한 반기.
 *
 * 판정 순서는 "그 건에 대해 아는 가장 이른 날짜"다:
 * 자소서 마감일 → 다른 전형 단계 중 가장 이른 일정 → 등록 시점.
 *
 * 자소서를 먼저 보는 것은 그것이 보통 전형의 출발점이라서다. 등록 폼에는 날짜
 * 입력이 없어 수기 등록 건은 일정이 빈 채로 만들어지는데, 이때 미분류로 두면
 * 반기 선택지에 잡히지 않아 방금 등록한 건이 화면에서 사라진다.
 *
 * 반기를 문서에 저장하지 않고 매번 계산하므로, 나중에 일정을 채우면 그 날짜의
 * 반기로 자연히 옮겨간다 — 날짜를 알게 되면 날짜가 우선이다.
 */
export function getApplicationHalfId(application: JobApplication): HalfId {
  const anchor =
    getScheduleAnchor(application.stages[HALF_ANCHOR_STAGE]?.schedule ?? null) ??
    getEarliestStageAnchor(application);
  if (anchor) return toHalfId(getHalfOfDate(anchor));

  // createdAt 은 필수 필드지만, 옛 문서를 읽다 값이 깨지면 Invalid Date 가 될 수 있다.
  // 그 경우까지 반기로 환산하면 "NaN-HNaN" 같은 식별자가 선택지에 섞이므로 미분류로 남긴다.
  const createdAt = application.createdAt;
  if (!(createdAt instanceof Date) || Number.isNaN(createdAt.getTime())) {
    return UNASSIGNED_HALF_ID;
  }

  return toHalfId(getHalfOfDate(createdAt));
}

/**
 * 목록에 존재하는 반기 선택지.
 * "전체"가 맨 앞에 오고 그 뒤로 최신 반기 순으로 붙는다.
 *
 * 미분류는 선택지로 노출하지 않는다 — 사용자가 고를 만한 구분이 아니다.
 * 일정이 없어도 등록 시점으로 귀속되므로 여기 남는 건은 예외 케이스뿐이며,
 * 그런 건은 "전체"에서만 보인다.
 */
export function collectHalfIds(applications: JobApplication[]): HalfId[] {
  const ids = new Set(applications.map(getApplicationHalfId));
  ids.delete(UNASSIGNED_HALF_ID);

  const sorted = [...ids].sort((a, b) => b.localeCompare(a));
  return [ALL_HALF_ID, ...sorted];
}

/** 오늘 날짜가 속한 반기 */
export function getCurrentHalfId(today: Date = new Date()): HalfId {
  return toHalfId(getHalfOfDate(today));
}
