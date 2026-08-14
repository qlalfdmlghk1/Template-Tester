/**
 * Google Gemini 기반 공고 추출.
 *
 * 브라우저가 공고 URL 을 직접 가져오면 CORS 로 막히므로, Google 서버가 대신 가져오는
 * `url_context` 도구를 쓴다. 검색 grounding 과 함께 선언할 수 있어, 링크로 못 찾으면
 * 검색으로 메운다.
 *
 * 무료 사용량이 있어 크레딧 충전 없이 쓸 수 있다. 대신 하루 호출 한도가 있다.
 * 브라우저 직접 호출은 별도 헤더 없이 통과한다(기업 조사에서 2026-08-08 실측 확인).
 */

import {
  PostingExtractError,
  POSTING_SYSTEM_PROMPT,
  buildPostingPrompt,
  emptySourceError,
  fetchBlockedError,
  isAbortError,
  isEmptyResult,
  logPostingDiagnostics,
  needsFetchTools,
  networkError,
  parsePostingResult,
  readErrorBody,
} from "./posting.shared";
import type {
  PostingExtractResult,
  PostingExtractTarget,
} from "./posting.shared";
import { POSTING_FIELDS } from "../model/application.type";
import type { ResearchSource } from "@/shared/model/aiSource";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/** 무료 사용량이 넉넉하고 url_context·검색 grounding 을 지원하는 모델 */
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
    /** url_context 도구의 URL 별 조회 결과 */
    urlContextMetadata?: {
      urlMetadata?: { retrievedUrl?: string; urlRetrievalStatus?: string }[];
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
 * 공고 페이지를 못 가져왔는가.
 *
 * ⚠️ 이건 **보조 신호**다. url_context 결과 메타데이터의 필드명이 API 버전에 따라
 * 다를 수 있어(`urlContextMetadata` / `url_context_result`) 형태가 어긋나면 조용히
 * false 를 준다. 페이지를 못 읽었는지에 대한 **1차 판정은 `isEmptyResult`** 이며,
 * 이 함수는 거기에 얹어 원인을 더 정확히 짚는 용도다.
 */
function hasFetchFailure(data: GeminiResponse): boolean {
  const entries = data.candidates?.[0]?.urlContextMetadata?.urlMetadata ?? [];
  if (entries.length === 0) return false;

  return entries.every((entry) => {
    const status = entry.urlRetrievalStatus;
    return typeof status === "string" && !/SUCCESS$/i.test(status);
  });
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

/**
 * 사용자 턴 parts — 캡처가 있으면 이미지를 앞에 싣는다.
 * 이미지를 텍스트보다 앞에 두는 편이 인식률이 좋다.
 */
function buildUserParts(target: PostingExtractTarget): unknown[] {
  const text = buildPostingPrompt(target);
  if (!target.images?.length) return [{ text }];

  return [
    ...target.images.map((image) => ({
      inlineData: { mimeType: image.mediaType, data: image.data },
    })),
    { text },
  ];
}

export async function extractWithGemini(
  apiKey: string,
  target: PostingExtractTarget,
  signal?: AbortSignal,
): Promise<PostingExtractResult> {
  const useTools = needsFetchTools(target);
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
        systemInstruction: { parts: [{ text: POSTING_SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: buildUserParts(target) }],
        // 캡처나 붙여넣은 본문이 정본인 경우에는 도구를 아예 주지 않는다.
        // url_context 와 google_search 는 같은 요청에 함께 선언할 수 있다.
        // 검색 grounding 과 JSON 응답 모드는 함께 쓸 수 없어, JSON 은 프롬프트로 요구하고
        // 응답 텍스트에서 직접 파싱한다.
        ...(useTools ? { tools: [{ url_context: {} }, { google_search: {} }] } : {}),
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
      throw new PostingExtractError(
        "Gemini API 키가 올바르지 않습니다. 설정에서 키를 확인해 주세요.",
        "auth",
      );
    }
    if (response.status === 429 || /quota|rate limit/i.test(raw)) {
      throw new PostingExtractError(describeQuotaError(raw), "rateLimit");
    }

    throw new PostingExtractError(
      `공고를 불러오지 못했습니다. (HTTP ${response.status}) ${detail}`.trim(),
      "unknown",
    );
  }

  const data = (await response.json()) as GeminiResponse;

  // 왜 실패했는지는 응답을 봐야 갈린다 — 도구가 안 돈 것과, 돌았지만 페이지가
  // 스크립트로 그려져 본문이 비어 있던 것은 화면에서 똑같이 "못 읽었습니다"로 보인다.
  // 응답 본문에는 키가 들어 있지 않다.
  logPostingDiagnostics("gemini", {
    // urlContext 가 undefined 인데 candidateKeys 에 비슷한 이름이 보이면 필드명이 다른 것이고,
    // 아무것도 없으면 도구가 돌지 않은 것이다
    candidateKeys: Object.keys(data.candidates?.[0] ?? {}),
    urlContext: data.candidates?.[0]?.urlContextMetadata,
    groundingCount:
      data.candidates?.[0]?.groundingMetadata?.groundingChunks?.length ?? 0,
    textLength: extractText(data).length,
  });

  const result = parsePostingResult(extractText(data));

  // 페이지를 못 읽어 전 항목이 빈 경우 — 성공으로 흘려보내지 않고 폴백으로 보낸다
  if (isEmptyResult(result) || (useTools && hasFetchFailure(data))) {
    throw useTools ? fetchBlockedError() : emptySourceError(target);
  }

  // 모델이 출처를 안 달아준 항목은 grounding 이 참조한 URL 로 메운다
  const grounded = fallbackSources(data);
  if (grounded.length === 0) return result;

  const sources = { ...result.sources };
  POSTING_FIELDS.forEach((field) => {
    if (result[field]?.trim() && !sources[field]?.length) {
      sources[field] = grounded;
    }
  });

  return { ...result, sources };
}
