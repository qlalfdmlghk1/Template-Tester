import { describe, it, expect } from "vitest";
import { formatSalary, parseSalary } from "./salary";

describe("parseSalary", () => {
  it("숫자 문자열을 만원 단위 정수로 바꿔야 한다", () => {
    expect(parseSalary("4000")).toBe(4000);
  });

  it("쉼표를 섞어 적어도 받아야 한다", () => {
    expect(parseSalary("4,000")).toBe(4000);
  });

  it("비워 두면 미정이어야 한다", () => {
    expect(parseSalary("")).toBeUndefined();
    expect(parseSalary("   ")).toBeUndefined();
  });

  it("숫자가 없는 문구는 미정으로 둬야 한다", () => {
    // "회사 내규에 따름" 같은 문구는 값이 아니라 미정 상태다
    expect(parseSalary("회사 내규에 따름")).toBeUndefined();
  });

  it("0은 미정과 구분되지 않으므로 값으로 받지 않아야 한다", () => {
    expect(parseSalary("0")).toBeUndefined();
  });
});

describe("formatSalary", () => {
  it("천 단위로 끊어 만원을 붙여야 한다", () => {
    expect(formatSalary(4000)).toBe("4,000만원");
  });

  it("미정이면 표기할 것이 없어야 한다", () => {
    expect(formatSalary(undefined)).toBeUndefined();
  });
});
