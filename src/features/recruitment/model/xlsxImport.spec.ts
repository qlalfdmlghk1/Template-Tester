import { describe, it, expect } from "vitest";
import { cellDate, cellText } from "./xlsxImport";

describe("cellText", () => {
  it("일반 문자열·숫자를 읽는다", () => {
    expect(cellText("코스콤")).toBe("코스콤");
    expect(cellText("  여백  ")).toBe("여백");
    expect(cellText(15)).toBe("15");
  });

  it("하이퍼링크 셀에서 표시 문자열을 뽑는다", () => {
    expect(
      cellText({ text: "코스콤", hyperlink: "https://koscom.applyin.co.kr/jobs/20925" }),
    ).toBe("코스콤");
  });

  it("서식 있는 문자열(richText)을 이어 붙인다", () => {
    expect(
      cellText({
        richText: [{ text: "신한은행 " }, { text: "(디지털)" }],
      }),
    ).toBe("신한은행 (디지털)");
  });

  it("하이퍼링크 안의 text 가 richText 여도 읽는다 — 한 겹만 벗기면 [object Object] 가 된다", () => {
    expect(
      cellText({
        text: { richText: [{ text: "한국투자증권 " }, { text: "IT" }] },
        hyperlink: "https://example.com",
      }),
    ).toBe("한국투자증권 IT");
  });

  it("링크가 걸린 날짜 셀은 표시 문자열이 없다 (날짜로 따로 읽는다)", () => {
    expect(cellText({ text: new Date(2025, 4, 8), hyperlink: "https://example.com" })).toBe("");
  });

  it("수식 셀은 결과값을 쓴다", () => {
    expect(cellText({ formula: "A1", result: "코스콤" })).toBe("코스콤");
  });

  it("빈 값은 빈 문자열이다", () => {
    expect(cellText(null)).toBe("");
    expect(cellText(undefined)).toBe("");
  });
});

describe("cellDate", () => {
  it("날짜 셀을 읽는다", () => {
    const date = new Date(2026, 2, 11, 17, 0);
    expect(cellDate(date)).toEqual(date);
  });

  it("수식 결과가 날짜면 읽는다", () => {
    const date = new Date(2026, 2, 11);
    expect(cellDate({ formula: "A1", result: date })).toEqual(date);
  });

  it("링크가 걸린 날짜 셀도 읽는다", () => {
    const date = new Date(2025, 4, 8, 23, 59);
    expect(cellDate({ text: date, hyperlink: "https://example.com" })).toEqual(date);
  });

  it("날짜가 아니면 null", () => {
    expect(cellDate("04/03 ~ 04/11")).toBeNull();
    expect(cellDate({ text: "코스콤", hyperlink: "https://example.com" })).toBeNull();
    expect(cellDate(null)).toBeNull();
  });
});
