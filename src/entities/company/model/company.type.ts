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
  /** 비채용기간용 사전 조사 내용 */
  researchNote?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/** 기업 생성·수정 입력값 */
export type CompanyInput = Pick<Company, "name"> &
  Partial<Pick<Company, "postingUrl" | "location" | "researchNote">>;
