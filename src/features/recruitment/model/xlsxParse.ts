/**
 * 구글 시트에서 내보낸 xlsx의 셀 값·색을 도메인 값으로 옮기는 순수 변환 로직.
 *
 * 시트에는 일정이 세 가지 형태로 섞여 있다.
 * - 날짜 셀: Excel serial number (예: 46092.708333 = 2026-03-11 17:00)
 * - 날짜 문자열: "04/03 ~ 04/11", "04/11 13:40-16시", "04/04 (토)"
 * - 러프 문자열: "4월 중", "5월 초", "7월 중순 ~ 말", "8월초"
 *
 * 상태는 셀 배경색으로만 표현돼 있어 색 → 상태 매핑이 유일한 단서다.
 */

import { formatSchedule } from "@/entities/job-application/model/schedule";
import { JOB_TAGS, STAGE_KEYS } from "@/entities/job-application/model/stage";
import type { RoughPart, Schedule } from "@/entities/job-application/model/schedule";
import type { JobTag, StageKey, StageStatus } from "@/entities/job-application/model/stage";

/** 셀 배경색(ARGB, 앞 FF 제외한 6자리 대문자) → 전형 상태 */
const FILL_STATUS: Record<string, StageStatus> = {
  D9EAD3: "PASSED",
  C9DAF8: "SUBMITTED",
  F4CCCC: "FAILED",
  // 주황 두 톤은 모두 불참·포기를 뜻한다
  F9CB9C: "SKIPPED",
  FCE5CD: "SKIPPED",
  F3F3F3: "NOT_APPLICABLE",
};

/**
 * 색이 없거나 흰색·진회색이면 진행 전으로 본다.
 * 진회색(D9D9D9)은 기업명 열 스타일로만 쓰였고 전형 상태와 무관하다.
 */
export function mapFillToStatus(argb: string | null | undefined): StageStatus {
  if (!argb) return "PENDING";
  const hex = argb.replace(/^#/, "").toUpperCase().slice(-6);
  return FILL_STATUS[hex] ?? "PENDING";
}

/** 헤더 문자열 → 전형 단계 키 */
const HEADER_STAGE: Record<string, StageKey> = {
  자소서: "resume",
  "AI 역량검사": "aiTest",
  인성검사: "personality",
  "직무/적성": "aptitude",
  필기: "written",
  "코딩 테스트": "codingTest",
  "1차 면접": "interview1",
  "2차 면접": "interview2",
  최종발표: "finalResult",
  출근: "onboarding",
};

export type MetaColumn = "companyName" | "jobTag" | "headcount" | "location" | "notAppliedReason";

const HEADER_META: Record<string, MetaColumn> = {
  기업명: "companyName",
  직무: "jobTag",
  인원: "headcount",
  위치: "location",
  "미지원 사유": "notAppliedReason",
};

export interface ColumnMap {
  stages: Map<number, StageKey>;
  meta: Map<number, MetaColumn>;
}

/**
 * 헤더 행에서 컬럼 위치를 읽는다.
 * 시트마다 컬럼 순서가 달라(상반기는 직무·기업명 순, 2026 상반기는 그 반대) 고정 인덱스를 쓸 수 없다.
 */
export function buildColumnMap(headerCells: (string | null)[]): ColumnMap {
  const stages = new Map<number, StageKey>();
  const meta = new Map<number, MetaColumn>();

  headerCells.forEach((raw, index) => {
    const header = raw?.trim();
    if (!header) return;

    const stageKey = HEADER_STAGE[header];
    if (stageKey) {
      stages.set(index, stageKey);
      return;
    }

    const metaKey = HEADER_META[header];
    if (metaKey) meta.set(index, metaKey);
  });

  return { stages, meta };
}

// ── 기업 조사 시트 ("채용 정보") ────────────────────────────────
// 지원 현황 시트와 달리 전형 컬럼이 없고 긴 설명 텍스트를 담는다.
// "직무" 헤더가 양쪽에 있지만 뜻이 다르다 — 지원 현황에서는 태그(IT·FE),
// 조사 시트에서는 직무명("프론트엔드 개발자")이라 매핑을 따로 둔다.

export type ResearchColumn =
  | "companyName"
  | "targetJob"
  | "jobDescription"
  | "requirements";

const HEADER_RESEARCH: Record<string, ResearchColumn> = {
  기업명: "companyName",
  직무: "targetJob",
  "직무 설명": "jobDescription",
  "자격 요건": "requirements",
};

/** 조사 시트인지 — 설명·요건 컬럼이 있으면 그렇게 본다 */
export function isResearchSheet(headerCells: (string | null)[]): boolean {
  return headerCells.some((raw) => {
    const header = raw?.trim();
    return header === "직무 설명" || header === "자격 요건";
  });
}

export function buildResearchColumnMap(
  headerCells: (string | null)[],
): Map<number, ResearchColumn> {
  const map = new Map<number, ResearchColumn>();

  headerCells.forEach((raw, index) => {
    const header = raw?.trim();
    if (!header) return;

    const key = HEADER_RESEARCH[header];
    if (key) map.set(index, key);
  });

  return map;
}

/** Excel serial number → Date. 1900 기준이며 존재하지 않는 1900-02-29 보정을 포함한다 */
export function excelSerialToDate(serial: number): Date {
  const EPOCH_OFFSET_DAYS = 25569; // 1970-01-01 의 serial
  const MS_PER_DAY = 86400000;

  const utcMs = Math.round((serial - EPOCH_OFFSET_DAYS) * MS_PER_DAY);
  const utc = new Date(utcMs);

  // 시트의 값은 로컬 시각 의도로 쓰였으므로 UTC 성분을 로컬 성분으로 옮긴다
  return new Date(
    utc.getUTCFullYear(),
    utc.getUTCMonth(),
    utc.getUTCDate(),
    utc.getUTCHours(),
    utc.getUTCMinutes(),
  );
}

function toIsoLocal(date: Date, withTime: boolean): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return withTime ? `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}` : day;
}

const ROUGH_WORD: Record<string, RoughPart> = {
  초: "early",
  초순: "early",
  중순: "mid",
  중: "whole",
  말: "late",
  하순: "late",
};

/** "13:40", "18시", "9시30분" 에서 시각을 뽑는다 */
function extractTime(text: string): { hour: number; minute: number } | null {
  const colon = /(\d{1,2}):(\d{2})/.exec(text);
  if (colon) return { hour: Number(colon[1]), minute: Number(colon[2]) };

  const hourOnly = /(\d{1,2})\s*시/.exec(text);
  if (hourOnly) return { hour: Number(hourOnly[1]), minute: 0 };

  return null;
}

/**
 * "MM/DD" 매치가 실제 존재하는 월·일인지.
 *
 * 검증 없이 `new Date(year, 1, 29)` 같은 값을 만들면 3/1 로 조용히 넘어가고,
 * `13/45` 는 이듬해 날짜가 된다. 시트 오타가 그럴듯한 오답으로 임포트되는 것을 막는다.
 * (2/29 처럼 연도에 따라 달라지는 경우까지는 보지 않고, 월 1~12 · 일 1~31 만 본다)
 */
function isRealMonthDay(match: RegExpMatchArray): boolean {
  const month = Number(match[1]);
  const day = Number(match[2]);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

export interface ParsedSchedule {
  schedule: Schedule | null;
  /** 파싱 결과가 원문을 온전히 담지 못하면 원문을 메모로 남긴다 */
  memo?: string;
}

/**
 * 일정 문자열을 구조화한다.
 * 연도가 적혀 있지 않으므로 같은 행·시트에서 얻은 기준 연도를 쓴다.
 */
export function parseScheduleText(raw: string, baseYear: number): ParsedSchedule {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return { schedule: null };

  const withOriginal = (schedule: Schedule | null): ParsedSchedule => {
    if (!schedule) return { schedule: null, memo: text };
    // 표기가 원문과 어긋나면(부가 설명·시간 범위 등) 원문을 메모로 보존한다
    return formatSchedule(schedule) === text ? { schedule } : { schedule, memo: text };
  };

  // 1) "MM/DD" 형태가 하나 이상 — 정확한 일시 또는 기간
  const dates = [...text.matchAll(/(\d{1,2})[/.](\d{1,2})/g)];
  if (dates.length > 0 && dates.every(isRealMonthDay)) {
    const toDate = (match: RegExpMatchArray) =>
      new Date(baseYear, Number(match[1]) - 1, Number(match[2]));

    if (dates.length >= 2) {
      const start = toDate(dates[0]);
      const end = toDate(dates[1]);
      // 종료가 시작보다 앞이면 해를 넘긴 기간이다 (예: 12/28 ~ 01/03)
      if (end.getTime() < start.getTime()) end.setFullYear(baseYear + 1);

      const tail = text.slice(dates[1].index ?? 0);
      const time = extractTime(tail);
      if (time) end.setHours(time.hour, time.minute);

      return withOriginal({
        kind: "range",
        start: toIsoLocal(start, false),
        end: toIsoLocal(end, Boolean(time)),
        hasTime: Boolean(time),
      });
    }

    const at = toDate(dates[0]);
    const time = extractTime(text.slice((dates[0].index ?? 0) + dates[0][0].length));
    if (time) at.setHours(time.hour, time.minute);

    return withOriginal({
      kind: "exact",
      at: toIsoLocal(at, Boolean(time)),
      hasTime: Boolean(time),
    });
  }

  // 2) "N월 초/중순/말" 형태 — 범위로 적혀 있으면 시작 쪽을 대표로 삼는다
  const rough = /(\d{1,2})\s*월\s*(초순|중순|하순|초|중|말)?/.exec(text);
  if (rough) {
    const month = Number(rough[1]);
    const word = rough[2];
    return withOriginal({
      kind: "rough",
      year: baseYear,
      month,
      part: word ? (ROUGH_WORD[word] ?? "whole") : "whole",
    });
  }

  // 읽을 수 없는 표기는 값을 잃지 않도록 원문을 메모로 남긴다
  return { schedule: null, memo: text };
}

const JOB_TAG_SET = new Set<string>(JOB_TAGS);

export function parseJobTag(raw: string | null | undefined): JobTag | null {
  // 한글 태그("기획")가 있어 대문자 변환 후에도 원본을 함께 확인한다
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (JOB_TAG_SET.has(trimmed)) return trimmed as JobTag;

  const upper = trimmed.toUpperCase();
  return JOB_TAG_SET.has(upper) ? (upper as JobTag) : null;
}

/** "15명" → 15, "00명"·빈값 → null (공고에 인원이 안 적힌 경우) */
export function parseHeadcount(raw: string | number | null | undefined): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;

  const digits = raw?.replace(/[^\d]/g, "");
  if (!digits) return null;

  const value = Number(digits);
  return value > 0 ? value : null;
}

export const IMPORT_STAGE_KEYS = STAGE_KEYS;
