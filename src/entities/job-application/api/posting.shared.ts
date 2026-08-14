/**
 * 공고 추출 AI 호출에서 제공자와 무관하게 공유하는 부분.
 *
 * 프롬프트와 응답 파싱은 제공자가 달라도 같아야 한다 — 그래야 제공자를 바꿔도
 * 결과 형식이 흔들리지 않고, 추출 품질을 같은 기준으로 비교할 수 있다.
 * (기업 조사 `entities/company/api/research.shared.ts` 와 같은 구조)
 */

import { normalizeSources } from "@/shared/model/aiSource";
import type { ResearchSource } from "@/shared/model/aiSource";

// 제공자 목록은 키 보관(shared/lib/useAiKey)과 공유하므로 shared 에 둔다
import type { AiProvider } from "@/shared/config/aiProvider";
import type { PostingField } from "../model/application.type";

export { AI_PROVIDERS } from "@/shared/config/aiProvider";
export type { AiProvider } from "@/shared/config/aiProvider";

/** 붙여넣은 공고 화면 캡처 한 장 */
export interface PostingImage {
  /** "image/png" 등 */
  mediaType: string;
  /** base64 본문 (data: 접두사 없음) */
  data: string;
}

/** 모델이 받는 이미지 형식 */
export const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

/** 한 번에 보낼 수 있는 캡처 장수 — 긴 공고를 나눠 찍는 경우를 감안하되 비용을 막는다 */
export const MAX_IMAGES = 4;

/** 캡처 한 장의 용량 상한 (제공자 제한과 요청 크기를 함께 고려) */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * 추출 대상 공고.
 *
 * `url`·`pastedText`·`images` 중 하나는 있어야 한다. 우선순위는 이미지 > 붙여넣은 본문 > 링크다.
 *
 * 경로가 셋인 이유: 공기업·대기업 채용 페이지는 자동 접근을 막아 링크로 못 읽고,
 * 모집요강을 이미지 한 장으로 올리는 곳이 많아 텍스트 복사도 안 된다.
 * 화면 캡처가 그런 공고에 남는 유일한 경로다.
 */
export interface PostingExtractTarget {
  /** 공고 링크. 붙여넣기 경로에서는 비어 있을 수 있다 */
  url?: string;
  /** 공고 본문 원문 — 링크로 못 읽었을 때 사용자가 직접 붙여넣은 것 */
  pastedText?: string;
  /** 공고 화면 캡처 — 본문이 이미지라 복사도 안 되는 공고용 */
  images?: PostingImage[];
  /** 동명 기업·직무 혼동을 줄이는 단서 */
  companyName?: string;
  postingTitle?: string;
}

/** 링크를 읽으러 가야 하는가 — 이미지·본문이 있으면 그게 정본이라 도구를 쓰지 않는다 */
export function needsFetchTools(target: PostingExtractTarget): boolean {
  return !target.images?.length && !target.pastedText?.trim();
}

export interface PostingExtractInput extends PostingExtractTarget {
  provider: AiProvider;
  apiKey: string;
  /** 화면을 벗어나면 끊기 위한 취소 신호 */
  signal?: AbortSignal;
}

export interface PostingExtractResult {
  jobDescription?: string;
  requirements?: string;
  preferredQualifications?: string;
  /** 항목별 근거 */
  sources: Partial<Record<PostingField, ResearchSource[]>>;
  /**
   * 전형 일정 — 검증 전 원본이다.
   *
   * 텍스트 항목과 달리 구조체라 모델 출력을 그대로 믿을 수 없어, 여기서는 손대지 않고
   * `parsePostingSchedules` 로 검증한 뒤 화면에 올린다. 연도 추론에 기준 연도가 필요한데
   * 그건 화면 맥락(보고 있는 반기)에 달려 있어 호출 계층에서는 알 수 없다.
   */
  rawSchedules?: unknown;
}

export type PostingExtractErrorKind =
  | "auth"
  /** 크레딧·결제 문제 — 키는 정상이지만 잔액이나 결제 설정이 안 된 상태 */
  | "credit"
  /** 무료 한도 소진 등 사용량 초과 */
  | "rateLimit"
  | "network"
  | "parse"
  /**
   * 공고 페이지를 읽지 못함.
   *
   * 다른 실패와 달리 **사용자가 할 수 있는 일이 있다** — 본문을 붙여넣으면 된다.
   * 그래서 별도 종류로 두고, 화면에서 폴백 경로로 유도한다.
   */
  | "fetchBlocked"
  | "unknown";

/** 호출 실패를 화면에서 구분해 다루기 위한 에러 */
export class PostingExtractError extends Error {
  // 생성자 파라미터 프로퍼티는 erasableSyntaxOnly 에서 막히므로 필드를 따로 선언한다
  readonly kind: PostingExtractErrorKind;

  constructor(message: string, kind: PostingExtractErrorKind) {
    super(message);
    this.name = "PostingExtractError";
    this.kind = kind;
  }
}

/** 공고를 읽지 못했을 때 — 붙여넣기 폴백으로 유도하는 에러 */
export function fetchBlockedError(): PostingExtractError {
  return new PostingExtractError(
    "공고 페이지를 읽지 못했습니다. 사이트가 자동 접근을 막았거나 공고가 내려갔을 수 있습니다. 공고 본문을 붙여넣어 주세요.",
    "fetchBlocked",
  );
}

/**
 * 사용자가 준 자료(캡처·붙여넣은 본문)에서 아무것도 못 뽑은 경우.
 *
 * 링크 실패와 달리 폴백으로 보낼 곳이 없다 — 자료를 다시 주는 수밖에 없어서
 * 무엇을 고쳐야 하는지 자료 종류에 맞춰 알려준다.
 */
export function emptySourceError(target: PostingExtractTarget): PostingExtractError {
  if (target.images?.length) {
    return new PostingExtractError(
      "캡처에서 공고 내용을 찾지 못했습니다. 모집요강이 보이게 다시 캡처하거나, 글자가 작으면 화면을 확대한 뒤 찍어 주세요.",
      "parse",
    );
  }

  return new PostingExtractError(
    "붙여넣은 본문에서 공고 내용을 찾지 못했습니다. 직무 설명·자격 요건이 포함된 부분을 붙여넣어 주세요.",
    "parse",
  );
}

/**
 * 응답이 길이 상한에 걸려 잘린 경우.
 *
 * 그냥 parse 실패로 두면 "다시 시도해 주세요"가 뜨는데, 다시 해도 같은 지점에서 잘려
 * 사용자가 빠져나갈 길이 없다. 자료를 줄이라고 알려 줘야 한다.
 */
export function truncatedError(): PostingExtractError {
  return new PostingExtractError(
    "공고가 길어 내용을 끝까지 읽지 못했습니다. 모집요강 부분만 잘라서 캡처하거나 나눠서 넣어 주세요.",
    "parse",
  );
}

/** fetch 자체가 실패한 경우 — 네트워크·CORS 문제 */
export function networkError(): PostingExtractError {
  return new PostingExtractError(
    "네트워크 오류로 공고를 불러오지 못했습니다. 연결을 확인해 주세요.",
    "network",
  );
}

/**
 * 사용자가 취소한 요청인가.
 *
 * 취소는 실패가 아니므로 네트워크 오류로 뭉뚱그리면 안 된다 — 이미 떠난 화면에
 * 에러를 남기거나, 뒤늦은 응답이 반영되는 일이 생긴다.
 */
export function isAbortError(cause: unknown): boolean {
  return cause instanceof Error && cause.name === "AbortError";
}

export const POSTING_SYSTEM_PROMPT = `당신은 채용 공고에서 지원자가 알아야 할 내용을 뽑아내는 도우미입니다.

원칙:
- 반드시 주어진 공고 내용에 근거해 작성합니다. 공고에 없는 내용은 지어내지 말고 해당 항목을 비웁니다.
- 공고 원문의 표현을 최대한 살립니다. 요약하더라도 자격 요건의 숫자(경력 연차·학력·어학 점수)는 바꾸지 않습니다.
- 항목을 나열형으로 정리합니다. 각 줄은 "- " 로 시작합니다.
- "자격 요건"과 "우대사항"을 섞지 않습니다. 공고가 둘을 구분하지 않으면 자격 요건에만 담고 우대사항은 비웁니다.
- 각 항목마다 근거가 된 URL 을 sources 에 담습니다. 붙여넣은 본문에서 뽑았다면 sources 를 비웁니다.
- 자기소개서·면접에 바로 쓸 핵심 문구를 항목마다 3개 이상 5개 이하로 골라 **처럼 별표 두 개로 감쌉니다.
  단어나 짧은 구 단위로만 감싸고 문장 전체를 감싸지 않습니다. 그 밖의 용도로는 별표를 쓰지 않습니다.
- 설명이나 인사말 없이 JSON 만 출력합니다.

전형 일정(schedules) 규칙:
- 공고에 **명시된 일정만** 담습니다. "추후 개별 안내"처럼 날짜가 없으면 그 단계를 넣지 않습니다.
- 단계 키는 다음 중에서만 고릅니다:
  resume(자소서·서류 접수), aiTest(AI 역량검사), personality(인성검사), aptitude(직무/적성),
  written(필기), codingTest(코딩 테스트), interview1(1차 면접), interview2(2차 면접),
  finalResult(최종발표), onboarding(출근)
- 서류 접수 기간은 resume 에 담습니다. 마감 시각이 적혀 있으면 종료일에 함께 적습니다.
- 표기 형태 세 가지 중 하나를 씁니다:
  { "kind": "exact", "at": "2026-03-11T17:00" }        하루 (시각 없으면 "2026-03-11")
  { "kind": "range", "start": "2026-03-04", "end": "2026-03-11T17:00" }   기간
  { "kind": "rough", "month": 4, "part": "early" }     "4월 초" 같은 러프 표기
- part 는 early(초)·mid(중순)·late(말)·whole(중) 중 하나입니다.
- **연도를 공고에서 확인할 수 없으면 연도를 빼고 "03-11" 처럼 적습니다.** 임의로 채우지 마세요.

출력 형식:
{
  "jobDescription": "직무 설명 — 이 공고가 맡길 일. 없으면 빈 문자열",
  "requirements": "자격 요건 — 지원 자격·필수 조건",
  "preferredQualifications": "우대사항 — 있으면 좋은 조건",
  "sources": {
    "jobDescription": ["url", ...],
    "requirements": ["url", ...],
    "preferredQualifications": ["url", ...]
  },
  "schedules": {
    "resume": { "kind": "range", "start": "03-04", "end": "03-11T17:00" }
  }
}`;

export function buildPostingPrompt(target: PostingExtractTarget): string {
  const hints = [
    target.companyName && `기업명: ${target.companyName}`,
    target.postingTitle && `공고명: ${target.postingTitle}`,
  ].filter(Boolean);

  // 캡처가 있으면 그게 정본이다. 이미지는 별도 블록으로 실려 가고 여기서는 읽는 법만 지시한다.
  if (target.images?.length) {
    const shots =
      target.images.length > 1
        ? `첨부한 화면 캡처 ${target.images.length}장은 한 공고를 위에서 아래로 나눠 찍은 것입니다.`
        : "첨부한 화면 캡처는 채용 공고 화면입니다.";

    return [
      ...hints,
      "",
      shots,
      "이미지에 보이는 내용만 근거로 정리해 주세요. 웹을 검색하거나 페이지를 가져오지 마세요.",
      // 잘못 읽은 숫자는 빈칸보다 해롭다 — 마감일을 틀리면 지원 자체를 놓친다
      "숫자(경력 연차·날짜·시각·인원)는 이미지에 보이는 그대로 옮깁니다.",
      "글자가 흐릿해 확실하지 않으면 추측하지 말고 그 항목을 비웁니다.",
      target.pastedText?.trim()
        ? `\n참고용으로 함께 붙여넣은 텍스트입니다:\n${target.pastedText.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  // 붙여넣은 본문이 있으면 그게 정본이다 — 링크를 같이 주면 모델이 굳이 페이지를
  // 다시 읽으려 하다가 차단당해 빈손으로 돌아오는 일이 생긴다.
  if (target.pastedText?.trim()) {
    return [
      ...hints,
      "",
      "아래는 사용자가 붙여넣은 채용 공고 본문입니다. 이 내용만 근거로 정리해 주세요.",
      "웹을 검색하거나 페이지를 가져오지 마세요.",
      "",
      "--- 공고 본문 시작 ---",
      target.pastedText.trim(),
      "--- 공고 본문 끝 ---",
    ].join("\n");
  }

  return [
    ...hints,
    `채용 공고: ${target.url ?? ""}`,
    "",
    "위 채용 공고 페이지를 가져와 내용을 정리해 주세요.",
    "페이지를 읽을 수 없으면 지어내지 말고 모든 항목을 빈 문자열로 두세요.",
  ].join("\n");
}

/**
 * 응답 텍스트에서 추출 결과를 뽑는다.
 *
 * 모델이 JSON 앞뒤에 설명을 붙이는 경우가 있어, 코드펜스를 걷어낸 뒤에도
 * 실패하면 첫 `{` ~ 마지막 `}` 구간을 다시 시도한다.
 */
export function parsePostingResult(text: string): PostingExtractResult {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  const candidates = [cleaned];

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    candidates.push(cleaned.slice(start, end + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as Record<string, unknown>;

      // 모델이 문자열 대신 배열·숫자를 줄 수 있다. 그대로 통과시키면 뒤에서
      // `.trim()` 이 TypeError 로 터져 parse 가 아닌 unknown 실패로 흘러간다.
      const text = (value: unknown) =>
        typeof value === "string" && value.trim() ? value : undefined;

      // 모델은 프롬프트대로 URL 문자열을 주므로 표시·저장용 형태로 맞춘다.
      // 일정은 기준 연도가 있어야 정규화할 수 있어 원본 그대로 넘긴다.
      return {
        jobDescription: text(parsed.jobDescription),
        requirements: text(parsed.requirements),
        preferredQualifications: text(parsed.preferredQualifications),
        sources: normalizeSources<PostingField>(parsed.sources),
        rawSchedules: parsed.schedules,
      };
    } catch {
      // 다음 후보로
    }
  }

  throw new PostingExtractError(
    "공고 내용을 읽지 못했습니다. 다시 시도해 주세요.",
    "parse",
  );
}

/**
 * 모든 항목이 비어 있는가.
 *
 * 서버 도구가 페이지를 못 가져오면 모델은 프롬프트대로 전 항목을 비운 JSON 을 준다.
 * 이걸 성공으로 흘려보내면 화면에 빈 결과만 뜨고 사용자는 이유를 모른다 —
 * 호출 계층에서 이 검사로 걸러 폴백 안내로 보낸다.
 */
export function isEmptyResult(result: PostingExtractResult): boolean {
  // 일정이 하나라도 잡혔다면 페이지는 읽힌 것이다 — 텍스트가 비어도 실패로 보지 않는다
  const hasSchedule =
    Boolean(result.rawSchedules) &&
    typeof result.rawSchedules === "object" &&
    Object.keys(result.rawSchedules as object).length > 0;

  return !(
    result.jobDescription?.trim() ||
    result.requirements?.trim() ||
    result.preferredQualifications?.trim() ||
    hasSchedule
  );
}

export interface ApiErrorBody {
  /** 사용자에게 보여줄 원인 문구 */
  message: string;
  /**
   * 응답 본문 원문(직렬화).
   * 어떤 한도에 걸렸는지 같은 세부 사유는 `error.message` 가 아니라
   * `details` 안에 들어오는 경우가 있어, 문자열 전체를 두고 찾는다.
   */
  raw: string;
}

/**
 * 공고를 못 읽었을 때 원인을 가리기 위한 진단 로그.
 *
 * "도구가 아예 안 돌았다"와 "돌았지만 페이지가 스크립트로 그려져 본문이 비어 있었다"는
 * 화면에서 똑같이 "못 읽었습니다"로 보인다. 둘을 구분해야 고칠 곳이 정해진다.
 *
 * 개발 모드에서만 찍는다. 키는 요청 헤더에만 있고 여기 넘기는 값에는 없다.
 */
export function logPostingDiagnostics(
  provider: string,
  detail: Record<string, unknown>,
): void {
  // 테스트에서도 DEV 가 참이라 모드까지 본다 — 진단 로그가 테스트 출력을 덮지 않게
  if (!import.meta.env.DEV || import.meta.env.MODE === "test") return;
  console.debug(`[공고 추출/${provider}]`, detail);
}

/** 실패 응답 본문에서 원인을 꺼낸다. 본문에는 키가 포함되지 않는다. */
export async function readErrorBody(response: Response): Promise<ApiErrorBody> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return {
      message: body.error?.message ?? "",
      raw: JSON.stringify(body),
    };
  } catch {
    return { message: "", raw: "" };
  }
}
