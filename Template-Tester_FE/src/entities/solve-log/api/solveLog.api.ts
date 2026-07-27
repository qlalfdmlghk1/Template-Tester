// solveLogs 컬렉션 CRUD
//
// 문서 ID가 `{uid}__{platform}__{번호}__{YYYYMMDD}` 결정적 키라서, 동기화 구간이 겹쳐도
// 중복 생성 대신 덮어쓰기가 된다. 다만 수동 기록은 동기화가 지우지 않도록 분리해 다룬다.

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/shared/api/firebase";
import { toKstDateKey } from "@/shared/lib/date";
import { buildProblemUrl } from "../model/baekjoonHub";
import {
  readCache,
  writeCache,
  patchCache,
  clearCache,
  dedupe,
  currentGeneration,
  isCurrentGeneration,
} from "./solveLogCache";
import type { SolveLog, SolvePlatform } from "../model/solve-log.type";

const COLLECTION = "solveLogs";

/** Firestore 일괄 쓰기 1회 상한 */
const BATCH_LIMIT = 500;

/** Firestore 문서 → SolveLog */
function toSolveLog(id: string, data: Record<string, unknown>): SolveLog {
  return {
    id,
    userId: data.userId as string,
    platform: data.platform as SolvePlatform,
    problemNo: (data.problemNo as string | null) ?? null,
    title: (data.title as string) ?? "",
    difficulty: (data.difficulty as string | null) ?? null,
    level: (data.level as number | null) ?? null,
    language: (data.language as string | null) ?? null,
    solvedAt: (data.solvedAt as Timestamp).toDate(),
    dateKey: data.dateKey as string,
    source: data.source === "manual" ? "manual" : "baekjoonhub",
    runtime: (data.runtime as string | null) ?? null,
    memory: (data.memory as string | null) ?? null,
    url: (data.url as string | null) ?? null,
    memo: (data.memo as string | null) ?? null,
  };
}

/** SolveLog → Firestore 문서 (id는 문서 키로 쓰므로 본문에 넣지 않는다) */
function toDocument(log: SolveLog): Record<string, unknown> {
  return {
    userId: log.userId,
    platform: log.platform,
    problemNo: log.problemNo,
    title: log.title,
    difficulty: log.difficulty,
    level: log.level,
    language: log.language,
    solvedAt: Timestamp.fromDate(log.solvedAt),
    dateKey: log.dateKey,
    source: log.source,
    runtime: log.runtime,
    memory: log.memory,
    url: log.url,
    memo: log.memo,
  };
}

/**
 * 로그인 사용자의 전체 풀이 기록.
 *
 * 같은 탭 안에서는 세션 캐시를 재사용한다 — 진입할 때마다 전체를 읽으면
 * Firestore 읽기 쿼터를 빠르게 소모하기 때문이다.
 *
 * @param refresh true면 캐시를 무시하고 새로 읽는다 (동기화 직후)
 */
export async function getSolveLogs({ refresh = false } = {}): Promise<SolveLog[]> {
  const user = auth.currentUser;
  if (!user) return [];

  if (!refresh) {
    const cached = readCache(user.uid);
    if (cached) return cached;
  }

  return dedupe(
    async () => {
      // 이 조회가 시작된 세대. 도중에 동기화가 캐시를 비웠다면 결과를 캐시에 쓰지 않는다.
      const startedAt = currentGeneration();

      const snapshot = await getDocs(
        query(collection(db, COLLECTION), where("userId", "==", user.uid)),
      );

      const logs = snapshot.docs.map((docSnapshot) =>
        toSolveLog(docSnapshot.id, docSnapshot.data()),
      );

      if (isCurrentGeneration(startedAt)) {
        writeCache(user.uid, logs);
      }
      return logs;
    },
    // 강제 새로고침은 진행 중인(=동기화 이전 스냅샷일 수 있는) 조회에 합류하지 않는다
    { bypass: refresh },
  );
}

/** 로그아웃·계정 전환 시 캐시를 비운다 */
export function clearSolveLogCache(): void {
  clearCache();
}

/**
 * 동기화 결과 저장.
 *
 * 500건 단위로 끊어 batch 커밋한다. 이미 있는 문서는 덮어쓴다.
 * @returns 저장한 건수
 */
export async function saveSolveLogs(logs: SolveLog[]): Promise<number> {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");
  if (logs.length === 0) return 0;

  for (let start = 0; start < logs.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);

    for (const log of logs.slice(start, start + BATCH_LIMIT)) {
      batch.set(doc(db, COLLECTION, log.id), toDocument(log));
    }

    await batch.commit();
  }

  // 대량 반영이라 부분 갱신 대신 비운다 — 다음 조회에서 refresh로 다시 읽는다
  clearCache();
  return logs.length;
}

export interface ManualLogInput {
  platform: SolvePlatform;
  title: string;
  problemNo: string | null;
  difficulty: string | null;
  language: string | null;
  dateKey: string;
  memo: string | null;
}

/**
 * 수동 기록 저장.
 *
 * 자동 동기화와 문서 ID가 겹치지 않도록 `manual` 접두사와 생성 시각을 섞는다.
 * 같은 날 같은 문제를 여러 번 적을 수도 있어야 하므로 결정적 키를 쓰지 않는다.
 */
export async function saveManualSolveLog(input: ManualLogInput): Promise<SolveLog> {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");

  const id = `${user.uid}__manual__${crypto.randomUUID()}`;
  const log: SolveLog = {
    id,
    userId: user.uid,
    platform: input.platform,
    problemNo: input.problemNo,
    title: input.title,
    difficulty: input.difficulty,
    level: null,
    language: input.language,
    // 수동 기록은 시각 정보가 없으므로 해당 날짜의 KST 자정을 쓴다
    solvedAt: new Date(`${input.dateKey}T00:00:00+09:00`),
    dateKey: input.dateKey,
    source: "manual",
    runtime: null,
    memory: null,
    url: buildProblemUrl(input.platform, input.problemNo),
    memo: input.memo,
  };

  await setDoc(doc(db, COLLECTION, id), toDocument(log));
  patchCache(user.uid, (logs) => [...logs, log]);
  return log;
}

/** 수동 기록 수정 (자동 기록은 다음 동기화 때 덮어써지므로 수정 대상이 아니다) */
export async function updateManualSolveLog(log: SolveLog): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");

  await setDoc(doc(db, COLLECTION, log.id), toDocument(log));
  patchCache(user.uid, (logs) => logs.map((item) => (item.id === log.id ? log : item)));
}

export async function deleteSolveLog(logId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");

  await deleteDoc(doc(db, COLLECTION, logId));
  patchCache(user.uid, (logs) => logs.filter((item) => item.id !== logId));
}

/** 오늘 날짜 키 (수동 기록 폼 기본값) */
export function getTodayDateKey(): string {
  return toKstDateKey(new Date());
}
