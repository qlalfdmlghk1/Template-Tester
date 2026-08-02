/** 전형 단계 정의 — 고정 10단계 세트 (사용자 정의 불가) */

export const STAGE_KEYS = [
  "resume",
  "aiTest",
  "personality",
  "aptitude",
  "written",
  "codingTest",
  "interview1",
  "interview2",
  "finalResult",
  "onboarding",
] as const;

export type StageKey = (typeof STAGE_KEYS)[number];

export const STAGE_LABELS: Record<StageKey, string> = {
  resume: "자소서",
  aiTest: "AI 역량검사",
  personality: "인성검사",
  aptitude: "직무/적성",
  written: "필기",
  codingTest: "코딩 테스트",
  interview1: "1차 면접",
  interview2: "2차 면접",
  finalResult: "최종발표",
  onboarding: "출근",
};

/**
 * 합격률 집계 대상 단계.
 * 최종발표·출근은 전형이 아니라 결과·후속 단계라 합격률 개념이 성립하지 않아 제외한다.
 */
export const PASS_RATE_STAGE_KEYS: readonly StageKey[] = STAGE_KEYS.slice(0, 8);

/** 반기 귀속 기준이 되는 단계 — 자소서 마감일로 상/하반기를 판정한다 */
export const HALF_ANCHOR_STAGE: StageKey = "resume";

/**
 * 전형 단계 상태.
 * 기존 구글 시트의 셀 배경색 체계에서 도출했다.
 */
export const STAGE_STATUSES = [
  "PASSED",
  "SUBMITTED",
  "FAILED",
  "SKIPPED",
  "NOT_APPLICABLE",
  "PENDING",
] as const;

export type StageStatus = (typeof STAGE_STATUSES)[number];

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  PASSED: "합격",
  SUBMITTED: "응시·제출",
  FAILED: "불합격",
  /** 응시 자격은 있었으나 가지 않은 전형. "해당 없음"과 달리 그 기업에 존재하는 단계다 */
  SKIPPED: "불참·포기",
  NOT_APPLICABLE: "해당 없음",
  PENDING: "진행 전",
};

/**
 * 상태별 표시 정의.
 * 색상만으로 구분하면 색각 이상 사용자가 합격/불합격을 구별할 수 없으므로 아이콘을 함께 쓴다.
 * 색상 토큰은 CSS 변수 기반이라 다크 테마에서 값이 자동으로 바뀐다(`dark:` 접두사 불필요).
 * icon 값은 AppIcon이 쓰는 heroicons 이름이다.
 */
export const STAGE_STATUS_DISPLAY: Record<
  StageStatus,
  { icon: string; cellClass: string; iconClass: string }
> = {
  PASSED: {
    icon: "check",
    cellClass: "bg-green-50",
    iconClass: "text-green-600",
  },
  SUBMITTED: {
    icon: "clock",
    cellClass: "bg-blue-50",
    iconClass: "text-blue-600",
  },
  FAILED: {
    icon: "x-mark",
    cellClass: "bg-red-50",
    iconClass: "text-red-600",
  },
  SKIPPED: {
    icon: "arrow-uturn-right",
    cellClass: "bg-yellow-100",
    iconClass: "text-yellow-800",
  },
  NOT_APPLICABLE: {
    icon: "minus",
    cellClass: "bg-gray-100",
    iconClass: "text-gray-400",
  },
  PENDING: {
    icon: "",
    cellClass: "",
    iconClass: "",
  },
};

/** 모든 단계가 비어 있는 초기 상태 */
export function createEmptyStages(): Record<
  StageKey,
  { status: StageStatus; schedule: null }
> {
  const stages = {} as Record<StageKey, { status: StageStatus; schedule: null }>;
  for (const key of STAGE_KEYS) {
    stages[key] = { status: "PENDING", schedule: null };
  }
  return stages;
}

/** 직무 태그 — 고정 세트 */
export const JOB_TAGS = ["IT", "SW", "FE", "PM"] as const;

export type JobTag = (typeof JOB_TAGS)[number];

export const JOB_TAG_CLASSES: Record<JobTag, string> = {
  IT: "bg-green-100 text-green-800",
  SW: "bg-purple-100 text-purple-800",
  FE: "bg-yellow-100 text-yellow-800",
  PM: "bg-blue-100 text-blue-800",
};
