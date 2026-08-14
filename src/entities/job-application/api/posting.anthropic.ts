/**
 * Anthropic(Claude) 기반 공고 추출.
 *
 * 브라우저가 공고 URL 을 직접 가져오면 CORS 로 막히므로, Anthropic 서버가 대신
 * 가져오는 `web_fetch` 도구를 쓴다. 이 도구는 **대화에 이미 등장한 URL 만** 가져오는데,
 * 공고 링크는 사용자가 입력해 프롬프트에 실리므로 조건을 충족한다.
 *
 * 브라우저 직접 호출에는 전용 허용 헤더가 필요하다(기업 조사에서 2026-08-08 실측 확인).
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
  truncatedError,
} from "./posting.shared";
import type {
  PostingExtractResult,
  PostingExtractTarget,
} from "./posting.shared";

const API_URL = "https://api.anthropic.com/v1/messages";

/** 서버 도구는 Haiku 계열에서 지원되지 않아 Sonnet 을 쓴다 */
const MODEL = "claude-sonnet-5";

/** 공고 한 건을 읽는 데 필요한 만큼만 — 사용자 비용이 예상 밖으로 늘지 않게 막는다 */
const MAX_FETCH_USES = 3;

/** 공고를 링크로 못 찾았을 때만 쓰는 보조 검색 */
const MAX_SEARCH_USES = 3;

/** pause_turn 재개 상한 — 서버 도구 루프가 끝나지 않을 때 무한 반복을 막는다 */
const MAX_RESUMES = 3;

const MAX_TOKENS = 4096;

interface AnthropicContentBlock {
  type: string;
  text?: string;
  /** 서버 도구 결과 — 성공이면 결과 객체/배열, 실패면 error_code 를 담은 객체 */
  content?: unknown;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
  stop_reason?: string;
}

/**
 * 도구 사용 블록이 섞여 오므로 text 블록만 골라 이어붙인다.
 * (web_fetch_tool_result 등은 JSON 이 아니다)
 */
function extractText(content: AnthropicContentBlock[]): string {
  return content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("");
}

/**
 * 공고 페이지를 못 가져왔는가.
 *
 * 서버 도구 실패는 HTTP 200 본문 안에 error_code 를 담은 객체로 온다 — 예외가 아니라서
 * 검사하지 않으면 "빈 결과"로 조용히 흘러가고 사용자는 이유를 모른다.
 */
function hasFetchFailure(content: AnthropicContentBlock[]): boolean {
  return content.some(
    (block) =>
      block.type === "web_fetch_tool_result" &&
      typeof block.content === "object" &&
      block.content !== null &&
      !Array.isArray(block.content) &&
      "error_code" in (block.content as Record<string, unknown>),
  );
}

async function callApi(
  apiKey: string,
  messages: unknown[],
  useTools: boolean,
  signal?: AbortSignal,
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
        system: POSTING_SYSTEM_PROMPT,
        messages,
        // 붙여넣은 본문이 정본인 경우에는 도구를 아예 주지 않는다 —
        // 필요 없는 fetch 로 사용자 비용과 시간을 쓰지 않게 한다.
        ...(useTools
          ? {
              tools: [
                {
                  type: "web_fetch_20260209",
                  name: "web_fetch",
                  max_uses: MAX_FETCH_USES,
                  citations: { enabled: true },
                },
                {
                  type: "web_search_20260209",
                  name: "web_search",
                  max_uses: MAX_SEARCH_USES,
                },
              ],
            }
          : {}),
      }),
      signal,
    });
  } catch (cause) {
    // 취소는 실패가 아니므로 네트워크 오류로 바꾸지 않는다
    if (isAbortError(cause)) throw cause;
    throw networkError();
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new PostingExtractError(
        "Claude API 키가 올바르지 않습니다. 설정에서 키를 확인해 주세요.",
        "auth",
      );
    }
    if (response.status === 429) {
      throw new PostingExtractError(
        "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.",
        "rateLimit",
      );
    }

    const { message: detail } = await readErrorBody(response);

    // 키를 발급만 하고 충전을 안 한 상태가 가장 흔한 실패다
    if (/credit balance/i.test(detail)) {
      throw new PostingExtractError(
        "Anthropic 계정에 크레딧이 없습니다. 콘솔의 Plans & Billing에서 충전한 뒤 다시 시도해 주세요.",
        "credit",
      );
    }

    throw new PostingExtractError(
      `공고를 불러오지 못했습니다. (HTTP ${response.status}) ${detail}`.trim(),
      "unknown",
    );
  }

  return (await response.json()) as AnthropicResponse;
}

/**
 * 사용자 턴 내용 — 캡처가 있으면 이미지 블록을 앞에 싣는다.
 * 이미지를 텍스트보다 앞에 두는 편이 인식률이 좋다.
 */
function buildUserContent(target: PostingExtractTarget): unknown {
  const prompt = buildPostingPrompt(target);
  if (!target.images?.length) return prompt;

  return [
    ...target.images.map((image) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: image.mediaType,
        data: image.data,
      },
    })),
    { type: "text", text: prompt },
  ];
}

export async function extractWithAnthropic(
  apiKey: string,
  target: PostingExtractTarget,
  signal?: AbortSignal,
): Promise<PostingExtractResult> {
  const useTools = needsFetchTools(target);
  const messages: unknown[] = [
    { role: "user", content: buildUserContent(target) },
  ];

  // 도구 루프가 여러 턴에 걸치므로 fetch 실패 신호를 턴 사이에 누적한다
  let sawFetchFailure = false;

  for (let attempt = 0; attempt <= MAX_RESUMES; attempt += 1) {
    const data = await callApi(apiKey, messages, useTools, signal);

    sawFetchFailure = sawFetchFailure || hasFetchFailure(data.content);

    logPostingDiagnostics("anthropic", {
      blockTypes: data.content.map((block) => block.type),
      sawFetchFailure,
      stopReason: data.stop_reason,
    });

    // 서버 측 도구 루프가 한도에 걸린 것 — 그대로 이어붙여 재요청하면 이어서 진행된다
    if (data.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: data.content });
      continue;
    }

    // 출력 상한에 걸려 JSON 이 잘린 경우. 재시도해도 같은 지점에서 잘리므로
    // 파싱을 시도하지 않고 자료를 줄이라고 안내한다.
    if (data.stop_reason === "max_tokens") {
      throw truncatedError();
    }

    const result = parsePostingResult(extractText(data.content));

    // 페이지를 못 읽어 전 항목이 빈 경우 — 성공으로 흘려보내지 않고 폴백으로 보낸다
    if (isEmptyResult(result)) {
      throw useTools ? fetchBlockedError() : emptySourceError(target);
    }

    // 내용은 건졌지만 fetch 가 막혔다면 검색 결과로 메운 것이라 정확도가 떨어질 수 있다.
    // 결과는 그대로 돌려주고 판단은 사용자에게 맡긴다 (출처 링크로 확인 가능).
    return result;
  }

  throw sawFetchFailure
    ? fetchBlockedError()
    : new PostingExtractError(
        "공고 분석이 예상보다 길어져 중단했습니다. 다시 시도해 주세요.",
        "unknown",
      );
}
