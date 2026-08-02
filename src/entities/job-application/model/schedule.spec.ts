import { describe, it, expect } from "vitest";
import {
  compareSchedules,
  formatSchedule,
  getScheduleAnchor,
  getScheduleDeadline,
} from "./schedule";
import type { Schedule } from "./schedule";

describe("getScheduleAnchor", () => {
  it("정확한 일시는 그 시점을 그대로 돌려준다", () => {
    const schedule: Schedule = { kind: "exact", at: "2026-03-11T17:00", hasTime: true };
    expect(getScheduleAnchor(schedule)).toEqual(new Date(2026, 2, 11, 17, 0));
  });

  it("기간은 시작일을 대표 시점으로 삼는다", () => {
    const schedule: Schedule = {
      kind: "range",
      start: "2026-04-03",
      end: "2026-04-11",
      hasTime: false,
    };
    expect(getScheduleAnchor(schedule)).toEqual(new Date(2026, 3, 3));
  });

  it("러프 표기는 월 내 대표 일자로 환산한다", () => {
    expect(getScheduleAnchor({ kind: "rough", year: 2026, month: 5, part: "early" })).toEqual(
      new Date(2026, 4, 5),
    );
    expect(getScheduleAnchor({ kind: "rough", year: 2026, month: 7, part: "mid" })).toEqual(
      new Date(2026, 6, 15),
    );
    expect(getScheduleAnchor({ kind: "rough", year: 2026, month: 7, part: "late" })).toEqual(
      new Date(2026, 6, 25),
    );
    expect(getScheduleAnchor({ kind: "rough", year: 2026, month: 4, part: "whole" })).toEqual(
      new Date(2026, 3, 15),
    );
  });

  it("일정이 없으면 null", () => {
    expect(getScheduleAnchor(null)).toBeNull();
  });
});

describe("getScheduleDeadline", () => {
  it("기간은 종료일을 마감으로 본다", () => {
    const schedule: Schedule = {
      kind: "range",
      start: "2026-04-03",
      end: "2026-04-11",
      hasTime: false,
    };
    expect(getScheduleDeadline(schedule)).toEqual(new Date(2026, 3, 11));
  });

  it("정확한 일시는 대표 시점과 마감이 같다", () => {
    const schedule: Schedule = { kind: "exact", at: "2026-03-11T17:00", hasTime: true };
    expect(getScheduleDeadline(schedule)).toEqual(getScheduleAnchor(schedule));
  });
});

describe("formatSchedule", () => {
  it("시간이 있는 정확한 일시는 시각까지 표시한다", () => {
    expect(formatSchedule({ kind: "exact", at: "2026-03-11T17:00", hasTime: true })).toBe(
      "03/11 17:00",
    );
  });

  it("시간이 없으면 날짜만 표시한다", () => {
    expect(formatSchedule({ kind: "exact", at: "2026-04-04", hasTime: false })).toBe("04/04");
  });

  it("기간은 물결로 잇는다", () => {
    expect(
      formatSchedule({ kind: "range", start: "2026-04-03", end: "2026-04-11", hasTime: false }),
    ).toBe("04/03 ~ 04/11");
  });

  it("러프 표기는 월과 위치로 표시한다", () => {
    expect(formatSchedule({ kind: "rough", year: 2026, month: 4, part: "whole" })).toBe("4월 중");
    expect(formatSchedule({ kind: "rough", year: 2026, month: 5, part: "early" })).toBe("5월 초");
    expect(formatSchedule({ kind: "rough", year: 2026, month: 7, part: "late" })).toBe("7월 말");
  });

  it("일정이 없으면 빈 문자열", () => {
    expect(formatSchedule(null)).toBe("");
  });
});

describe("compareSchedules", () => {
  it("대표 시점이 빠른 쪽이 앞에 온다", () => {
    const earlier: Schedule = { kind: "exact", at: "2026-03-11", hasTime: false };
    const later: Schedule = { kind: "rough", year: 2026, month: 4, part: "whole" };
    expect(compareSchedules(earlier, later)).toBeLessThan(0);
  });

  it("일정이 없는 쪽을 뒤로 보낸다", () => {
    const schedule: Schedule = { kind: "exact", at: "2026-03-11", hasTime: false };
    expect(compareSchedules(null, schedule)).toBeGreaterThan(0);
    expect(compareSchedules(schedule, null)).toBeLessThan(0);
    expect(compareSchedules(null, null)).toBe(0);
  });
});
