import { describe, it, expect } from "vitest";
import {
  toKstDateKey,
  addDaysToDateKey,
  toDateKey,
  parseDateKey,
  getMonthMatrix,
  getPreviousMonth,
  getNextMonth,
  calculateStreak,
} from "./date";

describe("toKstDateKey", () => {
  it("UTC 오후 시각을 KST 다음 날로 변환해야 한다", () => {
    // 2026-07-25T16:27:50Z = KST 2026-07-26 01:27 (실제 BaekjoonHub 커밋 시각)
    expect(toKstDateKey("2026-07-25T16:27:50Z")).toBe("2026-07-26");
  });

  it("KST 자정 직전(UTC 14:59:59)은 같은 날로 남아야 한다", () => {
    expect(toKstDateKey("2026-07-25T14:59:59Z")).toBe("2026-07-25");
  });

  it("KST 자정 정각(UTC 15:00:00)에 날짜가 넘어가야 한다", () => {
    expect(toKstDateKey("2026-07-25T15:00:00Z")).toBe("2026-07-26");
  });

  it("UTC 자정은 KST 같은 날 오전 9시이므로 날짜가 유지돼야 한다", () => {
    expect(toKstDateKey("2026-07-25T00:00:00Z")).toBe("2026-07-25");
  });

  it("연말 경계를 넘겨야 한다", () => {
    expect(toKstDateKey("2025-12-31T15:00:00Z")).toBe("2026-01-01");
  });

  it("Date 객체도 받아야 한다", () => {
    expect(toKstDateKey(new Date("2026-07-25T16:27:50Z"))).toBe("2026-07-26");
  });
});

describe("addDaysToDateKey", () => {
  it("다음 날을 계산해야 한다", () => {
    expect(addDaysToDateKey("2026-07-25", 1)).toBe("2026-07-26");
  });

  it("이전 날을 계산해야 한다", () => {
    expect(addDaysToDateKey("2026-07-01", -1)).toBe("2026-06-30");
  });

  it("월말 경계를 넘겨야 한다", () => {
    expect(addDaysToDateKey("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("윤년 2월 29일을 계산해야 한다", () => {
    expect(addDaysToDateKey("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("평년 2월은 28일에서 3월로 넘어가야 한다", () => {
    expect(addDaysToDateKey("2026-02-28", 1)).toBe("2026-03-01");
  });
});

describe("toDateKey / parseDateKey", () => {
  it("한 자리 월·일을 0으로 채워야 한다", () => {
    expect(toDateKey(2026, 1, 5)).toBe("2026-01-05");
  });

  it("파싱 결과가 원본과 왕복해야 한다", () => {
    expect(parseDateKey("2026-07-26")).toEqual({ year: 2026, month: 7, day: 26 });
  });
});

describe("getMonthMatrix", () => {
  it("항상 6주 × 7일이어야 한다", () => {
    const matrix = getMonthMatrix(2026, 7);
    expect(matrix).toHaveLength(6);
    matrix.forEach((week) => expect(week).toHaveLength(7));
  });

  it("첫 칸은 1일이 속한 주의 일요일이어야 한다", () => {
    // 2026-07-01은 수요일 → 그 주 일요일은 6월 28일
    const matrix = getMonthMatrix(2026, 7);
    expect(matrix[0][0].dateKey).toBe("2026-06-28");
    expect(matrix[0][0].isCurrentMonth).toBe(false);
  });

  it("이번 달 날짜에만 isCurrentMonth가 true여야 한다", () => {
    const matrix = getMonthMatrix(2026, 7);
    const currentMonthDays = matrix.flat().filter((cell) => cell.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(31);
    expect(currentMonthDays[0].dateKey).toBe("2026-07-01");
    expect(currentMonthDays[30].dateKey).toBe("2026-07-31");
  });

  it("1일이 일요일인 달은 앞 칸 채움이 없어야 한다", () => {
    // 2026-02-01은 일요일
    const matrix = getMonthMatrix(2026, 2);
    expect(matrix[0][0].dateKey).toBe("2026-02-01");
    expect(matrix[0][0].isCurrentMonth).toBe(true);
  });

  it("윤년 2월은 29일까지 있어야 한다", () => {
    const matrix = getMonthMatrix(2028, 2);
    const days = matrix.flat().filter((cell) => cell.isCurrentMonth);
    expect(days).toHaveLength(29);
  });

  it("연말 달은 다음 해 1월로 채워져야 한다", () => {
    const matrix = getMonthMatrix(2026, 12);
    const lastCell = matrix[5][6];
    expect(lastCell.isCurrentMonth).toBe(false);
    expect(lastCell.dateKey.startsWith("2027-01")).toBe(true);
  });

  it("weekday가 0(일)부터 6(토)까지 순서대로 매겨져야 한다", () => {
    const matrix = getMonthMatrix(2026, 7);
    expect(matrix[0].map((cell) => cell.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe("getPreviousMonth / getNextMonth", () => {
  it("1월의 이전 달은 전년 12월이어야 한다", () => {
    expect(getPreviousMonth(2026, 1)).toEqual({ year: 2025, month: 12 });
  });

  it("12월의 다음 달은 다음 해 1월이어야 한다", () => {
    expect(getNextMonth(2026, 12)).toEqual({ year: 2027, month: 1 });
  });

  it("연중에는 연도가 유지돼야 한다", () => {
    expect(getPreviousMonth(2026, 7)).toEqual({ year: 2026, month: 6 });
    expect(getNextMonth(2026, 7)).toEqual({ year: 2026, month: 8 });
  });
});

describe("calculateStreak", () => {
  it("기록이 없으면 0이어야 한다", () => {
    expect(calculateStreak([], "2026-07-26")).toBe(0);
  });

  it("오늘부터 연속된 날을 세야 한다", () => {
    const keys = ["2026-07-26", "2026-07-25", "2026-07-24"];
    expect(calculateStreak(keys, "2026-07-26")).toBe(3);
  });

  it("오늘 기록이 없어도 어제까지 이어졌으면 그 연속을 유지해야 한다", () => {
    const keys = ["2026-07-25", "2026-07-24"];
    expect(calculateStreak(keys, "2026-07-26")).toBe(2);
  });

  it("그저께까지만 있으면 연속이 끊긴 것으로 봐야 한다", () => {
    const keys = ["2026-07-24", "2026-07-23"];
    expect(calculateStreak(keys, "2026-07-26")).toBe(0);
  });

  it("중간에 빈 날이 있으면 거기서 멈춰야 한다", () => {
    const keys = ["2026-07-26", "2026-07-25", "2026-07-23", "2026-07-22"];
    expect(calculateStreak(keys, "2026-07-26")).toBe(2);
  });

  it("같은 날 기록이 여러 개여도 하루로 세야 한다", () => {
    const keys = ["2026-07-26", "2026-07-26", "2026-07-25"];
    expect(calculateStreak(keys, "2026-07-26")).toBe(2);
  });

  it("월 경계를 넘어 이어져야 한다", () => {
    const keys = ["2026-07-01", "2026-06-30", "2026-06-29"];
    expect(calculateStreak(keys, "2026-07-01")).toBe(3);
  });
});
