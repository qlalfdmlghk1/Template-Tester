import { describe, it, expect } from "vitest";
import { parsePostingSchedules } from "./postingSchedule";

const YEAR = 2026;

describe("parsePostingSchedules — 연도 채우기", () => {
  it("연도가 없으면 기준 연도로 채우고 추정으로 표시해야 한다", () => {
    const [draft] = parsePostingSchedules(
      { resume: { kind: "exact", at: "03-11T17:00" } },
      YEAR,
    );

    expect(draft.schedule).toEqual({
      kind: "exact",
      at: "2026-03-11T17:00",
      hasTime: true,
    });
    expect(draft.yearInferred).toBe(true);
  });

  it("연도가 적혀 있으면 그대로 쓰고 추정으로 표시하지 않아야 한다", () => {
    const [draft] = parsePostingSchedules(
      { resume: { kind: "exact", at: "2025-03-11" } },
      YEAR,
    );

    expect(draft.schedule).toEqual({
      kind: "exact",
      at: "2025-03-11",
      hasTime: false,
    });
    expect(draft.yearInferred).toBe(false);
  });

  it("연말을 넘기는 기간은 종료 연도를 한 해 뒤로 밀어야 한다", () => {
    const [draft] = parsePostingSchedules(
      { resume: { kind: "range", start: "12-28", end: "01-05" } },
      YEAR,
    );

    expect(draft.schedule).toMatchObject({
      kind: "range",
      start: "2026-12-28",
      end: "2027-01-05",
    });
  });

  it("러프 표기의 연도도 채워야 한다", () => {
    const [draft] = parsePostingSchedules(
      { codingTest: { kind: "rough", month: 4, part: "early" } },
      YEAR,
    );

    expect(draft.schedule).toEqual({
      kind: "rough",
      year: 2026,
      month: 4,
      part: "early",
    });
    expect(draft.yearInferred).toBe(true);
  });
});

describe("parsePostingSchedules — 검증", () => {
  it("알 수 없는 단계 키는 버려야 한다", () => {
    expect(
      parsePostingSchedules({ 자소서: { kind: "exact", at: "03-11" } }, YEAR),
    ).toEqual([]);
  });

  it("알 수 없는 kind 는 버려야 한다", () => {
    expect(
      parsePostingSchedules({ resume: { kind: "deadline", at: "03-11" } }, YEAR),
    ).toEqual([]);
  });

  it("실제로 없는 날짜는 버려야 한다", () => {
    expect(
      parsePostingSchedules({ resume: { kind: "exact", at: "02-30" } }, YEAR),
    ).toEqual([]);
  });

  it("범위를 벗어난 월·시각은 버려야 한다", () => {
    expect(
      parsePostingSchedules({ resume: { kind: "exact", at: "13-01" } }, YEAR),
    ).toEqual([]);
    expect(
      parsePostingSchedules({ resume: { kind: "exact", at: "03-11T25:00" } }, YEAR),
    ).toEqual([]);
  });

  it("종료일이 시작일보다 빠르면 버려야 한다", () => {
    // 연도가 적혀 있으면 연말을 넘긴 것으로 보지 않는다
    expect(
      parsePostingSchedules(
        { resume: { kind: "range", start: "2026-05-10", end: "2026-05-01" } },
        YEAR,
      ),
    ).toEqual([]);
  });

  it("러프 표기의 잘못된 part 는 버려야 한다", () => {
    expect(
      parsePostingSchedules(
        { resume: { kind: "rough", month: 4, part: "beginning" } },
        YEAR,
      ),
    ).toEqual([]);
  });

  it("일정 묶음이 객체가 아니면 빈 배열을 줘야 한다", () => {
    expect(parsePostingSchedules(undefined, YEAR)).toEqual([]);
    expect(parsePostingSchedules("없음", YEAR)).toEqual([]);
    expect(parsePostingSchedules([{ kind: "exact" }], YEAR)).toEqual([]);
  });

  it("잘못된 항목만 버리고 나머지는 살려야 한다", () => {
    const drafts = parsePostingSchedules(
      {
        resume: { kind: "range", start: "03-04", end: "03-11T17:00" },
        codingTest: { kind: "exact", at: "없음" },
      },
      YEAR,
    );

    expect(drafts).toHaveLength(1);
    expect(drafts[0].stage).toBe("resume");
  });

  it("전형 순서대로 정렬해야 한다", () => {
    const drafts = parsePostingSchedules(
      {
        interview1: { kind: "exact", at: "05-02" },
        resume: { kind: "exact", at: "03-11" },
        codingTest: { kind: "exact", at: "04-02" },
      },
      YEAR,
    );

    expect(drafts.map((draft) => draft.stage)).toEqual([
      "resume",
      "codingTest",
      "interview1",
    ]);
  });
});
