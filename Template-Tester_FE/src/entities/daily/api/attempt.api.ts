// attempts 스토어 CRUD
import type { Attempt } from "../model/daily.type";
import { STORE, getAll, getById, getAllByIndex, putRecord, removeRecord } from "./db";

/** 풀이 기록 생성 (id 자동 생성) */
export async function createAttempt(
  input: Omit<Attempt, "id">,
): Promise<Attempt> {
  const attempt: Attempt = { ...input, id: crypto.randomUUID() };
  return putRecord(STORE.attempts, attempt);
}

/** 전체 풀이 기록 조회 */
export function getAttempts(): Promise<Attempt[]> {
  return getAll<Attempt>(STORE.attempts);
}

/** id로 풀이 기록 조회 */
export function getAttemptById(id: string): Promise<Attempt | undefined> {
  return getById<Attempt>(STORE.attempts, id);
}

/** 특정 개념의 풀이 기록 조회 (by_concept 인덱스) */
export function getAttemptsByConcept(conceptId: string): Promise<Attempt[]> {
  return getAllByIndex<Attempt>(STORE.attempts, "by_concept", conceptId);
}

/** 기간 내 풀이 기록 조회 (by_solvedAt 인덱스) */
export function getAttemptsBetween(
  from: number,
  to: number,
): Promise<Attempt[]> {
  return getAllByIndex<Attempt>(
    STORE.attempts,
    "by_solvedAt",
    IDBKeyRange.bound(from, to),
  );
}

/** 풀이 기록 삭제 */
export function deleteAttempt(id: string): Promise<void> {
  return removeRecord(STORE.attempts, id);
}
