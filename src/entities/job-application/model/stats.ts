/** 지원 건 파생 계산 — 전체 상태, 합격률, 임박 일정 */

import { getScheduleAnchor, getScheduleDeadline } from "./schedule";
import { PASS_RATE_STAGE_KEYS, STAGE_KEYS } from "./stage";
import type { StageKey } from "./stage";
import type { Schedule } from "./schedule";
import type { ApplicationStatus, JobApplication } from "./application.type";

/** 미지원 사유가 채워져 있으면 미지원 건으로 본다 */
export function isNotApplied(application: JobApplication): boolean {
  return Boolean(application.notAppliedReason?.trim());
}

/**
 * 지원 건 전체 상태 — 단계 상태에서 파생한다(별도 입력 없음).
 * 미지원 > 탈락 > 최종 합격 > 진행 중 순으로 판정한다.
 */
export function getApplicationStatus(application: JobApplication): ApplicationStatus {
  if (isNotApplied(application)) return "NOT_APPLIED";

  const entries = STAGE_KEYS.map((key) => application.stages[key]);

  if (entries.some((entry) => entry?.status === "FAILED")) return "REJECTED";
  if (application.stages.onboarding?.status === "PASSED") return "FINAL_PASSED";

  return "IN_PROGRESS";
}

export interface StagePassRate {
  passed: number;
  failed: number;
  /** 결과가 확정된 건이 없으면 null — 화면에는 "-"로 표시한다 */
  rate: number | null;
}

/**
 * 단계별 합격률 = 합격 / (합격 + 불합격).
 * 응시·제출(결과 미정), 진행 전, 해당 없음은 분모에서 빠지고, 미지원 건은 통째로 제외한다.
 */
export function calcStagePassRate(
  applications: JobApplication[],
  stageKey: StageKey,
): StagePassRate {
  let passed = 0;
  let failed = 0;

  for (const application of applications) {
    if (isNotApplied(application)) continue;

    const status = application.stages[stageKey]?.status;
    if (status === "PASSED") passed += 1;
    else if (status === "FAILED") failed += 1;
  }

  const total = passed + failed;
  return { passed, failed, rate: total === 0 ? null : passed / total };
}

/** 합격률 집계 대상 단계(전형 8단계)의 합격률 — 최종발표·출근은 제외된다 */
export function calcPassRates(
  applications: JobApplication[],
): Record<StageKey, StagePassRate> {
  const result = {} as Record<StageKey, StagePassRate>;

  for (const key of STAGE_KEYS) {
    result[key] = PASS_RATE_STAGE_KEYS.includes(key)
      ? calcStagePassRate(applications, key)
      : { passed: 0, failed: 0, rate: null };
  }

  return result;
}

/** 합격률 표시 문자열. 분모가 0이면 "-" — "진행 전"과 "전원 탈락"을 구분하기 위함 */
export function formatPassRate(rate: number | null): string {
  if (rate === null) return "-";
  return `${(rate * 100).toFixed(2)}%`;
}

export interface UpcomingSchedule {
  stageKey: StageKey;
  schedule: Schedule;
}

/**
 * 가장 임박한 일정 — 모바일 카드의 대표 표시값.
 *
 * 아직 결과가 나오지 않은 단계(진행 전·응시 제출) 중 마감이 지나지 않은 것에서 고른다.
 * 탈락·미지원 건은 대상이 없다.
 */
export function getUpcomingSchedule(
  application: JobApplication,
  today: Date = new Date(),
): UpcomingSchedule | null {
  const status = getApplicationStatus(application);
  if (status === "REJECTED" || status === "NOT_APPLIED") return null;

  const candidates: { stageKey: StageKey; schedule: Schedule; anchor: number }[] = [];

  // 날짜만 있는 일정의 마감은 그날 00:00 이라, 현재 시각과 비교하면
  // "오늘 마감"이 하루 종일 지난 것으로 잡힌다. 오늘 자정을 기준으로 삼는다.
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (const stageKey of STAGE_KEYS) {
    const entry = application.stages[stageKey];
    if (!entry?.schedule) continue;
    if (entry.status !== "PENDING" && entry.status !== "SUBMITTED") continue;

    const deadline = getScheduleDeadline(entry.schedule);
    if (!deadline || deadline.getTime() < startOfToday.getTime()) continue;

    const anchor = getScheduleAnchor(entry.schedule);
    candidates.push({
      stageKey,
      schedule: entry.schedule,
      anchor: anchor ? anchor.getTime() : deadline.getTime(),
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.anchor - b.anchor);
  return { stageKey: candidates[0].stageKey, schedule: candidates[0].schedule };
}

/**
 * 현재 진행 단계.
 * 응시했으나 결과를 기다리는 단계를 우선하고, 없으면 아직 진행 전인 첫 단계를 가리킨다.
 * 탈락한 경우 탈락한 단계를 돌려준다.
 */
export function getCurrentStage(application: JobApplication): StageKey | null {
  if (isNotApplied(application)) return null;

  const failed = STAGE_KEYS.find((key) => application.stages[key]?.status === "FAILED");
  if (failed) return failed;

  const submitted = STAGE_KEYS.find(
    (key) => application.stages[key]?.status === "SUBMITTED",
  );
  if (submitted) return submitted;

  const pending = STAGE_KEYS.find((key) => application.stages[key]?.status === "PENDING");
  return pending ?? null;
}
