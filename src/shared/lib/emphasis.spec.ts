import { describe, it, expect } from "vitest";
import { parseEmphasis } from "./emphasis";

describe("parseEmphasis", () => {
  it("표기가 없으면 평문 한 조각으로 돌려준다", () => {
    expect(parseEmphasis("성장하는 사람")).toEqual([
      { text: "성장하는 사람", emphasized: false },
    ]);
  });

  it("빈 문자열은 조각이 없다", () => {
    expect(parseEmphasis("")).toEqual([]);
  });

  it("강조 구간을 앞뒤 평문과 나눠 담는다", () => {
    expect(parseEmphasis("우리는 **도전**을 중시합니다")).toEqual([
      { text: "우리는 ", emphasized: false },
      { text: "도전", emphasized: true },
      { text: "을 중시합니다", emphasized: false },
    ]);
  });

  it("강조가 여러 개면 순서대로 담는다", () => {
    expect(parseEmphasis("**협업**과 **자율성**")).toEqual([
      { text: "협업", emphasized: true },
      { text: "과 ", emphasized: false },
      { text: "자율성", emphasized: true },
    ]);
  });

  it("문자열 맨 앞과 맨 끝의 강조도 잡는다", () => {
    expect(parseEmphasis("**시작**과 끝 **강조**")).toEqual([
      { text: "시작", emphasized: true },
      { text: "과 끝 ", emphasized: false },
      { text: "강조", emphasized: true },
    ]);
  });

  it("짝이 맞지 않는 별표는 글자 그대로 남긴다 — 뒷부분이 통째로 강조되지 않는다", () => {
    expect(parseEmphasis("**닫히지 않은 강조")).toEqual([
      { text: "**닫히지 않은 강조", emphasized: false },
    ]);
  });

  it("빈 강조(****)는 강조로 보지 않는다", () => {
    expect(parseEmphasis("앞****뒤")).toEqual([{ text: "앞****뒤", emphasized: false }]);
  });

  it("줄바꿈을 사이에 둔 강조도 하나로 잡는다", () => {
    expect(parseEmphasis("**두 줄에\n걸친 문구**")).toEqual([
      { text: "두 줄에\n걸친 문구", emphasized: true },
    ]);
  });

  it("여러 번 호출해도 결과가 같다 — 전역 정규식 상태가 남지 않는다", () => {
    const text = "**협업**과 **자율성**";
    expect(parseEmphasis(text)).toEqual(parseEmphasis(text));
  });
});
