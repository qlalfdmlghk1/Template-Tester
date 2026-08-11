/**
 * 기업 조사 AI 호출에서 제공자와 무관하게 공유하는 부분.
 *
 * 프롬프트와 응답 파싱은 제공자가 달라도 같아야 한다 — 그래야 제공자를 바꿔도
 * 결과 형식이 흔들리지 않고, 조사 품질을 같은 기준으로 비교할 수 있다.
 */

import type { AiResearchField, ResearchSource } from "../model/company.type";

// 제공자 목록은 키 보관(shared/lib/useAiKey)과 공유하므로 shared 에 둔다
import type { AiProvider } from "@/shared/config/aiProvider";

export { AI_PROVIDERS } from "@/shared/config/aiProvider";
export type { AiProvider } from "@/shared/config/aiProvider";

export interface CompanyResearchTarget {
  /** 기업명 */
  name: string;
  /** 동명 기업 구분을 돕는 단서 — 있으면 정확도가 올라간다 */
  targetJob?: string;
  location?: string;
  postingUrl?: string;
}

export interface CompanyResearchInput extends CompanyResearchTarget {
  provider: AiProvider;
  apiKey: string;
  /** 화면을 벗어나면 끊기 위한 취소 신호 */
  signal?: AbortSignal;
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

export interface CompanyResearchResult {
  talentProfile?: string;
  businessSummary?: string;
  recentIssues?: string;
  /** 항목별 근거 */
  sources: Partial<Record<AiResearchField, ResearchSource[]>>;
}

export type CompanyResearchErrorKind =
  | "auth"
  /** 크레딧·결제 문제 — 키는 정상이지만 잔액이나 결제 설정이 안 된 상태 */
  | "credit"
  /** 무료 한도 소진 등 사용량 초과 */
  | "rateLimit"
  | "network"
  | "parse"
  | "unknown";

/** 호출 실패를 화면에서 구분해 다루기 위한 에러 */
export class CompanyResearchError extends Error {
  // 생성자 파라미터 프로퍼티는 erasableSyntaxOnly 에서 막히므로 필드를 따로 선언한다
  readonly kind: CompanyResearchErrorKind;

  constructor(message: string, kind: CompanyResearchErrorKind) {
    super(message);
    this.name = "CompanyResearchError";
    this.kind = kind;
  }
}

export const RESEARCH_SYSTEM_PROMPT = `당신은 취업 준비생의 기업 조사를 돕는 조사원입니다.
주어진 기업에 대해 웹 검색으로 사실을 확인한 뒤, 자기소개서와 면접 준비에 바로 쓸 수 있게 정리합니다.

원칙:
- 반드시 웹 검색 결과에 근거해 작성합니다. 검색으로 확인되지 않은 내용은 지어내지 말고 해당 항목을 비웁니다.
- 각 항목마다 근거가 된 URL을 sources에 담습니다.
- "최근 이슈"는 최근 1년 이내 소식을 우선합니다.
- 한국 기업이면 한국어 자료를 우선 검색합니다.
- 각 항목에서 자기소개서·면접에 바로 쓸 핵심 문구를 3개 이상 5개 이하로 골라 **처럼 별표 두 개로 감쌉니다.
  단어나 짧은 구 단위로만 감싸고 문장 전체를 감싸지 않습니다. 그 밖의 용도로는 별표를 쓰지 않습니다.
- 설명이나 인사말 없이 JSON만 출력합니다.

출력 형식:
{
  "talentProfile": "인재상 — 기업이 공표한 인재상·핵심 가치. 없으면 빈 문자열",
  "businessSummary": "사업 내용 — 주요 사업 영역·제품·서비스",
  "recentIssues": "최근 이슈 — 실적·조직 개편·신사업 등",
  "sources": {
    "talentProfile": ["url", ...],
    "businessSummary": ["url", ...],
    "recentIssues": ["url", ...]
  }
}`;

export function buildResearchPrompt(target: CompanyResearchTarget): string {
  const hints = [
    target.targetJob && `관심 직무: ${target.targetJob}`,
    target.location && `근무 위치: ${target.location}`,
    target.postingUrl && `채용 공고: ${target.postingUrl}`,
  ].filter(Boolean);

  return [
    `기업명: ${target.name}`,
    ...hints,
    "",
    "위 기업을 조사해 주세요. 동명의 다른 기업과 혼동하지 않도록 주의하세요.",
  ].join("\n");
}

/**
 * 응답 텍스트에서 조사 결과를 뽑는다.
 *
 * 모델이 JSON 앞뒤에 설명을 붙이는 경우가 있어, 코드펜스를 걷어낸 뒤에도
 * 실패하면 첫 `{` ~ 마지막 `}` 구간을 다시 시도한다.
 */
export function parseResearchResult(text: string): CompanyResearchResult {
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
      const parsed = JSON.parse(candidate) as CompanyResearchResult;
      // 모델은 프롬프트대로 URL 문자열을 주므로 표시용 형태로 맞춘다
      return { ...parsed, sources: normalizeSources(parsed.sources) };
    } catch {
      // 다음 후보로
    }
  }

  throw new CompanyResearchError(
    "조사 결과를 읽지 못했습니다. 다시 시도해 주세요.",
    "parse",
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

/** 모델이 준 출처를 표시용 형태로 맞춘다. URL 문자열과 객체를 모두 받는다. */
function normalizeSources(
  raw: unknown,
): Partial<Record<AiResearchField, ResearchSource[]>> {
  if (!raw || typeof raw !== "object") return {};

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([field, value]) => [
      field,
      (Array.isArray(value) ? value : [])
        .map((item) =>
          typeof item === "string" ? { url: item } : (item as ResearchSource),
        )
        .filter((item) => typeof item?.url === "string"),
    ]),
  );
}

/** fetch 자체가 실패한 경우 — 네트워크·CORS 문제 */
export function networkError(): CompanyResearchError {
  return new CompanyResearchError(
    "네트워크 오류로 조사에 실패했습니다. 연결을 확인해 주세요.",
    "network",
  );
}
