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
  jobTag: JobTag;
  /** 채용 인원. 공고에 "00명"처럼 미공개인 경우가 있어 null을 허용한다 */
  headcount: number | null;
  /** 값이 있으면 미지원으로 간주하고 합격률 집계에서 제외한다 */
  notAppliedReason?: string;
  /** 지원 건 단위 메모 */
  memo?: string;
  stages: Record<StageKey, StageEntry>;
  createdAt: Date;
  updatedAt?: Date;
}

/** 지원 건 생성·수정 입력값 */
export type JobApplicationInput = Pick<
  JobApplication,
  "companyId" | "postingTitle" | "jobTag" | "headcount"
> &
  Partial<Pick<JobApplication, "notAppliedReason" | "memo" | "stages">>;

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
