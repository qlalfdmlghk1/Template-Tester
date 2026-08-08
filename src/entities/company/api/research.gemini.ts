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
  networkError,
  parseResearchResult,
  readErrorMessage,
} from "./research.shared";
import type {
  CompanyResearchResult,
  CompanyResearchTarget,
} from "./research.shared";
import { AI_RESEARCH_FIELDS } from "../model/company.type";

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
      groundingChunks?: { web?: { uri?: string } }[];
    };
  }[];
}

function extractText(data: GeminiResponse): string {
  return (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("");
}

/** 모델이 sources 를 비워 보내면 grounding 이 실제로 참조한 URL 로 채운다 */
function fallbackSources(data: GeminiResponse): string[] {
  const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

  return [
    ...new Set(
      chunks
        .map((chunk) => chunk.web?.uri)
        .filter((uri): uri is string => Boolean(uri)),
    ),
  ];
}

export async function researchWithGemini(
  apiKey: string,
  target: CompanyResearchTarget,
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
    });
  } catch {
    throw networkError();
  }

  if (!response.ok) {
    const detail = await readErrorMessage(response);

    if (/API key not valid|API_KEY_INVALID/i.test(detail)) {
      throw new CompanyResearchError(
        "Gemini API 키가 올바르지 않습니다. 설정에서 키를 확인해 주세요.",
        "auth",
      );
    }
    if (response.status === 429 || /quota|rate limit/i.test(detail)) {
      throw new CompanyResearchError(
        "Gemini 무료 사용량을 모두 썼습니다. 잠시 후 또는 내일 다시 시도해 주세요.",
        "rateLimit",
      );
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
