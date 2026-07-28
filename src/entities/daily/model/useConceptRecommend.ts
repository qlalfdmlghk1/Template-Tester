import { useState } from "react";
import { recommendConcepts } from "../api/ai.api";
import type { Subject } from "./daily.type";

type SubjectInput = Pick<Subject, "topic" | "sub" | "detail">;

/** AI 개념 추천 (하이브리드 시딩의 AI 제안 단계) */
export function useConceptRecommend() {
  const [isRecommending, setIsRecommending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommend = async (subject: SubjectInput): Promise<string[]> => {
    setIsRecommending(true);
    setError(null);
    try {
      return await recommendConcepts(subject);
    } catch (err) {
      console.error("개념 추천 실패:", err);
      setError("개념 추천에 실패했습니다. 잠시 후 다시 시도해주세요.");
      return [];
    } finally {
      setIsRecommending(false);
    }
  };

  return { recommend, isRecommending, error };
}
