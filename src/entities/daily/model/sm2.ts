// SM-2 적응형 복습 알고리즘 (기획서 3.6.4)
// 순수 함수 계층 — IndexedDB·React 상태를 참조하지 않음 (테스트 용이 + 향후 포팅 대비)
import type { Concept, ReviewState } from "./daily.type";

/** SM-2 상수 */
export const DEFAULT_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;

/** 하루 출제 정책 (기획서 ✍️ 미확정 항목 — 이 상수로 조정) */
export const MAX_DAILY_TARGETS = 5;
export const NEW_CONCEPT_LIMIT = 2;

const DAY_MS = 24 * 60 * 60 * 1000;

/** grade를 0~5 정수로 보정 */
function clampGrade(grade: number): number {
  if (grade < 0) return 0;
  if (grade > 5) return 5;
  return Math.round(grade);
}

/**
 * grade(0~5)로 복습 상태 갱신 (표준 SM-2).
 * - grade < 3(오답): interval=1, repetitions=0으로 리셋
 * - grade >= 3(정답): interval 1 → 6 → round(interval * easeFactor)로 증가
 * - easeFactor는 모든 경우 grade에 따라 조정, 최소 1.3
 * interval 계산은 갱신 전(기존) easeFactor를 사용한다(표준 순서).
 */
export function applySM2(state: ReviewState, grade: number): ReviewState {
  const q = clampGrade(grade);

  let interval: number;
  let repetitions: number;

  if (q < 3) {
    interval = 1;
    repetitions = 0;
  } else {
    if (state.repetitions === 0) {
      interval = 1;
    } else if (state.repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(state.interval * state.easeFactor);
    }
    repetitions = state.repetitions + 1;
  }

  const easeFactor = Math.max(
    MIN_EASE_FACTOR,
    state.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  return { easeFactor, interval, repetitions };
}

/** interval(일) 기준 다음 복습 예정 epoch ms 반환 */
export function nextReviewAt(interval: number, from: number = Date.now()): number {
  return from + interval * DAY_MS;
}

/**
 * 신규 개념 시드 (초기 SM-2 상태). id는 저장 계층에서 부여한다.
 * lastReviewedAt=null → buildDailyTargets가 "신규"로 분류.
 * nextReviewAt=now → 생성 즉시 출제 후보.
 */
export function newConceptSeed(
  subjectId: string,
  name: string,
  now: number,
): Omit<Concept, "id"> {
  return {
    subjectId,
    name,
    correctCount: 0,
    wrongCount: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    nextReviewAt: now,
    lastReviewedAt: null,
  };
}

/** 정답률 (풀이 기록 없으면 1로 간주 → 약점 정렬에서 뒤로) */
function accuracy(concept: Concept): number {
  const total = concept.correctCount + concept.wrongCount;
  return total === 0 ? 1 : concept.correctCount / total;
}

/** 약점 우선 정렬: 정답률 낮은 순 → 더 밀린 순 → easeFactor 낮은 순 */
function byWeakness(a: Concept, b: Concept): number {
  return (
    accuracy(a) - accuracy(b) ||
    a.nextReviewAt - b.nextReviewAt ||
    a.easeFactor - b.easeFactor
  );
}

/**
 * 오늘의 출제 대상 개념 선별 (기획서 3.6.4).
 * 복습 대상(nextReviewAt <= now)을 약점 순으로 우선 배치하고,
 * 신규 개념(lastReviewedAt === null)을 최대 NEW_CONCEPT_LIMIT개 섞어
 * 총 MAX_DAILY_TARGETS개 이내로 반환한다.
 */
export function buildDailyTargets(concepts: Concept[], now: number): Concept[] {
  const reviewed = concepts.filter((c) => c.lastReviewedAt !== null);
  const fresh = concepts.filter((c) => c.lastReviewedAt === null);

  const due = reviewed
    .filter((c) => c.nextReviewAt <= now)
    .sort(byWeakness);

  const newPicks = fresh.slice(0, NEW_CONCEPT_LIMIT);
  const dueBudget = MAX_DAILY_TARGETS - newPicks.length;
  const duePicks = due.slice(0, dueBudget);

  return [...duePicks, ...newPicks].slice(0, MAX_DAILY_TARGETS);
}
