/**
 * 기업 조사 AI 호출 — 사용자 본인 API 키로 Anthropic API를 브라우저에서 직접 호출한다.
 *
 * 서버(Firebase Functions)를 두지 않는 이유와 보안 전제는 `shared/lib/useAiKey.ts` 참조.
 *
 * 주의:
 * - Anthropic SDK를 의존성으로 추가하지 않는다. 키가 브라우저에 있는 구조에서 남는 위험이
 *   공급망(의존성 오염)이므로 런타임 의존성을 늘리지 않는다.
 * - 응답은 사용자가 검토·수정할 **초안**이다. 바로 저장하지 않는다.
 */

import type { AiResearchField } from "../model/company.type";

const API_URL = "https://api.anthropic.com/v1/messages";

/**
 * 웹 검색 도구가 필요하므로 Haiku는 쓸 수 없다.
 * (`web_search_20260209`는 Sonnet 4.6 / Opus 4.6 이상에서 지원)
 */
const MODEL = "claude-sonnet-5";

/** 조사 1회당 웹 검색 상한 — 사용자 비용이 예상 밖으로 늘지 않게 막는다 */
const MAX_SEARCH_USES = 5;

/** pause_turn 재개 상한 — 서버 도구 루프가 끝나지 않을 때 무한 반복을 막는다 */
const MAX_RESUMES = 3;

const MAX_TOKENS = 4096;

export interface CompanyResearchInput {
  apiKey: string;
  /** 기업명 */
  name: string;
  /** 동명 기업 구분을 돕는 단서 — 있으면 정확도가 올라간다 */
  targetJob?: string;
  location?: string;
  postingUrl?: string;
}

export interface CompanyResearchResult {
  talentProfile?: string;
  businessSummary?: string;
  recentIssues?: string;
  /** 항목별 근거 URL */
  sources: Partial<Record<AiResearchField, string[]>>;
}

export type CompanyResearchErrorKind =
  | "auth"
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

const SYSTEM_PROMPT = `당신은 취업 준비생의 기업 조사를 돕는 조사원입니다.
주어진 기업에 대해 웹 검색으로 사실을 확인한 뒤, 자기소개서와 면접 준비에 바로 쓸 수 있게 정리합니다.

원칙:
- 반드시 웹 검색 결과에 근거해 작성합니다. 검색으로 확인되지 않은 내용은 지어내지 말고 해당 항목을 비웁니다.
- 각 항목마다 근거가 된 URL을 sources에 담습니다.
- "최근 이슈"는 최근 1년 이내 소식을 우선합니다.
- 한국 기업이면 한국어 자료를 우선 검색합니다.
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

function buildUserPrompt(input: CompanyResearchInput): string {
  const hints = [
    input.targetJob && `관심 직무: ${input.targetJob}`,
    input.location && `근무 위치: ${input.location}`,
    input.postingUrl && `채용 공고: ${input.postingUrl}`,
  ].filter(Boolean);

  return [
    `기업명: ${input.name}`,
    ...hints,
    "",
    "위 기업을 조사해 주세요. 동명의 다른 기업과 혼동하지 않도록 주의하세요.",
  ].join("\n");
}

/** 응답 텍스트에서 코드펜스를 걷어내고 JSON을 파싱한다 */
function parseJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
  stop_reason?: string;
}

/**
 * 도구 사용 블록이 섞여 오므로 text 블록만 골라 이어붙인다.
 * (web_search_tool_result 등은 JSON이 아니다)
 */
function extractText(content: AnthropicContentBlock[]): string {
  return content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("");
}

async function callApi(
  apiKey: string,
  messages: unknown[],
): Promise<AnthropicResponse> {
  let response: Response;

  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        // 이 헤더가 없으면 브라우저 직접 호출이 CORS 로 차단된다 (2026-08-08 실측 확인)
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages,
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: MAX_SEARCH_USES,
          },
        ],
      }),
    });
  } catch {
    throw new CompanyResearchError(
      "네트워크 오류로 조사에 실패했습니다. 연결을 확인해 주세요.",
      "network",
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new CompanyResearchError(
        "API 키가 올바르지 않습니다. 설정에서 키를 확인해 주세요.",
        "auth",
      );
    }
    if (response.status === 429) {
      throw new CompanyResearchError(
        "요청이 몰렸거나 크레딧이 부족합니다. 잠시 후 다시 시도해 주세요.",
        "rateLimit",
      );
    }
    throw new CompanyResearchError(
      `조사에 실패했습니다. (HTTP ${response.status})`,
      "unknown",
    );
  }

  return (await response.json()) as AnthropicResponse;
}

export async function researchCompany(
  input: CompanyResearchInput,
): Promise<CompanyResearchResult> {
  const messages: unknown[] = [
    { role: "user", content: buildUserPrompt(input) },
  ];

  for (let attempt = 0; attempt <= MAX_RESUMES; attempt += 1) {
    const data = await callApi(input.apiKey, messages);

    // 서버 측 도구 루프가 한도에 걸린 것 — 그대로 이어붙여 재요청하면 이어서 진행된다
    if (data.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: data.content });
      continue;
    }

    const text = extractText(data.content);
    try {
      const parsed = parseJson<CompanyResearchResult>(text);
      return { ...parsed, sources: parsed.sources ?? {} };
    } catch {
      throw new CompanyResearchError(
        "조사 결과를 읽지 못했습니다. 다시 시도해 주세요.",
        "parse",
      );
    }
  }

  throw new CompanyResearchError(
    "조사가 예상보다 길어져 중단했습니다. 다시 시도해 주세요.",
    "unknown",
  );
}
