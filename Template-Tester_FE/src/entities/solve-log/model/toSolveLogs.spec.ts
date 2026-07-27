import { describe, it, expect } from "vitest";
import { toSolveLogs, groupByDateKey } from "./toSolveLogs";
import type { GithubCommit } from "../api/github.api";

const TREE = [
  "프로그래머스/2/42578. 의상/README.md",
  "프로그래머스/2/42578. 의상/의상.js",
  "프로그래머스/1/1845. 폰켓몬/폰켓몬.js",
  "백준/Bronze/1000. A＋B/A＋B.py",
  "README.md",
];

function commit(sha: string, message: string, committedAt: string): GithubCommit {
  return { sha, message, committedAt };
}

describe("toSolveLogs", () => {
  it("BaekjoonHub 커밋을 풀이 기록으로 변환해야 한다", () => {
    const logs = toSolveLogs({
      userId: "uid1",
      treePaths: TREE,
      commits: [
        commit(
          "a1",
          "[level 2] Title: 의상, Time: 0.23 ms, Memory: 44.1 MB -BaekjoonHub",
          "2026-07-25T16:27:50Z",
        ),
      ],
    });

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      id: "uid1__programmers__42578__20260726",
      userId: "uid1",
      platform: "programmers",
      problemNo: "42578",
      title: "의상",
      difficulty: "level 2",
      level: 2,
      language: "js",
      dateKey: "2026-07-26",
      source: "baekjoonhub",
      runtime: "0.23 ms",
      memory: "44.1 MB",
      url: "https://school.programmers.co.kr/learn/courses/30/lessons/42578",
      memo: null,
    });
  });

  it("UTC 커밋 시각을 KST 날짜로 끊어야 한다", () => {
    const logs = toSolveLogs({
      userId: "uid1",
      treePaths: TREE,
      commits: [
        commit("a1", "[level 1] Title: 폰켓몬, Time: 1 ms, Memory: 1 MB -BaekjoonHub", "2026-07-25T16:00:00Z"),
      ],
    });

    // UTC로 끊으면 07-25지만 KST로는 07-26이다
    expect(logs[0].dateKey).toBe("2026-07-26");
  });

  it("BaekjoonHub 커밋이 아닌 것은 제외해야 한다", () => {
    const logs = toSolveLogs({
      userId: "uid1",
      treePaths: TREE,
      commits: [
        commit("a1", "260404 업로드", "2026-04-04T17:25:16Z"),
        commit("a2", "Chore: 풀이 파일 일자별 폴더 구조로 재정리", "2026-04-19T08:29:02Z"),
      ],
    });

    expect(logs).toHaveLength(0);
  });

  it("같은 문제를 같은 날 재제출하면 한 건으로 합쳐야 한다", () => {
    const logs = toSolveLogs({
      userId: "uid1",
      treePaths: TREE,
      commits: [
        // GitHub 커밋 목록은 최신순 — 앞의 것이 나중 커밋(개선한 풀이)
        commit("new", "[level 2] Title: 의상, Time: 0.10 ms, Memory: 40 MB -BaekjoonHub", "2026-07-26T05:00:00Z"),
        commit("old", "[level 2] Title: 의상, Time: 0.23 ms, Memory: 44.1 MB -BaekjoonHub", "2026-07-26T01:00:00Z"),
      ],
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].runtime).toBe("0.10 ms");
  });

  it("같은 문제라도 날짜가 다르면 각각 남겨야 한다", () => {
    const logs = toSolveLogs({
      userId: "uid1",
      treePaths: TREE,
      commits: [
        commit("a1", "[level 2] Title: 의상, Time: 1 ms, Memory: 1 MB -BaekjoonHub", "2026-07-26T05:00:00Z"),
        commit("a2", "[level 2] Title: 의상, Time: 2 ms, Memory: 2 MB -BaekjoonHub", "2026-07-20T05:00:00Z"),
      ],
    });

    expect(logs).toHaveLength(2);
    expect(logs.map((log) => log.dateKey).sort()).toEqual(["2026-07-20", "2026-07-26"]);
  });

  it("전각 제목이 든 경로와도 매칭해 문제 번호를 채워야 한다", () => {
    const logs = toSolveLogs({
      userId: "uid1",
      treePaths: TREE,
      commits: [
        commit("a1", "[Bronze V] Title: A+B, Time: 40 ms, Memory: 32412 KB -BaekjoonHub", "2026-03-01T05:00:00Z"),
      ],
    });

    expect(logs[0].problemNo).toBe("1000");
    expect(logs[0].url).toBe("https://www.acmicpc.net/problem/1000");
    expect(logs[0].language).toBe("py");
  });

  it("트리에 없는 문제는 번호·링크 없이 기록만 남겨야 한다", () => {
    const logs = toSolveLogs({
      userId: "uid1",
      treePaths: TREE,
      commits: [
        commit("a1", "[level 3] Title: 없는문제, Time: 1 ms, Memory: 1 MB -BaekjoonHub", "2026-07-26T05:00:00Z"),
      ],
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].problemNo).toBeNull();
    expect(logs[0].url).toBeNull();
    expect(logs[0].title).toBe("없는문제");
  });

  it("사용자가 다르면 다른 ID를 만들어야 한다", () => {
    const params = {
      treePaths: TREE,
      commits: [
        commit("a1", "[level 2] Title: 의상, Time: 1 ms, Memory: 1 MB -BaekjoonHub", "2026-07-26T05:00:00Z"),
      ],
    };

    const a = toSolveLogs({ ...params, userId: "uid1" });
    const b = toSolveLogs({ ...params, userId: "uid2" });

    expect(a[0].id).not.toBe(b[0].id);
  });
});

describe("groupByDateKey", () => {
  it("날짜별로 묶어야 한다", () => {
    const logs = toSolveLogs({
      userId: "uid1",
      treePaths: TREE,
      commits: [
        commit("a1", "[level 2] Title: 의상, Time: 1 ms, Memory: 1 MB -BaekjoonHub", "2026-07-26T05:00:00Z"),
        commit("a2", "[level 1] Title: 폰켓몬, Time: 1 ms, Memory: 1 MB -BaekjoonHub", "2026-07-26T06:00:00Z"),
        commit("a3", "[Bronze V] Title: A+B, Time: 1 ms, Memory: 1 KB -BaekjoonHub", "2026-07-20T06:00:00Z"),
      ],
    });

    const grouped = groupByDateKey(logs);

    expect(grouped.get("2026-07-26")).toHaveLength(2);
    expect(grouped.get("2026-07-20")).toHaveLength(1);
    expect(grouped.get("2026-07-19")).toBeUndefined();
  });

  it("빈 목록이면 빈 맵이어야 한다", () => {
    expect(groupByDateKey([]).size).toBe(0);
  });
});
