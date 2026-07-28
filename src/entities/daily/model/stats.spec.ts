import { describe, it, expect } from "vitest";
import { computeDailyStats } from "./stats";
import type { Attempt, Concept, Subject } from "./daily.type";

const NOW = new Date("2026-07-11T10:00:00").getTime();
const DAY_MS = 24 * 60 * 60 * 1000;

function makeConcept(overrides: Partial<Concept>): Concept {
  return {
    id: "c1",
    subjectId: "s1",
    name: "개념",
    correctCount: 0,
    wrongCount: 0,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewAt: NOW,
    lastReviewedAt: null,
    ...overrides,
  };
}

function makeAttempt(overrides: Partial<Attempt>): Attempt {
  return {
    id: "a1",
    conceptId: "c1",
    question: "q",
    userAnswer: "u",
    correctAnswer: "c",
    isCorrect: true,
    grade: 5,
    solvedAt: NOW,
    ...overrides,
  };
}

const subject: Subject = {
  id: "s1",
  topic: "프론트엔드",
  sub: "JavaScript",
  detail: "함수",
  createdAt: NOW,
};

describe("computeDailyStats", () => {
  it("빈 데이터는 0값과 14일 히스토리를 반환한다", () => {
    const stats = computeDailyStats([], [], [], NOW);
    expect(stats.totalConcepts).toBe(0);
    expect(stats.totalAttempts).toBe(0);
    expect(stats.overallAccuracy).toBe(0);
    expect(stats.weakConcepts).toEqual([]);
    expect(stats.history).toHaveLength(14);
  });

  it("전체 정답률은 attempts 기준으로 계산된다", () => {
    const attempts = [
      makeAttempt({ id: "a1", isCorrect: true }),
      makeAttempt({ id: "a2", isCorrect: true }),
      makeAttempt({ id: "a3", isCorrect: false }),
      makeAttempt({ id: "a4", isCorrect: false }),
    ];
    const stats = computeDailyStats([], attempts, [], NOW);
    expect(stats.totalAttempts).toBe(4);
    expect(stats.overallAccuracy).toBe(0.5);
  });

  it("약점 개념은 정답률 낮은 순으로 정렬되고 풀이 없는 개념은 제외된다", () => {
    const concepts = [
      makeConcept({ id: "strong", name: "강함", correctCount: 9, wrongCount: 1 }),
      makeConcept({ id: "weak", name: "약함", correctCount: 1, wrongCount: 9 }),
      makeConcept({ id: "untouched", name: "미풀이", correctCount: 0, wrongCount: 0 }),
    ];
    const stats = computeDailyStats(concepts, [], [subject], NOW);
    expect(stats.weakConcepts.map((c) => c.conceptId)).toEqual(["weak", "strong"]);
    expect(stats.weakConcepts[0].accuracy).toBeCloseTo(0.1);
    expect(stats.weakConcepts[0].subjectLabel).toBe("프론트엔드 › JavaScript › 함수");
  });

  it("오늘 복습 대상은 복습 이력 있고 nextReviewAt<=now인 개념만 센다", () => {
    const concepts = [
      makeConcept({ id: "due", lastReviewedAt: NOW - DAY_MS, nextReviewAt: NOW - 1000 }),
      makeConcept({ id: "future", lastReviewedAt: NOW - DAY_MS, nextReviewAt: NOW + DAY_MS }),
      makeConcept({ id: "new", lastReviewedAt: null, nextReviewAt: NOW - 1000 }),
    ];
    const stats = computeDailyStats(concepts, [], [subject], NOW);
    expect(stats.dueToday).toBe(1);
    expect(stats.studiedConcepts).toBe(2);
  });

  it("14일 내 풀이는 히스토리 합계와 총 풀이 수가 일치한다", () => {
    const attempts = [
      makeAttempt({ id: "t1", solvedAt: NOW, isCorrect: true }),
      makeAttempt({ id: "t2", solvedAt: NOW, isCorrect: false }),
      makeAttempt({ id: "y1", solvedAt: NOW - DAY_MS, isCorrect: true }),
      makeAttempt({ id: "w1", solvedAt: NOW - 5 * DAY_MS, isCorrect: true }),
    ];
    const stats = computeDailyStats([], attempts, [], NOW);
    const sum = stats.history.reduce((acc, d) => acc + d.correct + d.wrong, 0);
    expect(sum).toBe(4);
    // 오늘(마지막 버킷)에 2개
    const today = stats.history[stats.history.length - 1];
    expect(today.correct + today.wrong).toBe(2);
  });

  it("14일보다 오래된 풀이는 히스토리에 포함되지 않는다", () => {
    const attempts = [makeAttempt({ id: "old", solvedAt: NOW - 30 * DAY_MS })];
    const stats = computeDailyStats([], attempts, [], NOW);
    const sum = stats.history.reduce((acc, d) => acc + d.correct + d.wrong, 0);
    expect(sum).toBe(0);
    expect(stats.totalAttempts).toBe(1); // 총계엔 포함
  });
});
