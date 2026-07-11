// Daily 학습 AI 프록시 (Firebase Callable Functions)
import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import {
  runRecommendConcepts,
  runGenerateQuestions,
  type SubjectInput,
  type ConceptTarget,
} from "./llm";

const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

function assertSubject(data: unknown): SubjectInput {
  const d = data as Record<string, unknown> | undefined;
  if (
    !d ||
    typeof d.topic !== "string" ||
    typeof d.sub !== "string" ||
    typeof d.detail !== "string"
  ) {
    throw new HttpsError("invalid-argument", "topic/sub/detail이 필요합니다.");
  }
  return { topic: d.topic, sub: d.sub, detail: d.detail };
}

function requireAuth(request: CallableRequest): void {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
  }
}

/** 세부주제 → 핵심 개념 목록 추천 */
export const recommendConcepts = onCall(
  { secrets: [ANTHROPIC_API_KEY] },
  async (request) => {
    requireAuth(request);
    const data = request.data as Record<string, unknown>;
    const subject = assertSubject(data?.subject ?? data);
    try {
      const concepts = await runRecommendConcepts(
        ANTHROPIC_API_KEY.value(),
        subject,
      );
      return { concepts };
    } catch (error) {
      console.error("recommendConcepts 실패:", error);
      throw new HttpsError("internal", "개념 추천에 실패했습니다.");
    }
  },
);

/** 개념 목록 → 오늘의 문제 생성 */
export const generateQuestions = onCall(
  { secrets: [ANTHROPIC_API_KEY] },
  async (request) => {
    requireAuth(request);
    const data = request.data as {
      subject?: unknown;
      targets?: unknown;
      recentQuestions?: unknown;
    };

    const subject = assertSubject(data?.subject);
    if (!Array.isArray(data?.targets) || data.targets.length === 0) {
      throw new HttpsError("invalid-argument", "targets가 필요합니다.");
    }
    const targets = data.targets as ConceptTarget[];
    const recentQuestions = Array.isArray(data?.recentQuestions)
      ? (data.recentQuestions as string[])
      : [];

    try {
      const questions = await runGenerateQuestions(
        ANTHROPIC_API_KEY.value(),
        subject,
        targets,
        recentQuestions,
      );
      return { questions };
    } catch (error) {
      console.error("generateQuestions 실패:", error);
      throw new HttpsError("internal", "문제 생성에 실패했습니다.");
    }
  },
);
