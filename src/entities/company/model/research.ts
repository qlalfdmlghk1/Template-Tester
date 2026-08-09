/**
 * 기업 조사 완성도 계산.
 *
 * `hasResearch()`(조사 완료 여부)와는 보는 각도가 다르다 — 그쪽은 "하나라도 채웠나"를 보는
 * 이진 판정이고, 여기는 "얼마나 채웠나"를 본다. 대상 항목은 양쪽이 같아야 한다.
 * 어긋나면 카드에서 진행바는 3/7 인데 "조사 내용 없음"이 함께 뜨는 모순이 생긴다.
 */

import type { Company } from "./company.type";

/**
 * 채움률의 분모가 되는 조사 항목.
 * 기업명·분류·공고 링크 같은 기본 정보는 "조사"가 아니므로 제외한다.
 */
export const RESEARCH_PROGRESS_FIELDS = [
  "targetJob",
  "jobDescription",
  "requirements",
  "researchNote",
  "talentProfile",
  "businessSummary",
  "recentIssues",
] as const;

export type ResearchProgressField = (typeof RESEARCH_PROGRESS_FIELDS)[number];

export interface ResearchProgress {
  /** 채워진 항목 수 */
  filled: number;
  /** 전체 항목 수 */
  total: number;
  /** 0~100 정수 백분율 */
  percent: number;
  /** 아직 비어 있는 항목 */
  emptyFields: ResearchProgressField[];
}

/** 공백만 있는 값은 채우지 않은 것으로 본다 */
function isFilled(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

export function computeResearchProgress(company: Company): ResearchProgress {
  const emptyFields = RESEARCH_PROGRESS_FIELDS.filter(
    (field) => !isFilled(company[field]),
  );

  const total = RESEARCH_PROGRESS_FIELDS.length;
  const filled = total - emptyFields.length;

  return {
    filled,
    total,
    // 소수점을 남기면 "14.28%" 같은 값이 그대로 노출된다
    percent: Math.round((filled / total) * 100),
    emptyFields,
  };
}
