// 풀이 기록 세션 캐시
//
// 달력에 들어올 때마다 전체 기록을 다시 읽으면 Firestore 읽기 쿼터(무료 5만/일)를
// 빠르게 소모한다. 기록 172건 기준 진입 1회당 172 읽기이고, 개발 모드는 StrictMode가
// effect를 두 번 실행해 그 두 배가 된다.
//
// 그래서 (1) 같은 탭에서는 sessionStorage로 재사용하고, (2) 동시에 들어온 요청은
// 하나로 합친다. 새 기록은 동기화·수동 입력으로만 생기고 그때 캐시를 갱신하므로,
// TTL은 다른 기기에서 동기화한 경우를 위한 안전장치일 뿐이다.

import type { SolveLog } from "../model/solve-log.type";

const STORAGE_KEY = "template-tester:solve-logs";
const TTL_MS = 30 * 60 * 1000;

interface CacheEntry {
  userId: string;
  cachedAt: number;
  logs: SolveLog[];
}

/** 직렬화 형태 — Date는 JSON을 왕복하면 문자열이 되므로 되살려야 한다 */
interface StoredEntry {
  userId: string;
  cachedAt: number;
  logs: Array<Omit<SolveLog, "solvedAt"> & { solvedAt: string }>;
}

let memoryEntry: CacheEntry | null = null;
/** 진행 중인 조회 — StrictMode 이중 마운트에서 요청이 두 번 나가지 않게 합친다 */
let inFlight: Promise<SolveLog[]> | null = null;

function readStorage(): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredEntry;
    return {
      userId: stored.userId,
      cachedAt: stored.cachedAt,
      logs: stored.logs.map((log) => ({ ...log, solvedAt: new Date(log.solvedAt) })),
    };
  } catch {
    // 저장 형식이 바뀌었거나 sessionStorage를 못 쓰는 환경 — 캐시 없음으로 취급
    return null;
  }
}

function writeStorage(entry: CacheEntry): void {
  try {
    const stored: StoredEntry = {
      userId: entry.userId,
      cachedAt: entry.cachedAt,
      logs: entry.logs.map((log) => ({ ...log, solvedAt: log.solvedAt.toISOString() })),
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // 용량 초과 등 — 메모리 캐시만으로 동작시킨다
  }
}

/** 유효한 캐시가 있으면 반환 */
export function readCache(userId: string, now: number = Date.now()): SolveLog[] | null {
  const entry = memoryEntry ?? readStorage();
  if (!entry) return null;

  if (entry.userId !== userId || now - entry.cachedAt > TTL_MS) {
    return null;
  }

  memoryEntry = entry;
  return entry.logs;
}

export function writeCache(userId: string, logs: SolveLog[], now: number = Date.now()): void {
  const entry: CacheEntry = { userId, cachedAt: now, logs };
  memoryEntry = entry;
  writeStorage(entry);
}

/** 캐시된 목록을 부분 변경 (수동 기록 추가·수정·삭제) */
export function patchCache(userId: string, update: (logs: SolveLog[]) => SolveLog[]): void {
  const current = memoryEntry ?? readStorage();
  if (!current || current.userId !== userId) return;

  writeCache(userId, update(current.logs), current.cachedAt);
}

export function clearCache(): void {
  memoryEntry = null;
  inFlight = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시 — 메모리 캐시는 이미 비웠다
  }
}

/**
 * 동시 호출을 하나의 요청으로 합친다.
 *
 * StrictMode에서 effect가 두 번 실행돼도 네트워크 요청은 한 번만 나간다.
 */
export function dedupe(loader: () => Promise<SolveLog[]>): Promise<SolveLog[]> {
  if (inFlight) return inFlight;

  inFlight = loader().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
