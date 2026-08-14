import type { ResearchSource } from "@/shared/model/aiSource";
import type { JobTag, StageKey, StageStatus } from "./stage";
import type { Schedule } from "./schedule";

/** 전형 단계 한 칸 — 시트의 셀 하나에 대응한다 */
export interface StageEntry {
  status: StageStatus;
  schedule: Schedule | null;
  /** 시트의 셀 메모에 대응 */
  memo?: string;
}

/**
 * 지원 건 — 화면의 한 행.
 *
 * 레코드 단위가 기업이 아니라 "특정 공고에 대한 지원"이다.
 * 같은 기업에 여러 번 지원하면 지원 건이 여러 개 생기고, 공고명으로 구분한다.
 */
export interface JobApplication {
  id: string;
  userId: string;
  /** Company.id 참조 */
  companyId: string;
  /** 같은 기업 복수 지원 건을 구분하는 공고명 */
  postingTitle: string;
  /**
   * 이 공고의 링크.
   *
   * 기업이 아니라 지원 건에 둔다 — 같은 기업에 상·하반기로 두 번 지원하면 공고가 둘이고
   * 링크도 둘이다. 기업 단위로 두면 나중 지원 건이 앞의 링크를 덮어쓴다.
   * 비어 있으면 화면에서 기업의 대표 링크(`Company.postingUrl`)로 대체한다.
   */
  postingUrl?: string;
  jobTag: JobTag;
  /** 채용 인원. 공고에 "00명"처럼 미공개인 경우가 있어 null을 허용한다 */
  headcount: number | null;
  /** 값이 있으면 미지원으로 간주하고 합격률 집계에서 제외한다 */
  notAppliedReason?: string;
  /** 지원 건 단위 메모 */
  memo?: string;
  stages: Record<StageKey, StageEntry>;

  // ── 공고에서 추출한 모집 요강 ──────────────────────────────
  // 기업의 같은 이름 필드(`Company.jobDescription`·`requirements`)와는 다른 것이다.
  // 기업 쪽은 공고가 뜨기 전에 미리 조사해 두는 **기업 단위 대략치**이고,
  // 여기 있는 값은 **이 공고에 실제로 적힌 내용**이다. 같은 기업에 상·하반기로
  // 두 번 지원하면 자격 요건이 다르므로 지원 건에 둔다 (`postingUrl` 과 같은 근거).

  /** 직무 설명 — 이 공고가 맡길 일 */
  jobDescription?: string;
  /** 자격 요건 */
  requirements?: string;
  /** 우대사항 */
  preferredQualifications?: string;

  /**
   * 공고 추출이 채운 항목의 출처.
   * AI 결과는 초안일 뿐이므로 사용자가 직접 사실 확인할 수 있게 남긴다.
   */
  postingSources?: Partial<Record<PostingField, ResearchSource[]>>;
  /** 공고 추출을 마지막으로 실행한 시각 — 내용이 언제 기준인지 판단용 */
  extractedAt?: Date;

  createdAt: Date;
  updatedAt?: Date;
}

/** 공고 추출이 채우는 항목 */
export const POSTING_FIELDS = [
  "jobDescription",
  "requirements",
  "preferredQualifications",
] as const;

export type PostingField = (typeof POSTING_FIELDS)[number];

export const POSTING_FIELD_LABELS: Record<PostingField, string> = {
  jobDescription: "직무 설명",
  requirements: "자격 요건",
  preferredQualifications: "우대사항",
};

/** 공고 내용이 하나라도 채워져 있는가 */
export function hasPostingDetail(application: JobApplication): boolean {
  return POSTING_FIELDS.some((field) => application[field]?.trim());
}

/** 지원 건 생성·수정 입력값 */
export type JobApplicationInput = Pick<
  JobApplication,
  "companyId" | "postingTitle" | "jobTag" | "headcount"
> &
  Partial<
    Pick<
      JobApplication,
      | "postingUrl"
      | "notAppliedReason"
      | "memo"
      | "stages"
      | "jobDescription"
      | "requirements"
      | "preferredQualifications"
      | "postingSources"
      | "extractedAt"
    >
  >;

/** 단계 상태에서 파생되는 지원 건 전체 상태 — 별도 입력 필드가 아니다 */
export const APPLICATION_STATUSES = [
  "IN_PROGRESS",
  "REJECTED",
  "FINAL_PASSED",
  "NOT_APPLIED",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  IN_PROGRESS: "진행 중",
  REJECTED: "탈락",
  FINAL_PASSED: "최종 합격",
  NOT_APPLIED: "미지원",
};
