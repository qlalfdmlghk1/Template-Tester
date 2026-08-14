import { describe, it, expect } from "vitest";
import {
  PostingExtractError,
  buildPostingPrompt,
  isEmptyResult,
  parsePostingResult,
} from "./posting.shared";

describe("buildPostingPrompt", () => {
  it("링크만 있으면 페이지를 가져오라고 지시해야 한다", () => {
    const prompt = buildPostingPrompt({ url: "https://example.com/job/1" });

    expect(prompt).toContain("https://example.com/job/1");
    expect(prompt).toContain("가져와");
  });

  it("붙여넣은 본문이 있으면 본문을 싣고 검색·가져오기를 막아야 한다", () => {
    const prompt = buildPostingPrompt({
      url: "https://example.com/job/1",
      pastedText: "[담당 업무] 프론트엔드 개발",
    });

    expect(prompt).toContain("[담당 업무] 프론트엔드 개발");
    expect(prompt).toContain("가져오지 마세요");
    // 붙여넣기가 정본이므로 링크를 다시 읽으러 가지 않게 URL 을 넣지 않는다
    expect(prompt).not.toContain("https://example.com/job/1");
  });

  it("기업명·공고명 단서를 앞에 붙여야 한다", () => {
    const prompt = buildPostingPrompt({
      url: "https://example.com/job/1",
      companyName: "삼성전자",
      postingTitle: "2026 상반기 신입",
    });

    expect(prompt).toContain("기업명: 삼성전자");
    expect(prompt).toContain("공고명: 2026 상반기 신입");
  });
});

describe("parsePostingResult", () => {
  it("코드펜스로 감싼 JSON 을 읽어야 한다", () => {
    const result = parsePostingResult(
      '```json\n{"jobDescription":"웹 개발","requirements":"경력 3년","preferredQualifications":"","sources":{}}\n```',
    );

    expect(result.jobDescription).toBe("웹 개발");
    expect(result.requirements).toBe("경력 3년");
  });

  it("JSON 앞뒤에 설명이 붙어도 본문을 찾아내야 한다", () => {
    const result = parsePostingResult(
      '정리했습니다.\n{"jobDescription":"웹 개발","sources":{}}\n확인해 주세요.',
    );

    expect(result.jobDescription).toBe("웹 개발");
  });

  it("출처를 URL 문자열로 줘도 표시용 객체로 바꿔야 한다", () => {
    const result = parsePostingResult(
      '{"jobDescription":"웹 개발","sources":{"jobDescription":["https://a.example.com/x"]}}',
    );

    expect(result.sources.jobDescription).toEqual([{ url: "https://a.example.com/x" }]);
  });

  it("출처의 빈 제목은 키째 걷어내야 한다", () => {
    // title: undefined 를 그대로 두면 Firestore 저장이 거부된다 —
    // stripUndefined 는 배열 안쪽 객체까지 훑지 않는다
    const result = parsePostingResult(
      '{"jobDescription":"웹 개발","sources":{"jobDescription":[{"url":"https://a.example.com/x","title":"  "}]}}',
    );

    const [source] = result.sources.jobDescription ?? [];
    expect(source).toEqual({ url: "https://a.example.com/x" });
    expect("title" in source).toBe(false);
  });

  it("url 이 없는 출처는 버려야 한다", () => {
    const result = parsePostingResult(
      '{"jobDescription":"웹 개발","sources":{"jobDescription":[{"title":"제목만"},""]}}',
    );

    expect(result.sources.jobDescription).toEqual([]);
  });

  it("문자열이 아닌 값을 주면 그 항목을 비워야 한다", () => {
    // 배열·숫자를 그대로 통과시키면 뒤에서 .trim() 이 TypeError 로 터진다
    const result = parsePostingResult(
      '{"jobDescription":["a","b"],"requirements":3,"preferredQualifications":"React","sources":{}}',
    );

    expect(result.jobDescription).toBeUndefined();
    expect(result.requirements).toBeUndefined();
    expect(result.preferredQualifications).toBe("React");
  });

  it("공백뿐인 값도 비워야 한다", () => {
    const result = parsePostingResult('{"jobDescription":"   ","sources":{}}');

    expect(result.jobDescription).toBeUndefined();
  });

  it("JSON 이 아니면 parse 종류의 에러를 던져야 한다", () => {
    expect(() => parsePostingResult("공고를 찾을 수 없습니다")).toThrowError(
      PostingExtractError,
    );

    try {
      parsePostingResult("공고를 찾을 수 없습니다");
    } catch (cause) {
      expect((cause as PostingExtractError).kind).toBe("parse");
    }
  });
});

describe("isEmptyResult", () => {
  it("모든 항목이 비었으면 true 여야 한다", () => {
    expect(
      isEmptyResult({
        jobDescription: "",
        requirements: "   ",
        preferredQualifications: undefined,
        sources: {},
      }),
    ).toBe(true);
  });

  it("한 항목이라도 차 있으면 false 여야 한다", () => {
    expect(
      isEmptyResult({ jobDescription: "", requirements: "경력 3년", sources: {} }),
    ).toBe(false);
  });
});
