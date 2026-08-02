/** 기업 — 지원 건과 분리해 보관한다. 같은 기업에 여러 번 지원해도 기업 정보·조사 노트는 하나만 유지된다. */
export interface Company {
  id: string;
  userId: string;
  /** 기업명 */
  name: string;
  /** 채용 공고 링크 */
  postingUrl?: string;
  /** 근무 위치 */
  location?: string;

  // ── 비채용기간용 사전 조사 ────────────────────────────────
  // 기존 시트의 "채용 정보" 탭(기업명·직무·직무 설명·자격 요건)에 대응한다.

  /** 관심 직무 — 공고에 적힌 직무명 (예: 프론트엔드 개발자) */
  targetJob?: string;
  /** 직무 설명 */
  jobDescription?: string;
  /** 자격 요건 */
  requirements?: string;
  /** 위 항목에 담기지 않는 자유 메모 */
  researchNote?: string;

  createdAt: Date;
  updatedAt?: Date;
}

/** 기업 생성·수정 입력값 */
export type CompanyInput = Pick<Company, "name"> &
  Partial<
    Pick<
      Company,
      | "postingUrl"
      | "location"
      | "targetJob"
      | "jobDescription"
      | "requirements"
      | "researchNote"
    >
  >;

/** 사전 조사 내용이 하나라도 채워져 있는가 */
export function hasResearch(company: Company): boolean {
  return Boolean(
    company.targetJob?.trim() ||
      company.jobDescription?.trim() ||
      company.requirements?.trim() ||
      company.researchNote?.trim(),
  );
}
