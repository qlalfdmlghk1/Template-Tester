/**
 * Anthropic(Claude) 기반 기업 조사.
 *
 * 웹 검색은 Anthropic 서버가 대신 수행하는 도구를 쓴다.
 * 브라우저 직접 호출에는 전용 허용 헤더가 필요하다(2026-08-08 실측 확인).
 */

import {
  CompanyResearchError,
  RESEARCH_SYSTEM_PROMPT,
  buildResearchPrompt,
  networkError,
  parseResearchResult,
  readErrorBody,
} from "./research.shared";
import type {
  CompanyResearchResult,
  CompanyResearchTarget,
} from "./research.shared";

const API_URL = "https://api.anthropic.com/v1/messages";

/** 웹 검색 도구는 Haiku 계열에서 지원되지 않아 Sonnet 을 쓴다 */
const MODEL = "claude-sonnet-5";

/** 조사 1회당 웹 검색 상한 — 사용자 비용이 예상 밖으로 늘지 않게 막는다 */
const MAX_SEARCH_USES = 5;

/** pause_turn 재개 상한 — 서버 도구 루프가 끝나지 않을 때 무한 반복을 막는다 */
const MAX_RESUMES = 3;

const MAX_TOKENS = 4096;

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
 * (web_search_tool_result 등은 JSON 이 아니다)
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
        // 이 헤더가 없으면 브라우저 직접 호출이 CORS 로 차단된다
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: RESEARCH_SYSTEM_PROMPT,
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
    throw networkError();
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new CompanyResearchError(
        "Claude API 키가 올바르지 않습니다. 설정에서 키를 확인해 주세요.",
        "auth",
      );
    }
    if (response.status === 429) {
      throw new CompanyResearchError(
        "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.",
        "rateLimit",
      );
    }

    const { message: detail } = await readErrorBody(response);

    // 키를 발급만 하고 충전을 안 한 상태가 가장 흔한 실패다
    if (/credit balance/i.test(detail)) {
      throw new CompanyResearchError(
        "Anthropic 계정에 크레딧이 없습니다. 콘솔의 Plans & Billing에서 충전한 뒤 다시 시도해 주세요.",
        "credit",
      );
    }

    throw new CompanyResearchError(
      `조사에 실패했습니다. (HTTP ${response.status}) ${detail}`.trim(),
      "unknown",
    );
  }

  return (await response.json()) as AnthropicResponse;
}

export async function researchWithAnthropic(
  apiKey: string,
  target: CompanyResearchTarget,
): Promise<CompanyResearchResult> {
  const messages: unknown[] = [
    { role: "user", content: buildResearchPrompt(target) },
  ];

  for (let attempt = 0; attempt <= MAX_RESUMES; attempt += 1) {
    const data = await callApi(apiKey, messages);

    // 서버 측 도구 루프가 한도에 걸린 것 — 그대로 이어붙여 재요청하면 이어서 진행된다
    if (data.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: data.content });
      continue;
    }

    return parseResearchResult(extractText(data.content));
  }

  throw new CompanyResearchError(
    "조사가 예상보다 길어져 중단했습니다. 다시 시도해 주세요.",
    "unknown",
  );
}
