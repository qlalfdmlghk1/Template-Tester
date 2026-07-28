import { useState } from "react";
import type { CreateSubjectInput } from "./useDailySubjects";

interface UseSubjectFormParams {
  onSubmit: (input: CreateSubjectInput) => Promise<void>;
}

/** 주제 생성 폼 상태 (topic/sub/detail + 수동 개념 편집기) */
export function useSubjectForm({ onSubmit }: UseSubjectFormParams) {
  const [topic, setTopic] = useState("");
  const [sub, setSub] = useState("");
  const [detail, setDetail] = useState("");
  const [concepts, setConcepts] = useState<string[]>([]);
  const [conceptInput, setConceptInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAddConcept = conceptInput.trim().length > 0;

  const isValid =
    topic.trim().length > 0 &&
    sub.trim().length > 0 &&
    detail.trim().length > 0 &&
    concepts.length > 0;

  /** 개념 추가 (공백/중복은 무시, 대소문자 무시 비교) */
  const addConcept = () => {
    const name = conceptInput.trim();
    setConceptInput("");
    if (!name) return;
    setConcepts((prev) =>
      prev.some((c) => c.toLowerCase() === name.toLowerCase())
        ? prev
        : [...prev, name],
    );
  };

  /** 여러 개념을 한 번에 추가 (4단계 AI 추천 결과 주입용) */
  const addConcepts = (names: string[]) => {
    setConcepts((prev) => {
      const merged = [...prev];
      for (const raw of names) {
        const name = raw.trim();
        if (!name) continue;
        if (!merged.some((c) => c.toLowerCase() === name.toLowerCase())) {
          merged.push(name);
        }
      }
      return merged;
    });
  };

  const removeConcept = (name: string) => {
    setConcepts((prev) => prev.filter((c) => c !== name));
  };

  const resetForm = () => {
    setTopic("");
    setSub("");
    setDetail("");
    setConcepts([]);
    setConceptInput("");
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        topic: topic.trim(),
        sub: sub.trim(),
        detail: detail.trim(),
        conceptNames: concepts,
      });
      resetForm();
    } catch (error) {
      console.error("주제 생성 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    topic,
    setTopic,
    sub,
    setSub,
    detail,
    setDetail,
    concepts,
    conceptInput,
    setConceptInput,
    canAddConcept,
    addConcept,
    addConcepts,
    removeConcept,
    isValid,
    isSubmitting,
    handleSubmit,
    resetForm,
  };
}
