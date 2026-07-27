import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  readCache,
  writeCache,
  patchCache,
  clearCache,
  dedupe,
  currentGeneration,
  isCurrentGeneration,
} from "./solveLogCache";
import type { SolveLog } from "../model/solve-log.type";

function makeLog(overrides: Partial<SolveLog> = {}): SolveLog {
  return {
    id: "uid1__programmers__42578__20260726",
    userId: "uid1",
    platform: "programmers",
    problemNo: "42578",
    title: "의상",
    difficulty: "level 2",
    level: 2,
    language: "js",
    solvedAt: new Date("2026-07-25T16:27:50Z"),
    dateKey: "2026-07-26",
    source: "baekjoonhub",
    runtime: "0.23 ms",
    memory: "44.1 MB",
    url: "https://school.programmers.co.kr/learn/courses/30/lessons/42578",
    memo: null,
    ...overrides,
  };
}

const NOW = new Date("2026-07-27T10:00:00Z").getTime();

beforeEach(() => {
  clearCache();
  sessionStorage.clear();
});

describe("readCache / writeCache", () => {
  it("쓴 값을 그대로 돌려줘야 한다", () => {
    writeCache("uid1", [makeLog()], NOW);
    expect(readCache("uid1", NOW)).toHaveLength(1);
  });

  it("캐시가 없으면 null이어야 한다", () => {
    expect(readCache("uid1", NOW)).toBeNull();
  });

  it("다른 사용자의 캐시는 쓰지 않아야 한다", () => {
    writeCache("uid1", [makeLog()], NOW);
    expect(readCache("uid2", NOW)).toBeNull();
  });

  it("30분이 지나면 만료돼야 한다", () => {
    writeCache("uid1", [makeLog()], NOW);

    expect(readCache("uid1", NOW + 29 * 60 * 1000)).not.toBeNull();
    expect(readCache("uid1", NOW + 31 * 60 * 1000)).toBeNull();
  });

  it("clearCache 이후에는 비어야 한다", () => {
    writeCache("uid1", [makeLog()], NOW);
    clearCache();
    expect(readCache("uid1", NOW)).toBeNull();
  });
});

describe("sessionStorage 왕복", () => {
  it("메모리 캐시가 비어도 sessionStorage에서 복구해야 한다", () => {
    writeCache("uid1", [makeLog()], NOW);

    // 페이지 새로고침 상황 — 모듈 상태만 날아가고 sessionStorage는 남는다
    const stored = sessionStorage.getItem("template-tester:solve-logs");
    clearCache();
    sessionStorage.setItem("template-tester:solve-logs", stored!);

    expect(readCache("uid1", NOW)).toHaveLength(1);
  });

  it("복구한 solvedAt이 Date여야 한다 (JSON 왕복 시 문자열이 됨)", () => {
    writeCache("uid1", [makeLog()], NOW);

    const stored = sessionStorage.getItem("template-tester:solve-logs");
    clearCache();
    sessionStorage.setItem("template-tester:solve-logs", stored!);

    const restored = readCache("uid1", NOW);
    expect(restored?.[0].solvedAt).toBeInstanceOf(Date);
    expect(restored?.[0].solvedAt.toISOString()).toBe("2026-07-25T16:27:50.000Z");
  });

  it("저장 형식이 깨져 있으면 캐시 없음으로 취급해야 한다", () => {
    sessionStorage.setItem("template-tester:solve-logs", "{깨진 JSON");
    expect(readCache("uid1", NOW)).toBeNull();
  });
});

describe("patchCache", () => {
  it("항목을 추가해야 한다", () => {
    writeCache("uid1", [makeLog()], NOW);
    patchCache("uid1", (logs) => [...logs, makeLog({ id: "manual-1", title: "추가" })]);

    expect(readCache("uid1", NOW)).toHaveLength(2);
  });

  it("항목을 제거해야 한다", () => {
    writeCache("uid1", [makeLog(), makeLog({ id: "manual-1" })], NOW);
    patchCache("uid1", (logs) => logs.filter((log) => log.id !== "manual-1"));

    expect(readCache("uid1", NOW)).toHaveLength(1);
  });

  it("다른 사용자의 캐시는 건드리지 않아야 한다", () => {
    writeCache("uid1", [makeLog()], NOW);
    patchCache("uid2", () => []);

    expect(readCache("uid1", NOW)).toHaveLength(1);
  });

  it("만료 시각을 연장하지 않아야 한다", () => {
    writeCache("uid1", [makeLog()], NOW);
    patchCache("uid1", (logs) => [...logs]);

    // 원래 cachedAt이 유지되므로 31분 뒤에는 여전히 만료
    expect(readCache("uid1", NOW + 31 * 60 * 1000)).toBeNull();
  });
});

describe("dedupe", () => {
  it("동시에 들어온 요청을 한 번만 실행해야 한다 (StrictMode 이중 마운트)", async () => {
    const loader = vi.fn().mockResolvedValue([makeLog()]);

    const [first, second] = await Promise.all([dedupe(loader), dedupe(loader)]);

    expect(loader).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it("앞선 요청이 끝난 뒤에는 다시 실행해야 한다", async () => {
    const loader = vi.fn().mockResolvedValue([makeLog()]);

    await dedupe(loader);
    await dedupe(loader);

    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("실패해도 다음 요청이 막히지 않아야 한다", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("네트워크 오류"));
    await expect(dedupe(failing)).rejects.toThrow("네트워크 오류");

    const succeeding = vi.fn().mockResolvedValue([makeLog()]);
    await expect(dedupe(succeeding)).resolves.toHaveLength(1);
  });

  it("bypass면 진행 중인 요청에 합류하지 않아야 한다", async () => {
    // 강제 새로고침이 동기화 이전 스냅샷을 돌려받으면 안 된다
    const stale = vi.fn().mockResolvedValue([makeLog({ title: "예전" })]);
    const fresh = vi.fn().mockResolvedValue([makeLog({ title: "최신" })]);

    const first = dedupe(stale);
    const second = dedupe(fresh, { bypass: true });

    expect((await second)[0].title).toBe("최신");
    expect((await first)[0].title).toBe("예전");
    expect(fresh).toHaveBeenCalledTimes(1);
  });

  it("bypass 요청이 이후 합류 대상이 되어야 한다 (낡은 요청이 아니라)", async () => {
    let resolveStale: ((logs: SolveLog[]) => void) | undefined;
    const stale = vi.fn().mockReturnValue(
      new Promise<SolveLog[]>((resolve) => {
        resolveStale = resolve;
      }),
    );
    let resolveFresh: ((logs: SolveLog[]) => void) | undefined;
    const fresh = vi.fn().mockReturnValue(
      new Promise<SolveLog[]>((resolve) => {
        resolveFresh = resolve;
      }),
    );
    const another = vi.fn().mockResolvedValue([makeLog()]);

    const stalePromise = dedupe(stale);
    const freshPromise = dedupe(fresh, { bypass: true });

    // 둘 다 진행 중일 때 새 요청은 더 신선한 쪽(bypass 요청)에 합류해야 한다
    const joined = dedupe(another);
    expect(another).not.toHaveBeenCalled();

    resolveFresh?.([makeLog({ title: "최신" })]);
    expect((await joined)[0].title).toBe("최신");
    await freshPromise;

    resolveStale?.([makeLog({ title: "예전" })]);
    await stalePromise;
  });

  it("뒤늦게 끝난 낡은 요청이 새 요청의 슬롯을 지우지 않아야 한다", async () => {
    let resolveStale: ((logs: SolveLog[]) => void) | undefined;
    const stale = vi.fn().mockReturnValue(
      new Promise<SolveLog[]>((resolve) => {
        resolveStale = resolve;
      }),
    );
    let resolveFresh: ((logs: SolveLog[]) => void) | undefined;
    const fresh = vi.fn().mockReturnValue(
      new Promise<SolveLog[]>((resolve) => {
        resolveFresh = resolve;
      }),
    );
    const another = vi.fn().mockResolvedValue([makeLog()]);

    const stalePromise = dedupe(stale);
    const freshPromise = dedupe(fresh, { bypass: true });

    // 낡은 요청이 먼저 끝나도 슬롯 주인은 fresh 이므로 합류가 유지돼야 한다
    resolveStale?.([makeLog()]);
    await stalePromise;

    dedupe(another);
    expect(another).not.toHaveBeenCalled();

    resolveFresh?.([makeLog()]);
    await freshPromise;
  });
});

describe("세대(generation)", () => {
  it("clearCache 이후에는 이전 세대가 무효여야 한다", () => {
    const captured = currentGeneration();
    expect(isCurrentGeneration(captured)).toBe(true);

    clearCache();

    expect(isCurrentGeneration(captured)).toBe(false);
  });

  it("clearCache가 없으면 세대가 유지돼야 한다", () => {
    const captured = currentGeneration();
    writeCache("uid1", [makeLog()], NOW);
    patchCache("uid1", (logs) => logs);

    expect(isCurrentGeneration(captured)).toBe(true);
  });
});
