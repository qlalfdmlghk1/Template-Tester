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
/**
 * 캐시 세대. `clearCache()`가 증가시킨다.
 *
 * 진행 중인 조회는 취소할 수 없어서, 동기화로 캐시를 비운 뒤에 뒤늦게 끝난 조회가
 * 동기화 이전 목록으로 캐시를 되살릴 수 있다. 조회 시작 시점의 세대를 들고 있다가
 * 완료 시 달라져 있으면 쓰기를 버린다.
 */
let generation = 0;

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

/** 현재 세대 — 조회 시작 시점에 받아 두었다가 `isCurrentGeneration`으로 확인한다 */
export function currentGeneration(): number {
  return generation;
}

/** 이 세대가 아직 유효한가 (그 사이 clearCache가 있었으면 false) */
export function isCurrentGeneration(captured: number): boolean {
  return captured === generation;
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
  generation++;
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
 *
 * @param bypass 진행 중인 요청에 합류하지 않고 새로 실행한다.
 *   강제 새로고침(동기화 직후)이 낡은 조회 결과를 돌려받지 않게 하기 위함이다.
 */
export function dedupe(
  loader: () => Promise<SolveLog[]>,
  { bypass = false } = {},
): Promise<SolveLog[]> {
  if (!bypass && inFlight) return inFlight;

  const pending = loader().finally(() => {
    // 자기 자신일 때만 슬롯을 비운다 — 뒤늦게 끝난 요청이 남의 슬롯을 지우면
    // 그 시점부터 중복 요청 방지가 풀린다
    if (inFlight === pending) inFlight = null;
  });

  inFlight = pending;
  return pending;
}
