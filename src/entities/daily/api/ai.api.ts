// Daily 학습 AI 프록시 호출 (Firebase Callable Functions)
import { httpsCallable } from "firebase/functions";
import { functions } from "@/shared/api/firebase";
import type { GeneratedQuestion, Subject } from "../model/daily.type";

type SubjectInput = Pick<Subject, "topic" | "sub" | "detail">;

/** 세부주제 → 핵심 개념 목록 추천 */
export async function recommendConcepts(
  subject: SubjectInput,
): Promise<string[]> {
  const fn = httpsCallable<{ subject: SubjectInput }, { concepts: string[] }>(
    functions,
    "recommendConcepts",
  );
  const res = await fn({ subject });
  return res.data.concepts ?? [];
}

export interface GenerateQuestionsParams {
  subject: SubjectInput;
  targets: {
    conceptId: string;
    name: string;
    correctCount: number;
    wrongCount: number;
  }[];
  recentQuestions: string[];
}

/** 개념 목록 → 오늘의 문제 생성 (5단계 학습 화면에서 사용) */
export async function generateQuestions(
  params: GenerateQuestionsParams,
): Promise<GeneratedQuestion[]> {
  const fn = httpsCallable<
    GenerateQuestionsParams,
    { questions: GeneratedQuestion[] }
  >(functions, "generateQuestions");
  const res = await fn(params);
  return res.data.questions ?? [];
}
