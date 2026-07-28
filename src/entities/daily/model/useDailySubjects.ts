import { useState, useEffect, useCallback } from "react";
import type { Subject } from "./daily.type";
import { newConceptSeed } from "./sm2";
import { getSubjects, createSubject, deleteSubject } from "../api/subject.api";
import {
  getConcepts,
  getConceptsBySubject,
  createConcept,
  deleteConcept,
} from "../api/concept.api";

export interface CreateSubjectInput {
  topic: string;
  sub: string;
  detail: string;
  conceptNames: string[];
}

/** 데일리 학습 주제 목록 관리 (IndexedDB 기반) */
export function useDailySubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [conceptCounts, setConceptCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [subjectList, conceptList] = await Promise.all([
        getSubjects(),
        getConcepts(),
      ]);

      const counts: Record<string, number> = {};
      for (const concept of conceptList) {
        counts[concept.subjectId] = (counts[concept.subjectId] ?? 0) + 1;
      }

      setSubjects(
        [...subjectList].sort((a, b) => b.createdAt - a.createdAt),
      );
      setConceptCounts(counts);
    } catch (error) {
      console.error("주제 목록 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** 주제 + 개념 일괄 생성 */
  const createSubjectWithConcepts = useCallback(
    async (input: CreateSubjectInput): Promise<Subject> => {
      const now = Date.now();
      const subject = await createSubject(
        { topic: input.topic, sub: input.sub, detail: input.detail },
        now,
      );
      await Promise.all(
        input.conceptNames.map((name) =>
          createConcept(newConceptSeed(subject.id, name, now)),
        ),
      );
      await load();
      return subject;
    },
    [load],
  );

  /** 주제 삭제 (소속 개념도 함께 삭제) */
  const removeSubject = useCallback(
    async (subjectId: string): Promise<void> => {
      const concepts = await getConceptsBySubject(subjectId);
      await Promise.all(concepts.map((c) => deleteConcept(c.id)));
      await deleteSubject(subjectId);
      await load();
    },
    [load],
  );

  return {
    subjects,
    conceptCounts,
    isLoading,
    createSubjectWithConcepts,
    removeSubject,
    reload: load,
  };
}
