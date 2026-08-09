import { describe, it, expect } from "vitest";
import { computeResearchProgress, RESEARCH_PROGRESS_FIELDS } from "./research";
import { hasResearch } from "./company.type";
import type { Company } from "./company.type";

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: "c1",
    userId: "u1",
    name: "테스트기업",
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("computeResearchProgress", () => {
  it("아무것도 채우지 않으면 0%여야 한다", () => {
    const result = computeResearchProgress(makeCompany());

    expect(result.filled).toBe(0);
    expect(result.total).toBe(7);
    expect(result.percent).toBe(0);
    expect(result.emptyFields).toEqual([...RESEARCH_PROGRESS_FIELDS]);
  });

  it("모든 조사 항목을 채우면 100%여야 한다", () => {
    const result = computeResearchProgress(
      makeCompany({
        targetJob: "프론트엔드 개발자",
        jobDescription: "웹 서비스 개발",
        requirements: "React 경험",
        researchNote: "메모",
        talentProfile: "도전하는 인재",
        businessSummary: "반도체",
        recentIssues: "신규 공장 착공",
      }),
    );

    expect(result.filled).toBe(7);
    expect(result.percent).toBe(100);
    expect(result.emptyFields).toEqual([]);
  });

  it("공백만 있는 값은 채우지 않은 것으로 봐야 한다", () => {
    const result = computeResearchProgress(
      makeCompany({ targetJob: "   ", talentProfile: "\n\t" }),
    );

    expect(result.filled).toBe(0);
    expect(result.emptyFields).toContain("targetJob");
    expect(result.emptyFields).toContain("talentProfile");
  });

  it("백분율은 정수로 반올림해야 한다", () => {
    // 7개 중 1개 = 14.28...% → 14
    const result = computeResearchProgress(makeCompany({ targetJob: "개발자" }));

    expect(result.filled).toBe(1);
    expect(result.percent).toBe(14);
  });

  it("기본 정보(기업명·분류·공고 링크)는 분모에 넣지 않는다", () => {
    const result = computeResearchProgress(
      makeCompany({
        name: "삼성전자",
        categories: ["LARGE"],
        postingUrl: "https://example.com",
        location: "수원",
      }),
    );

    expect(result.filled).toBe(0);
    expect(result.percent).toBe(0);
  });
});

describe("hasResearch — 채움률과 같은 항목을 봐야 한다", () => {
  it("AI 조사 항목만 채워져 있어도 true여야 한다", () => {
    // 어긋나면 카드에서 진행바는 3/7 인데 "조사 내용 없음"이 함께 뜨고,
    // "조사 완료만" 필터에서도 사라진다
    const company = makeCompany({
      talentProfile: "도전하는 인재",
      businessSummary: "반도체",
      recentIssues: "신규 공장 착공",
    });

    expect(hasResearch(company)).toBe(true);
    expect(computeResearchProgress(company).filled).toBe(3);
  });

  it("기존 필드가 하나라도 채워져 있으면 true여야 한다", () => {
    expect(hasResearch(makeCompany({ targetJob: "개발자" }))).toBe(true);
  });

  it("아무것도 채워져 있지 않으면 false여야 한다", () => {
    expect(hasResearch(makeCompany({}))).toBe(false);
  });

  it("공백만 채워져 있으면 false여야 한다", () => {
    expect(hasResearch(makeCompany({ talentProfile: "   " }))).toBe(false);
  });
});
