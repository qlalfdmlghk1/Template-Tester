import { useState, useEffect, useRef } from "react";
import type { Concept, GeneratedQuestion, Subject } from "./daily.type";
import { buildDailyTargets, applySM2, nextReviewAt } from "./sm2";
import { getSubjectById } from "../api/subject.api";
import { getConceptsBySubject, updateConcept } from "../api/concept.api";
import { createAttempt, getAttemptsByConcept } from "../api/attempt.api";
import { generateQuestions } from "../api/ai.api";

export type SessionPhase = "loading" | "error" | "empty" | "playing" | "done";
type QuestionState = "input" | "revealed";

export interface QuestionResult {
  isCorrect: boolean;
  grade: number;
}

// grade 매핑 (단순안): 정답=5, 오답=2. 서술형 AI 채점(6단계)에서 0~5 세분화 예정
const CORRECT_GRADE = 5;
const WRONG_GRADE = 2;
const RECENT_QUESTION_LIMIT = 10;

/** 데일리 학습 세션: 출제 → 풀이 → 채점 → SM-2 갱신 (기획서 3.6.6) */
export function useDailySession(subjectId: string | undefined) {
  const [phase, setPhase] = useState<SessionPhase>("loading");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [questionState, setQuestionState] = useState<QuestionState>("input");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [result, setResult] = useState<QuestionResult | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const conceptsRef = useRef<Map<string, Concept>>(new Map());
  const startedRef = useRef(false);

  useEffect(() => {
    if (!subjectId || startedRef.current) return;
    startedRef.current = true;

    async function start(id: string) {
      try {
        setPhase("loading");
        const subj = await getSubjectById(id);
        if (!subj) {
          setPhase("error");
          return;
        }
        setSubject(subj);

        const concepts = await getConceptsBySubject(id);
        conceptsRef.current = new Map(concepts.map((c) => [c.id, c]));

        const now = Date.now();
        const targets = buildDailyTargets(concepts, now);
        if (targets.length === 0) {
          setPhase("empty");
          return;
        }

        // 중복 방지용 직전 문제문 수집
        const attemptLists = await Promise.all(
          targets.map((c) => getAttemptsByConcept(c.id)),
        );
        const recentQuestions = attemptLists
          .flat()
          .sort((a, b) => b.solvedAt - a.solvedAt)
          .slice(0, RECENT_QUESTION_LIMIT)
          .map((a) => a.question);

        const generated = await generateQuestions({
          subject: { topic: subj.topic, sub: subj.sub, detail: subj.detail },
          targets: targets.map((c) => ({
            conceptId: c.id,
            name: c.name,
            correctCount: c.correctCount,
            wrongCount: c.wrongCount,
          })),
          recentQuestions,
        });

        if (generated.length === 0) {
          setPhase("error");
          return;
        }

        setQuestions(generated);
        setIndex(0);
        setQuestionState("input");
        setPhase("playing");
      } catch (error) {
        console.error("학습 세션 시작 실패:", error);
        setPhase("error");
      }
    }

    void start(subjectId);
  }, [subjectId]);

  const current: GeneratedQuestion | null = questions[index] ?? null;
  const isMcq = current?.type === "mcq" && (current.choices?.length ?? 0) > 0;

  /** 채점 결과를 concepts·attempts에 반영 */
  async function record(isCorrect: boolean, grade: number, userAnswer: string) {
    if (!current) return;
    const now = Date.now();
    const concept = conceptsRef.current.get(current.conceptId);

    try {
      if (concept) {
        const next = applySM2(
          {
            easeFactor: concept.easeFactor,
            interval: concept.interval,
            repetitions: concept.repetitions,
          },
          grade,
        );
        const updated: Concept = {
          ...concept,
          correctCount: concept.correctCount + (isCorrect ? 1 : 0),
          wrongCount: concept.wrongCount + (isCorrect ? 0 : 1),
          easeFactor: next.easeFactor,
          interval: next.interval,
          repetitions: next.repetitions,
          nextReviewAt: nextReviewAt(next.interval, now),
          lastReviewedAt: now,
        };
        await updateConcept(updated);
        conceptsRef.current.set(concept.id, updated);
      }

      await createAttempt({
        conceptId: current.conceptId,
        question: current.question,
        choices: current.choices,
        userAnswer,
        correctAnswer: current.answer,
        isCorrect,
        grade,
        solvedAt: now,
      });
    } catch (error) {
      console.error("풀이 기록 저장 실패:", error);
    }

    if (isCorrect) setCorrectCount((c) => c + 1);
    setResult({ isCorrect, grade });
    setQuestionState("revealed");
  }

  /** 객관식 제출 → 즉시 채점 */
  const submitChoice = () => {
    if (!current || selectedChoice === null) return;
    const isCorrect = selectedChoice === current.answer;
    void record(isCorrect, isCorrect ? CORRECT_GRADE : WRONG_GRADE, selectedChoice);
  };

  /** 서술형 제출 → 모범답안 공개 (자기평가 대기) */
  const revealShort = () => {
    if (!current) return;
    setQuestionState("revealed");
  };

  /** 서술형 자기평가 (6단계 AI 채점으로 대체 예정) */
  const selfGrade = (isCorrect: boolean) => {
    void record(isCorrect, isCorrect ? CORRECT_GRADE : WRONG_GRADE, textAnswer);
  };

  /** 다음 문제로 이동 (마지막이면 완료) */
  const next = () => {
    const nextIndex = index + 1;
    if (nextIndex >= questions.length) {
      setPhase("done");
      return;
    }
    setIndex(nextIndex);
    setSelectedChoice(null);
    setTextAnswer("");
    setResult(null);
    setQuestionState("input");
  };

  return {
    phase,
    subject,
    current,
    isMcq,
    index,
    total: questions.length,
    correctCount,
    questionState,
    result,
    selectedChoice,
    setSelectedChoice,
    textAnswer,
    setTextAnswer,
    submitChoice,
    revealShort,
    selfGrade,
    next,
  };
}
