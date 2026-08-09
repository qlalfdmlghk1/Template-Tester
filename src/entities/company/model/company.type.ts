/**
 * 기업 유형.
 * IBK 기업은행처럼 공기업이면서 금융권인 곳이 있어 한 기업에 여러 개를 달 수 있다.
 */
export const COMPANY_CATEGORIES = ["PUBLIC", "LARGE", "FINANCE"] as const;

export type CompanyCategory = (typeof COMPANY_CATEGORIES)[number];

export const COMPANY_CATEGORY_LABELS: Record<CompanyCategory, string> = {
  PUBLIC: "공기업",
  LARGE: "대기업",
  FINANCE: "금융권",
};

export const COMPANY_CATEGORY_CLASSES: Record<CompanyCategory, string> = {
  PUBLIC: "bg-green-100 text-green-800",
  LARGE: "bg-blue-100 text-blue-800",
  FINANCE: "bg-purple-100 text-purple-800",
};

/** 기업 — 지원 건과 분리해 보관한다. 같은 기업에 여러 번 지원해도 기업 정보·조사 노트는 하나만 유지된다. */
export interface Company {
  id: string;
  userId: string;
  /** 기업명 */
  name: string;
  /** 기업 유형 — 여러 개 가능 */
  categories?: CompanyCategory[];
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

  /** 지망 등급 — 없으면 아직 정하지 않은 상태 */
  preference?: CompanyPreference;

  // ── AI 자동 조사 대상 ────────────────────────────────────
  // 자소서·면접에서 바로 인용할 수 있게, 자유 메모에 뭉뚱그리지 않고 항목을 나눠 둔다.

  /** 인재상 — 기업이 공표한 인재상·핵심 가치 */
  talentProfile?: string;
  /** 사업 내용 — 주요 사업 영역·제품·서비스 */
  businessSummary?: string;
  /** 최근 이슈 — 실적·조직 개편·신사업 등 최근 소식 */
  recentIssues?: string;

  /**
   * AI 자동 조사가 채운 항목의 출처.
   * AI 결과는 초안일 뿐이므로 사용자가 직접 사실 확인할 수 있게 남긴다.
   */
  researchSources?: Partial<Record<AiResearchField, ResearchSource[]>>;
  /** AI 자동 조사를 마지막으로 실행한 시각 — 내용이 언제 기준인지 판단용 */
  researchedAt?: Date;

  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 지망 등급 — 본인이 매기는 "가고 싶은 정도".
 *
 * 조사 항목과 달리 **사실이 아니라 판단**이라 AI가 채우지 않고 채움률에도 넣지 않는다.
 * 등급이 없는 상태(아직 안 정함)가 정상이므로 값을 강제하지 않는다.
 */
export const COMPANY_PREFERENCES = ["A", "B", "C", "D"] as const;

export type CompanyPreference = (typeof COMPANY_PREFERENCES)[number];

export const COMPANY_PREFERENCE_LABELS: Record<CompanyPreference, string> = {
  A: "정말 가고 싶음",
  B: "가고 싶음",
  C: "애매함",
  D: "지원 안 할 것 같음",
};

/** 선택 화면에서 등급의 뜻을 풀어 보여준다 */
export const COMPANY_PREFERENCE_DESCRIPTIONS: Record<CompanyPreference, string> = {
  A: "붙으면 무조건 감",
  B: "붙으면 웬만하면 감",
  C: "붙어도 갈지 말지 고민할 것 같음",
  D: "예전에 지원한 적은 있지만 앞으로는 지원 안 할 것 같음",
};

export const COMPANY_PREFERENCE_CLASSES: Record<CompanyPreference, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-orange-100 text-orange-800",
  D: "bg-gray-200 text-gray-600",
};

/**
 * 조사 근거 한 건.
 *
 * URL 만으로는 라벨을 만들 수 없다 — Gemini 는 검색 결과를 리다이렉트 주소로 주기 때문에
 * 호스트가 전부 같다. 제공자가 함께 주는 제목을 보관해 표시에 쓴다.
 */
export interface ResearchSource {
  url: string;
  title?: string;
}

/** AI 자동 조사가 채우는 항목 */
export const AI_RESEARCH_FIELDS = [
  "talentProfile",
  "businessSummary",
  "recentIssues",
] as const;

export type AiResearchField = (typeof AI_RESEARCH_FIELDS)[number];

export const AI_RESEARCH_FIELD_LABELS: Record<AiResearchField, string> = {
  talentProfile: "인재상",
  businessSummary: "사업 내용",
  recentIssues: "최근 이슈",
};

/** 기업 생성·수정 입력값 */
export type CompanyInput = Pick<Company, "name"> &
  Partial<
    Pick<
      Company,
      | "categories"
      | "postingUrl"
      | "location"
      | "targetJob"
      | "jobDescription"
      | "requirements"
      | "researchNote"
      | "preference"
      | "talentProfile"
      | "businessSummary"
      | "recentIssues"
      | "researchSources"
      | "researchedAt"
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
