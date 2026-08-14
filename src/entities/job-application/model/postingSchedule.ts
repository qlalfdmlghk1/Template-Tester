/**
 * 공고에서 뽑아낸 전형 일정의 정규화.
 *
 * 텍스트 항목과 달리 일정은 구조체(`Schedule` 유니온)라 모델 출력을 그대로 믿을 수 없다.
 * 형식이 어긋난 값이 들어가면 정렬·임박 계산까지 흘러가므로, 여기서 한 번 걸러
 * 통과한 것만 화면에 올린다.
 */

import { ROUGH_PARTS } from "./schedule";
import type { RoughPart, Schedule } from "./schedule";
import { STAGE_KEYS } from "./stage";
import type { StageKey } from "./stage";

/** 모델이 준 일정 한 건 — 어떤 형태로 올지 보장되지 않아 전부 unknown 으로 받는다 */
type RawSchedule = Record<string, unknown>;

export interface PostingScheduleDraft {
  stage: StageKey;
  schedule: Schedule;
  /**
   * 공고에 연도가 없어 추론한 값인가.
   *
   * 자소서 마감일은 상/하반기 판정 기준이라 연도가 틀리면 지원 건이 다른 반기로
   * 옮겨간다. 사용자가 확인하고 넘길 수 있게 화면에 표시한다.
   */
  yearInferred: boolean;
}

/** "YYYY-MM-DD" / "MM-DD" (+ "THH:mm") 를 받아 연도를 채운 ISO 로컬 문자열로 만든다 */
function normalizeDate(
  value: unknown,
  referenceYear: number,
): { iso: string; hasTime: boolean; yearInferred: boolean } | null {
  if (typeof value !== "string") return null;

  const match = /^(?:(\d{4})-)?(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?$/.exec(
    value.trim(),
  );
  if (!match) return null;

  const [, rawYear, rawMonth, rawDay, rawHour, rawMinute] = match;

  const month = Number(rawMonth);
  const day = Number(rawDay);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const hasTime = rawHour !== undefined;
  if (hasTime) {
    const hour = Number(rawHour);
    const minute = Number(rawMinute);
    if (hour > 23 || minute > 59) return null;
  }

  const year = rawYear ? Number(rawYear) : referenceYear;
  const pad = (n: number) => String(n).padStart(2, "0");

  const date = `${year}-${pad(month)}-${pad(day)}`;
  const iso = hasTime ? `${date}T${pad(Number(rawHour))}:${rawMinute}` : date;

  // 실제로 없는 날짜(2월 30일 등)를 걸러낸다
  const parsed = new Date(year, month - 1, day);
  if (parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;

  return { iso, hasTime, yearInferred: !rawYear };
}

/** 연도만 한 해 뒤로 민다 — 기간이 연말을 넘길 때 쓴다 */
function bumpYear(iso: string): string {
  return iso.replace(/^(\d{4})/, (year) => String(Number(year) + 1));
}

function toSchedule(
  raw: RawSchedule,
  referenceYear: number,
): { schedule: Schedule; yearInferred: boolean } | null {
  const kind = raw.kind;

  if (kind === "exact") {
    const at = normalizeDate(raw.at, referenceYear);
    if (!at) return null;

    return {
      schedule: { kind: "exact", at: at.iso, hasTime: at.hasTime },
      yearInferred: at.yearInferred,
    };
  }

  if (kind === "range") {
    const start = normalizeDate(raw.start, referenceYear);
    const end = normalizeDate(raw.end, referenceYear);
    if (!start || !end) return null;

    // "12/28 ~ 01/05" 처럼 연말을 넘기는 기간은 종료 연도가 한 해 뒤다.
    // 연도가 공고에 적혀 있었다면 그대로 믿는다.
    const endIso =
      start.yearInferred && end.yearInferred && end.iso < start.iso
        ? bumpYear(end.iso)
        : end.iso;

    if (endIso < start.iso) return null;

    return {
      schedule: {
        kind: "range",
        start: start.iso,
        end: endIso,
        // 기간 표기에서 시각은 마감 시각을 뜻한다
        hasTime: end.hasTime,
      },
      yearInferred: start.yearInferred || end.yearInferred,
    };
  }

  if (kind === "rough") {
    const month = Number(raw.month);
    if (!Number.isInteger(month) || month < 1 || month > 12) return null;

    const part = raw.part;
    if (typeof part !== "string" || !ROUGH_PARTS.includes(part as RoughPart)) {
      return null;
    }

    const hasYear = Number.isInteger(Number(raw.year)) && Number(raw.year) > 0;

    return {
      schedule: {
        kind: "rough",
        year: hasYear ? Number(raw.year) : referenceYear,
        month,
        part: part as RoughPart,
      },
      yearInferred: !hasYear,
    };
  }

  return null;
}

/**
 * 모델이 준 일정 묶음을 검증해 통과한 것만 돌려준다.
 *
 * 단계 순서(`STAGE_KEYS`)를 따라 정렬해 화면에서 전형 순서대로 보이게 한다.
 */
export function parsePostingSchedules(
  raw: unknown,
  referenceYear: number,
): PostingScheduleDraft[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];

  const entries = raw as Record<string, unknown>;

  return STAGE_KEYS.flatMap((stage) => {
    const value = entries[stage];
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];

    const parsed = toSchedule(value as RawSchedule, referenceYear);
    if (!parsed) return [];

    return [{ stage, schedule: parsed.schedule, yearInferred: parsed.yearInferred }];
  });
}
