/**
 * Google Gemini 기반 기업 조사.
 *
 * 무료 사용량이 있어 크레딧 충전 없이 쓸 수 있다. 대신 하루 호출 한도가 있다.
 * 웹 검색은 Google 검색 grounding 을 쓴다 — 한국어 자료 커버리지가 넓다.
 *
 * 브라우저 직접 호출은 별도 헤더 없이 통과한다(2026-08-08 실측 확인).
 */

import {
  CompanyResearchError,
  RESEARCH_SYSTEM_PROMPT,
  buildResearchPrompt,
  isAbortError,
  networkError,
  parseResearchResult,
  readErrorBody,
} from "./research.shared";
import type {
  CompanyResearchResult,
  CompanyResearchTarget,
} from "./research.shared";
import { AI_RESEARCH_FIELDS } from "../model/company.type";
import type { ResearchSource } from "../model/company.type";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * 무료 사용량이 넉넉하고 검색 grounding 을 지원하는 모델.
 * 모델명이 맞지 않으면 API 가 404 와 함께 사유를 돌려주므로 화면에 그대로 드러난다.
 */
const MODEL = "gemini-2.5-flash";

interface GeminiPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: GeminiPart[] };
    groundingMetadata?: {
      groundingChunks?: { web?: { uri?: string; title?: string } }[];
    };
  }[];
}

/**
 * 출처가 없는 항목에 채워 넣을 grounding 링크 개수 상한.
 * 참조한 모든 링크를 항목마다 붙이면 화면이 링크로 뒤덮인다.
 */
const MAX_FALLBACK_SOURCES = 4;

function extractText(data: GeminiResponse): string {
  return (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("");
}

/**
 * 모델이 sources 를 비워 보내면 grounding 이 실제로 참조한 링크로 채운다.
 *
 * uri 는 구글을 거쳐 가는 리다이렉트 주소라 호스트가 전부 같다 —
 * 주소만으로는 라벨을 만들 수 없어 함께 오는 title 을 반드시 챙긴다.
 */
function fallbackSources(data: GeminiResponse): ResearchSource[] {
  const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set<string>();
  const sources: ResearchSource[] = [];

  for (const chunk of chunks) {
    const url = chunk.web?.uri;
    if (!url || seen.has(url)) continue;

    seen.add(url);
    // title 키에 undefined 를 담으면 저장이 거부된다 —
    // stripUndefined 는 배열 안쪽 객체까지 훑지 않는다
    const title = chunk.web?.title;
    sources.push(title ? { url, title } : { url });
    if (sources.length >= MAX_FALLBACK_SOURCES) break;
  }

  return sources;
}

/**
 * 어떤 한도에 걸렸는지 구분해 안내한다.
 *
 * 분당 한도면 잠시 뒤 다시 되지만, 하루 한도면 오늘은 더 못 쓴다 — 사용자가
 * 기다릴지 제공자를 바꿀지 판단하려면 이 둘을 구분해 줘야 한다.
 * 응답의 어느 필드에 담겨 올지 보장되지 않아, 본문 전체에서 단서를 찾는다.
 */
function describeQuotaError(raw: string): string {
  if (/per\s*day|PerDay/i.test(raw)) {
    return "Gemini 무료 하루 한도를 모두 썼습니다. 내일 다시 시도하거나 설정에서 Claude로 바꿔 주세요.";
  }

  if (/per\s*minute|PerMinute/i.test(raw)) {
    const retryAfter = raw.match(/"retryDelay"\s*:\s*"(\d+)s"/)?.[1];
    return retryAfter
      ? `요청이 몰렸습니다. ${retryAfter}초 후 다시 시도해 주세요.`
      : "요청이 몰렸습니다. 잠시 후 다시 시도해 주세요.";
  }

  return "Gemini 무료 사용량을 모두 썼습니다. 잠시 후 또는 내일 다시 시도해 주세요.";
}

export async function researchWithGemini(
  apiKey: string,
  target: CompanyResearchTarget,
  signal?: AbortSignal,
): Promise<CompanyResearchResult> {
  let response: Response;

  try {
    // 키를 URL 에 붙이면 브라우저 기록·리퍼러에 남을 수 있어 헤더로 보낸다
    response = await fetch(`${BASE_URL}/${MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: RESEARCH_SYSTEM_PROMPT }] },
        contents: [
          { role: "user", parts: [{ text: buildResearchPrompt(target) }] },
        ],
        // 검색 grounding 과 JSON 응답 모드는 함께 쓸 수 없어, JSON 은 프롬프트로 요구하고
        // 응답 텍스트에서 직접 파싱한다
        tools: [{ google_search: {} }],
      }),
      signal,
    });
  } catch (cause) {
    // 취소는 실패가 아니므로 네트워크 오류로 바꾸지 않는다
    if (isAbortError(cause)) throw cause;
    throw networkError();
  }

  if (!response.ok) {
    const { message: detail, raw } = await readErrorBody(response);

    if (/API key not valid|API_KEY_INVALID/i.test(detail)) {
      throw new CompanyResearchError(
        "Gemini API 키가 올바르지 않습니다. 설정에서 키를 확인해 주세요.",
        "auth",
      );
    }
    if (response.status === 429 || /quota|rate limit/i.test(raw)) {
      throw new CompanyResearchError(describeQuotaError(raw), "rateLimit");
    }

    throw new CompanyResearchError(
      `조사에 실패했습니다. (HTTP ${response.status}) ${detail}`.trim(),
      "unknown",
    );
  }

  const data = (await response.json()) as GeminiResponse;
  const result = parseResearchResult(extractText(data));

  // 모델이 출처를 안 달아준 항목은 grounding 이 참조한 URL 로 메운다
  const grounded = fallbackSources(data);
  if (grounded.length === 0) return result;

  const sources = { ...result.sources };
  AI_RESEARCH_FIELDS.forEach((field) => {
    if (result[field]?.trim() && !sources[field]?.length) {
      sources[field] = grounded;
    }
  });

  return { ...result, sources };
}
