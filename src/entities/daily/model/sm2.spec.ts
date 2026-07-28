import { describe, it, expect } from "vitest";
import {
  applySM2,
  nextReviewAt,
  buildDailyTargets,
  newConceptSeed,
  DEFAULT_EASE_FACTOR,
  MIN_EASE_FACTOR,
  MAX_DAILY_TARGETS,
} from "./sm2";
import type { Concept, ReviewState } from "./daily.type";

const initialState: ReviewState = {
  easeFactor: DEFAULT_EASE_FACTOR,
  interval: 0,
  repetitions: 0,
};

describe("applySM2", () => {
  it("첫 정답(repetitions=0)이면 interval=1, repetitions=1", () => {
    const next = applySM2(initialState, 5);
    expect(next.interval).toBe(1);
    expect(next.repetitions).toBe(1);
  });

  it("두 번째 정답(repetitions=1)이면 interval=6", () => {
    const next = applySM2({ ...initialState, repetitions: 1, interval: 1 }, 4);
    expect(next.interval).toBe(6);
    expect(next.repetitions).toBe(2);
  });

  it("세 번째 이상 정답이면 interval = round(interval * easeFactor)", () => {
    const state: ReviewState = { easeFactor: 2.5, interval: 6, repetitions: 2 };
    const next = applySM2(state, 4);
    // interval 계산은 갱신 전 easeFactor(2.5) 사용 → 6 * 2.5 = 15
    expect(next.interval).toBe(15);
    expect(next.repetitions).toBe(3);
  });

  it("연속 정답 시 복습 간격이 실제로 벌어진다", () => {
    let state = initialState;
    const intervals: number[] = [];
    for (let i = 0; i < 5; i++) {
      state = applySM2(state, 5);
      intervals.push(state.interval);
    }
    // 1 → 6 → 그 이후 계속 증가 (단조 증가)
    expect(intervals[0]).toBe(1);
    expect(intervals[1]).toBe(6);
    for (let i = 2; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
    }
  });

  it("오답(grade<3)이면 interval=1, repetitions=0으로 리셋", () => {
    const state: ReviewState = { easeFactor: 2.5, interval: 15, repetitions: 3 };
    const next = applySM2(state, 2);
    expect(next.interval).toBe(1);
    expect(next.repetitions).toBe(0);
  });

  it("grade=5는 easeFactor를 높이고, 낮은 정답 grade는 낮춘다", () => {
    const up = applySM2(initialState, 5);
    const down = applySM2(initialState, 3);
    expect(up.easeFactor).toBeGreaterThan(DEFAULT_EASE_FACTOR);
    expect(down.easeFactor).toBeLessThan(DEFAULT_EASE_FACTOR);
  });

  it("easeFactor는 최소 1.3 아래로 내려가지 않는다", () => {
    let state: ReviewState = { easeFactor: 1.3, interval: 1, repetitions: 0 };
    // 반복적으로 최저 grade를 줘도 하한 유지
    for (let i = 0; i < 10; i++) {
      state = applySM2(state, 0);
      expect(state.easeFactor).toBeGreaterThanOrEqual(MIN_EASE_FACTOR);
    }
  });

  it("범위를 벗어난 grade는 0~5로 보정된다", () => {
    const tooHigh = applySM2(initialState, 99);
    const tooLow = applySM2(initialState, -5);
    // 99 → 5(정답), -5 → 0(오답)
    expect(tooHigh.repetitions).toBe(1);
    expect(tooLow.repetitions).toBe(0);
    expect(tooLow.interval).toBe(1);
  });
});

describe("newConceptSeed", () => {
  it("초기 SM-2 상태로 신규 개념을 시드한다", () => {
    const now = 1_700_000_000_000;
    const seed = newConceptSeed("subject-1", "클로저", now);
    expect(seed).toEqual({
      subjectId: "subject-1",
      name: "클로저",
      correctCount: 0,
      wrongCount: 0,
      easeFactor: DEFAULT_EASE_FACTOR,
      interval: 0,
      repetitions: 0,
      nextReviewAt: now,
      lastReviewedAt: null,
    });
  });

  it("신규 개념은 buildDailyTargets에서 신규로 분류된다", () => {
    const now = 1_700_000_000_000;
    const seed = newConceptSeed("s1", "호이스팅", now);
    const concept = { ...seed, id: "c1" };
    const result = buildDailyTargets([concept], now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("c1");
  });
});

describe("nextReviewAt", () => {
  const DAY = 24 * 60 * 60 * 1000;

  it("from + interval일(ms) 반환", () => {
    const from = 1_000_000;
    expect(nextReviewAt(6, from)).toBe(from + 6 * DAY);
  });

  it("interval=0이면 from과 동일 (즉시 복습 대상)", () => {
    const from = 500;
    expect(nextReviewAt(0, from)).toBe(from);
  });
});

describe("buildDailyTargets", () => {
  const now = 1_000_000_000_000;

  function makeConcept(overrides: Partial<Concept>): Concept {
    return {
      id: overrides.id ?? crypto.randomUUID(),
      subjectId: "s1",
      name: "concept",
      correctCount: 0,
      wrongCount: 0,
      easeFactor: DEFAULT_EASE_FACTOR,
      interval: 1,
      repetitions: 0,
      nextReviewAt: now,
      lastReviewedAt: now - 1000,
      ...overrides,
    };
  }

  it("빈 배열이면 빈 배열 반환", () => {
    expect(buildDailyTargets([], now)).toEqual([]);
  });

  it("복습 예정이 아직 안 된(nextReviewAt > now) 개념은 제외", () => {
    const notDue = makeConcept({ id: "future", nextReviewAt: now + 100000 });
    expect(buildDailyTargets([notDue], now)).toEqual([]);
  });

  it("약점(정답률 낮은) 개념을 앞에 배치", () => {
    const strong = makeConcept({ id: "strong", correctCount: 9, wrongCount: 1 });
    const weak = makeConcept({ id: "weak", correctCount: 1, wrongCount: 9 });
    const result = buildDailyTargets([strong, weak], now);
    expect(result.map((c) => c.id)).toEqual(["weak", "strong"]);
  });

  it("신규 개념(lastReviewedAt=null)을 최대 2개까지 포함", () => {
    const news = Array.from({ length: 5 }, (_, i) =>
      makeConcept({ id: `new-${i}`, lastReviewedAt: null }),
    );
    const result = buildDailyTargets(news, now);
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.lastReviewedAt === null)).toBe(true);
  });

  it("복습 대상 + 신규를 합쳐도 최대 5개를 넘지 않는다", () => {
    const due = Array.from({ length: 10 }, (_, i) =>
      makeConcept({ id: `due-${i}`, wrongCount: i }),
    );
    const news = Array.from({ length: 3 }, (_, i) =>
      makeConcept({ id: `new-${i}`, lastReviewedAt: null }),
    );
    const result = buildDailyTargets([...due, ...news], now);
    expect(result.length).toBeLessThanOrEqual(MAX_DAILY_TARGETS);
    // 신규 2개가 포함되고 나머지는 복습 대상
    expect(result.filter((c) => c.lastReviewedAt === null)).toHaveLength(2);
  });
});
