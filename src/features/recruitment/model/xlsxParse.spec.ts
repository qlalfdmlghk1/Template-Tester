import { describe, it, expect } from "vitest";
import {
  buildColumnMap,
  excelSerialToDate,
  mapFillToStatus,
  parseHeadcount,
  parseJobTag,
  parseScheduleText,
} from "./xlsxParse";

describe("mapFillToStatus", () => {
  it("시트 색상을 전형 상태로 옮긴다", () => {
    expect(mapFillToStatus("FFD9EAD3")).toBe("PASSED");
    expect(mapFillToStatus("FFC9DAF8")).toBe("SUBMITTED");
    expect(mapFillToStatus("FFF4CCCC")).toBe("FAILED");
    expect(mapFillToStatus("FFF3F3F3")).toBe("NOT_APPLICABLE");
  });

  it("주황 두 톤은 모두 불참·포기다", () => {
    expect(mapFillToStatus("FFF9CB9C")).toBe("SKIPPED");
    expect(mapFillToStatus("FFFCE5CD")).toBe("SKIPPED");
  });

  it("색이 없거나 흰색·진회색이면 진행 전이다", () => {
    expect(mapFillToStatus(null)).toBe("PENDING");
    expect(mapFillToStatus("FFFFFFFF")).toBe("PENDING");
    // 진회색은 기업명 열 스타일로만 쓰였고 전형 상태와 무관하다
    expect(mapFillToStatus("FFD9D9D9")).toBe("PENDING");
  });
});

describe("buildColumnMap", () => {
  it("2026_상반기 시트 헤더를 읽는다 — 기업명이 앞", () => {
    const { stages, meta } = buildColumnMap([
      "기업명",
      "직무",
      "인원",
      "자소서",
      "AI 역량검사",
      "인성검사",
      "직무/적성",
      "필기",
      "코딩 테스트",
      "1차 면접",
      "2차 면접",
      "최종발표",
      "출근",
      "위치",
      "미지원 사유",
    ]);

    expect(meta.get(0)).toBe("companyName");
    expect(meta.get(1)).toBe("jobTag");
    expect(stages.get(3)).toBe("resume");
    expect(stages.get(12)).toBe("onboarding");
    expect(meta.get(14)).toBe("notAppliedReason");
  });

  it("상반기 시트 헤더를 읽는다 — 직무가 앞이고 인원 컬럼이 없다", () => {
    const { stages, meta } = buildColumnMap([
      "직무",
      "기업명",
      "자소서",
      "AI 역량검사",
      "인성검사",
    ]);

    expect(meta.get(0)).toBe("jobTag");
    expect(meta.get(1)).toBe("companyName");
    expect(stages.get(2)).toBe("resume");
  });

  it("모르는 헤더(분류 등)는 건너뛴다", () => {
    const { stages, meta } = buildColumnMap(["직무", "기업명", "분류", "인원", "자소서"]);

    expect(meta.has(2)).toBe(false);
    expect(meta.get(3)).toBe("headcount");
    expect(stages.get(4)).toBe("resume");
  });
});

describe("excelSerialToDate", () => {
  it("시트의 자소서 마감 serial 을 날짜로 되돌린다", () => {
    // 46092.708333 = 2026-03-11 17:00 (스크린샷의 코스콤 자소서)
    const date = excelSerialToDate(46092.708333333336);

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(11);
    expect(date.getHours()).toBe(17);
  });
});

describe("parseScheduleText", () => {
  it("기간 표기를 읽는다", () => {
    const { schedule } = parseScheduleText("04/03 ~ 04/11", 2026);

    expect(schedule).toEqual({
      kind: "range",
      start: "2026-04-03",
      end: "2026-04-11",
      hasTime: false,
    });
  });

  it("하이픈으로 이은 기간과 종료 시각을 읽는다", () => {
    const { schedule } = parseScheduleText("04/03 - 04/06 18시", 2026);

    expect(schedule).toEqual({
      kind: "range",
      start: "2026-04-03",
      end: "2026-04-06T18:00",
      hasTime: true,
    });
  });

  it("해를 넘기는 기간은 종료 연도를 올린다", () => {
    const { schedule } = parseScheduleText("12/28 ~ 01/03", 2026);

    expect(schedule).toMatchObject({ start: "2026-12-28", end: "2027-01-03" });
  });

  it("요일이 붙은 날짜를 읽고 원문을 메모로 남긴다", () => {
    const { schedule, memo } = parseScheduleText("04/04 (토)", 2026);

    expect(schedule).toEqual({ kind: "exact", at: "2026-04-04", hasTime: false });
    expect(memo).toBe("04/04 (토)");
  });

  it("시각이 범위로 적힌 경우 시작 시각만 취하고 원문을 메모로 남긴다", () => {
    const { schedule, memo } = parseScheduleText("04/11 13:40-16시", 2026);

    expect(schedule).toEqual({ kind: "exact", at: "2026-04-11T13:40", hasTime: true });
    expect(memo).toBe("04/11 13:40-16시");
  });

  it("러프 표기를 읽는다", () => {
    expect(parseScheduleText("4월 중", 2026).schedule).toEqual({
      kind: "rough",
      year: 2026,
      month: 4,
      part: "whole",
    });
    expect(parseScheduleText("5월 초", 2026).schedule).toMatchObject({ part: "early" });
    expect(parseScheduleText("4월 말", 2026).schedule).toMatchObject({ part: "late" });
  });

  it("공백 없는 러프 표기도 읽는다", () => {
    expect(parseScheduleText("8월초", 2026).schedule).toMatchObject({
      month: 8,
      part: "early",
    });
  });

  it("러프 범위는 시작 쪽을 대표로 삼고 원문을 메모로 남긴다", () => {
    const { schedule, memo } = parseScheduleText("7월 중순 ~  말", 2026);

    expect(schedule).toMatchObject({ month: 7, part: "mid" });
    expect(memo).toBe("7월 중순 ~ 말");
  });

  it("부가 설명이 붙은 러프 표기는 원문을 메모로 남긴다", () => {
    const { schedule, memo } = parseScheduleText("4월 중 (1박 2일)", 2026);

    expect(schedule).toMatchObject({ month: 4, part: "whole" });
    expect(memo).toBe("4월 중 (1박 2일)");
  });

  it("표기가 원문과 정확히 같으면 메모를 남기지 않는다", () => {
    expect(parseScheduleText("4월 중", 2026).memo).toBeUndefined();
    expect(parseScheduleText("04/03 ~ 04/11", 2026).memo).toBeUndefined();
  });

  it("존재하지 않는 월·일은 날짜로 읽지 않고 원문을 메모로 남긴다", () => {
    // 검증이 없으면 13/45 가 이듬해 날짜로 조용히 굴러가 반기 귀속까지 틀어진다
    expect(parseScheduleText("13/45", 2026)).toEqual({ schedule: null, memo: "13/45" });
    expect(parseScheduleText("00/10", 2026)).toEqual({ schedule: null, memo: "00/10" });
    expect(parseScheduleText("04/32", 2026)).toEqual({ schedule: null, memo: "04/32" });
  });

  it("읽을 수 없는 표기는 값을 잃지 않게 원문을 메모로 남긴다", () => {
    const { schedule, memo } = parseScheduleText("추후 공지", 2026);

    expect(schedule).toBeNull();
    expect(memo).toBe("추후 공지");
  });

  it("빈 문자열은 일정 없음이다", () => {
    expect(parseScheduleText("   ", 2026)).toEqual({ schedule: null });
  });
});

describe("parseJobTag", () => {
  it("정해진 태그만 받는다", () => {
    expect(parseJobTag("FE")).toBe("FE");
    expect(parseJobTag(" it ")).toBe("IT");
    expect(parseJobTag("디자인")).toBeNull();
    expect(parseJobTag("")).toBeNull();
    expect(parseJobTag(null)).toBeNull();
  });

  it("한글 태그도 읽는다 — 대문자 변환에 걸리지 않아야 한다", () => {
    expect(parseJobTag("기획")).toBe("기획");
    expect(parseJobTag(" 기획 ")).toBe("기획");
  });

  it("하반기 시트에 있던 DT 를 읽는다", () => {
    expect(parseJobTag("DT")).toBe("DT");
    expect(parseJobTag("dt")).toBe("DT");
  });
});

describe("parseHeadcount", () => {
  it("숫자를 뽑는다", () => {
    expect(parseHeadcount("15명")).toBe(15);
    expect(parseHeadcount(15)).toBe(15);
  });

  it("공고에 인원이 없는 '00명'과 빈 값은 미정이다", () => {
    expect(parseHeadcount("00명")).toBeNull();
    expect(parseHeadcount("")).toBeNull();
    expect(parseHeadcount(null)).toBeNull();
  });
});
