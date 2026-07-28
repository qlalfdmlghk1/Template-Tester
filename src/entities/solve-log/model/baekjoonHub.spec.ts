import { describe, it, expect } from "vitest";
import {
  normalizeProblemTitle,
  isBaekjoonHubCommit,
  parseBaekjoonHubMessage,
  buildProblemIndex,
  toIndexKey,
  buildProblemUrl,
  buildSolveLogId,
} from "./baekjoonHub";

describe("parseBaekjoonHubMessage", () => {
  it("프로그래머스 커밋을 파싱해야 한다", () => {
    // 실제 커밋 메시지 (qlalfdmlghk1/Algorism_Python)
    const result = parseBaekjoonHubMessage(
      "[level 2] Title: 의상, Time: 0.23 ms, Memory: 44.1 MB -BaekjoonHub",
    );

    expect(result).toEqual({
      platform: "programmers",
      title: "의상",
      difficulty: "level 2",
      level: 2,
      runtime: "0.23 ms",
      memory: "44.1 MB",
      score: null,
    });
  });

  it("백준 커밋을 파싱해야 한다", () => {
    const result = parseBaekjoonHubMessage(
      "[Silver III] Title: 두 수의 합, Time: 80 ms, Memory: 42660 KB -BaekjoonHub",
    );

    expect(result).toEqual({
      platform: "boj",
      title: "두 수의 합",
      difficulty: "Silver III",
      level: null,
      runtime: "80 ms",
      memory: "42660 KB",
      score: null,
    });
  });

  it("Score가 붙은 변형을 파싱해야 한다", () => {
    const result = parseBaekjoonHubMessage(
      "[Silver I] Title: 볼 모으기, Time: 192 ms, Memory: 40880 KB, Score: 100 point -BaekjoonHub",
    );

    expect(result?.title).toBe("볼 모으기");
    expect(result?.memory).toBe("40880 KB");
    expect(result?.score).toBe("100 point");
  });

  it("Time이 비고 Memory가 undefined인 SQL 문제 변형을 처리해야 한다", () => {
    const result = parseBaekjoonHubMessage(
      "[level 2] Title: 진료과별 총 예약 횟수 출력하기, Time: , Memory: undefined -BaekjoonHub",
    );

    expect(result?.title).toBe("진료과별 총 예약 횟수 출력하기");
    expect(result?.runtime).toBeNull();
    expect(result?.memory).toBeNull();
  });

  it("제목에 특수문자가 있어도 파싱해야 한다", () => {
    const result = parseBaekjoonHubMessage(
      "[Bronze V] Title: 1998년생인 내가 태국에서는 2541년생?!, Time: 40 ms, Memory: 32412 KB -BaekjoonHub",
    );

    expect(result?.title).toBe("1998년생인 내가 태국에서는 2541년생?!");
  });

  it("제목이 비어 있으면 파싱 실패로 취급해야 한다", () => {
    // 통과시키면 문서 ID가 `t-`로 퇴화해 같은 날 기록이 한 건으로 합쳐진다
    expect(
      parseBaekjoonHubMessage("[level 1] Title: , Time: 1 ms, Memory: 1 MB -BaekjoonHub"),
    ).toBeNull();
    expect(
      parseBaekjoonHubMessage("[level 1] Title:    , Time: 1 ms, Memory: 1 MB -BaekjoonHub"),
    ).toBeNull();
  });

  it("사용자가 직접 만든 뭉치 커밋은 걸러야 한다", () => {
    expect(parseBaekjoonHubMessage("260202-260331 업로드")).toBeNull();
    expect(parseBaekjoonHubMessage("Chore: 풀이 파일 일자별 폴더 구조로 재정리")).toBeNull();
    expect(parseBaekjoonHubMessage("Chore: BOJ, Programers 분류별 폴더 신규 추가")).toBeNull();
  });

  it("머지 커밋을 걸러야 한다", () => {
    expect(
      parseBaekjoonHubMessage(
        "Merge branch 'master' of https://github.com/qlalfdmlghk1/CodingTest_Python",
      ),
    ).toBeNull();
  });

  it("여러 줄 메시지는 첫 줄만 본다", () => {
    const result = parseBaekjoonHubMessage(
      "[level 1] Title: 폰켓몬, Time: 1.15 ms, Memory: 50.2 MB -BaekjoonHub\n\n본문 설명",
    );

    expect(result?.title).toBe("폰켓몬");
  });

  it("level 표기가 붙어 있어도 프로그래머스로 판정해야 한다", () => {
    expect(parseBaekjoonHubMessage("[level3] Title: 등굣길, Time: 1 ms, Memory: 1 MB -BaekjoonHub"))
      .toMatchObject({ platform: "programmers", level: 3 });
  });
});

describe("isBaekjoonHubCommit", () => {
  it("꼬리표가 있으면 true여야 한다", () => {
    expect(isBaekjoonHubCommit("[level 2] Title: 의상, Time: 1 ms, Memory: 1 MB -BaekjoonHub")).toBe(
      true,
    );
  });

  it("꼬리표가 없으면 false여야 한다", () => {
    expect(isBaekjoonHubCommit("260404 업로드")).toBe(false);
  });
});

describe("normalizeProblemTitle", () => {
  it("전각 더하기를 반각으로 되돌려야 한다", () => {
    expect(normalizeProblemTitle("A＋B")).toBe("A+B");
  });

  it("전각 빼기를 반각으로 되돌려야 한다", () => {
    expect(normalizeProblemTitle("별 찍기 － 1")).toBe("별 찍기 - 1");
  });

  it("전각 물음표·느낌표를 되돌려야 한다", () => {
    expect(normalizeProblemTitle("1998년생인 내가 태국에서는 2541년생？！")).toBe(
      "1998년생인 내가 태국에서는 2541년생?!",
    );
  });

  it("연속 공백을 하나로 줄이고 앞뒤를 다듬어야 한다", () => {
    expect(normalizeProblemTitle("  두   수의  합 ")).toBe("두 수의 합");
  });

  it("한글은 그대로 둬야 한다", () => {
    expect(normalizeProblemTitle("의상")).toBe("의상");
  });

  it("경로 제목과 커밋 제목이 같은 키로 정규화돼야 한다", () => {
    // 경로에는 전각, 커밋 메시지에는 원문이 들어온다
    expect(normalizeProblemTitle("A＋B")).toBe(normalizeProblemTitle("A+B"));
  });
});

describe("buildProblemIndex", () => {
  const paths = [
    "프로그래머스/2/42578. 의상/README.md",
    "프로그래머스/2/42578. 의상/의상.js",
    "프로그래머스/1/1845. 폰켓몬/폰켓몬.py",
    "백준/Bronze/1000. A＋B/README.md",
    "백준/Bronze/1000. A＋B/A＋B.py",
    "백준/Silver/2438. 별 찍기 － 1/별 찍기 － 1.py",
  ];

  it("제목으로 문제 번호를 찾아야 한다", () => {
    const index = buildProblemIndex(paths);
    expect(index.get(toIndexKey("programmers", "의상"))?.problemNo).toBe("42578");
    expect(index.get(toIndexKey("boj", "A＋B"))?.problemNo).toBe("1000");
  });

  it("커밋 메시지의 반각 제목으로도 조회돼야 한다", () => {
    const index = buildProblemIndex(paths);
    // 커밋 메시지에는 "A+B"(반각)로 오지만 경로는 "A＋B"(전각)다
    expect(index.get(toIndexKey("boj", "A+B"))?.problemNo).toBe("1000");
    expect(index.get(toIndexKey("boj", "별 찍기 - 1"))?.problemNo).toBe("2438");
  });

  it("플랫폼이 다르면 같은 제목이라도 구분돼야 한다", () => {
    const index = buildProblemIndex([
      "프로그래머스/2/1111. 같은 제목/같은 제목.js",
      "백준/Gold/2222. 같은 제목/같은 제목.py",
    ]);

    expect(index.get(toIndexKey("programmers", "같은 제목"))?.problemNo).toBe("1111");
    expect(index.get(toIndexKey("boj", "같은 제목"))?.problemNo).toBe("2222");
  });

  it("README가 아닌 풀이 파일에서 언어를 뽑아야 한다", () => {
    const index = buildProblemIndex(paths);
    expect(index.get(toIndexKey("programmers", "의상"))?.language).toBe("js");
    expect(index.get(toIndexKey("programmers", "폰켓몬"))?.language).toBe("py");
    expect(index.get(toIndexKey("boj", "A+B"))?.language).toBe("py");
  });

  it("BaekjoonHub 폴더가 아닌 경로는 무시해야 한다", () => {
    const index = buildProblemIndex([
      "programers/풀어보기/등굣길.py",
      "boj/풀어보기/1010.py",
      "README.md",
      ".claude/rules/team.md",
    ]);

    expect(index.size).toBe(0);
  });

  it("문제 폴더 형식이 아니면 무시해야 한다", () => {
    const index = buildProblemIndex(["프로그래머스/2/기타메모/note.md"]);
    expect(index.size).toBe(0);
  });
});

describe("buildProblemUrl", () => {
  it("프로그래머스 문제 링크를 만들어야 한다", () => {
    expect(buildProblemUrl("programmers", "42578")).toBe(
      "https://school.programmers.co.kr/learn/courses/30/lessons/42578",
    );
  });

  it("백준 문제 링크를 만들어야 한다", () => {
    expect(buildProblemUrl("boj", "1000")).toBe("https://www.acmicpc.net/problem/1000");
  });

  it("번호를 모르면 null이어야 한다", () => {
    expect(buildProblemUrl("programmers", null)).toBeNull();
  });
});

describe("buildSolveLogId", () => {
  it("같은 풀이는 같은 ID로 떨어져야 한다 (재동기화 중복 방지)", () => {
    const first = buildSolveLogId("uid1", "programmers", "42578", "의상", "2026-07-26");
    const second = buildSolveLogId("uid1", "programmers", "42578", "의상", "2026-07-26");

    expect(first).toBe(second);
    expect(first).toBe("uid1__programmers__42578__20260726");
  });

  it("날짜가 다르면 다른 ID여야 한다 (같은 문제 재풀이는 별도 기록)", () => {
    const day1 = buildSolveLogId("uid1", "programmers", "42578", "의상", "2026-07-26");
    const day2 = buildSolveLogId("uid1", "programmers", "42578", "의상", "2026-07-27");

    expect(day1).not.toBe(day2);
  });

  it("사용자가 다르면 다른 ID여야 한다", () => {
    const a = buildSolveLogId("uid1", "boj", "1000", "A+B", "2026-07-26");
    const b = buildSolveLogId("uid2", "boj", "1000", "A+B", "2026-07-26");

    expect(a).not.toBe(b);
  });

  it("번호를 못 찾으면 제목으로 결정적 ID를 만들어야 한다", () => {
    const first = buildSolveLogId("uid1", "boj", null, "이름 없는 문제", "2026-07-26");
    const second = buildSolveLogId("uid1", "boj", null, "이름 없는 문제", "2026-07-26");

    expect(first).toBe(second);
    expect(first).toContain("t-이름 없는 문제");
  });

  it("문서 ID에 슬래시가 남지 않아야 한다", () => {
    const id = buildSolveLogId("uid1", "boj", null, "A/B 나누기", "2026-07-26");
    expect(id).not.toContain("/");
  });
});
