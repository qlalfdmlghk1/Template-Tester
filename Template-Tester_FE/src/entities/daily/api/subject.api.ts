// subjects 스토어 CRUD
import type { Subject } from "../model/daily.type";
import { STORE, getAll, getById, putRecord, removeRecord } from "./db";

/** 주제 생성 (id·createdAt 자동 생성) */
export async function createSubject(
  input: Omit<Subject, "id" | "createdAt">,
  now: number = Date.now(),
): Promise<Subject> {
  const subject: Subject = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
  };
  return putRecord(STORE.subjects, subject);
}

/** 전체 주제 조회 */
export function getSubjects(): Promise<Subject[]> {
  return getAll<Subject>(STORE.subjects);
}

/** id로 주제 조회 */
export function getSubjectById(id: string): Promise<Subject | undefined> {
  return getById<Subject>(STORE.subjects, id);
}

/** 주제 수정 (전체 교체) */
export function updateSubject(subject: Subject): Promise<Subject> {
  return putRecord(STORE.subjects, subject);
}

/** 주제 삭제 */
export function deleteSubject(id: string): Promise<void> {
  return removeRecord(STORE.subjects, id);
}
