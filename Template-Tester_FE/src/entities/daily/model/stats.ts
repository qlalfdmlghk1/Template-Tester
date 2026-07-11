// 학습 통계 계산 (순수 함수) — 기획서 3.6.6 학습 통계 화면
import type { Attempt, Concept, Subject } from "./daily.type";

export interface ConceptStat {
  conceptId: string;
  name: string;
  subjectId: string;
  subjectLabel: string;
  correctCount: number;
  wrongCount: number;
  total: number;
  accuracy: number; // 0~1 (풀이 없으면 0)
}

export interface DayCount {
  label: string; // "M/D"
  correct: number;
  wrong: number;
}

export interface DailyStats {
  totalConcepts: number;
  studiedConcepts: number; // 1회 이상 풀이한 개념 수
  totalAttempts: number;
  overallAccuracy: number; // 전체 풀이 기준 정답률
  dueToday: number; // 오늘 복습 대상 개념 수
  weakConcepts: ConceptStat[]; // 정답률 낮은 순 상위
  history: DayCount[]; // 최근 N일 일별 정답/오답
}

const DAY_MS = 24 * 60 * 60 * 1000;
const WEAK_LIMIT = 5;
const HISTORY_DAYS = 14;

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function computeDailyStats(
  concepts: Concept[],
  attempts: Attempt[],
  subjects: Subject[],
  now: number,
): DailyStats {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const labelOf = (subjectId: string): string => {
    const s = subjectMap.get(subjectId);
    return s ? `${s.topic} › ${s.sub} › ${s.detail}` : "(삭제된 주제)";
  };

  const perConcept: ConceptStat[] = concepts.map((c) => {
    const total = c.correctCount + c.wrongCount;
    return {
      conceptId: c.id,
      name: c.name,
      subjectId: c.subjectId,
      subjectLabel: labelOf(c.subjectId),
      correctCount: c.correctCount,
      wrongCount: c.wrongCount,
      total,
      accuracy: total > 0 ? c.correctCount / total : 0,
    };
  });

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  const overallAccuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

  const studiedConcepts = concepts.filter((c) => c.lastReviewedAt !== null).length;
  const dueToday = concepts.filter(
    (c) => c.lastReviewedAt !== null && c.nextReviewAt <= now,
  ).length;

  const weakConcepts = perConcept
    .filter((s) => s.total > 0)
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
    .slice(0, WEAK_LIMIT);

  const todayStart = startOfDay(now);
  const history: DayCount[] = [];
  for (let i = HISTORY_DAYS - 1; i >= 0; i--) {
    const dayStart = todayStart - i * DAY_MS;
    const dayEnd = dayStart + DAY_MS;
    const dayAttempts = attempts.filter(
      (a) => a.solvedAt >= dayStart && a.solvedAt < dayEnd,
    );
    const d = new Date(dayStart);
    history.push({
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      correct: dayAttempts.filter((a) => a.isCorrect).length,
      wrong: dayAttempts.filter((a) => !a.isCorrect).length,
    });
  }

  return {
    totalConcepts: concepts.length,
    studiedConcepts,
    totalAttempts,
    overallAccuracy,
    dueToday,
    weakConcepts,
    history,
  };
}
