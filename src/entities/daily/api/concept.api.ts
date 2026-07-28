// concepts 스토어 CRUD
import type { Concept } from "../model/daily.type";
import { STORE, getAll, getById, getAllByIndex, putRecord, removeRecord } from "./db";

/** 개념 생성 (id 자동 생성, SM-2 초기값은 호출부에서 지정) */
export async function createConcept(
  input: Omit<Concept, "id">,
): Promise<Concept> {
  const concept: Concept = { ...input, id: crypto.randomUUID() };
  return putRecord(STORE.concepts, concept);
}

/** 전체 개념 조회 */
export function getConcepts(): Promise<Concept[]> {
  return getAll<Concept>(STORE.concepts);
}

/** id로 개념 조회 */
export function getConceptById(id: string): Promise<Concept | undefined> {
  return getById<Concept>(STORE.concepts, id);
}

/** 특정 주제에 속한 개념 조회 (by_subject 인덱스) */
export function getConceptsBySubject(subjectId: string): Promise<Concept[]> {
  return getAllByIndex<Concept>(STORE.concepts, "by_subject", subjectId);
}

/** 복습 대상 개념 조회: nextReviewAt <= now (by_nextReview 인덱스) */
export function getDueConcepts(now: number = Date.now()): Promise<Concept[]> {
  return getAllByIndex<Concept>(
    STORE.concepts,
    "by_nextReview",
    IDBKeyRange.upperBound(now),
  );
}

/** 개념 수정 (전체 교체) */
export function updateConcept(concept: Concept): Promise<Concept> {
  return putRecord(STORE.concepts, concept);
}

/** 개념 삭제 */
export function deleteConcept(id: string): Promise<void> {
  return removeRecord(STORE.concepts, id);
}
