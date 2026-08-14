import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractPosting, PostingExtractError } from "./posting.api";

const ANTHROPIC_KEY = "sk-ant-test-key";
const GEMINI_KEY = "AIzaSyExampleKey";
const URL_TARGET = { url: "https://example.com/job/1", companyName: "삼성전자" };

const FULL_RESULT = JSON.stringify({
  jobDescription: "웹 서비스 개발",
  requirements: "경력 3년 이상",
  preferredQualifications: "",
  sources: { jobDescription: ["https://example.com/job/1"] },
});

const EMPTY_RESULT = JSON.stringify({
  jobDescription: "",
  requirements: "",
  preferredQualifications: "",
  sources: {},
});

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

/** Anthropic 정상 응답 한 건 */
function anthropicPayload(
  text: string,
  extraBlocks: Record<string, unknown>[] = [],
  stopReason = "end_turn",
) {
  return {
    content: [...extraBlocks, { type: "text", text }],
    stop_reason: stopReason,
  };
}

/** Gemini 정상 응답 한 건 */
function geminiPayload(text: string, urlMetadata?: Record<string, unknown>[]) {
  return {
    candidates: [
      {
        content: { parts: [{ text }] },
        ...(urlMetadata ? { urlContextMetadata: { urlMetadata } } : {}),
      },
    ],
  };
}

/** 마지막 요청의 body 를 꺼낸다 */
function lastRequestBody(): Record<string, unknown> {
  const [, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("extractPosting — Anthropic", () => {
  it("공고를 읽으면 항목을 채워야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(anthropicPayload(FULL_RESULT)));

    const result = await extractPosting({
      ...URL_TARGET,
      provider: "anthropic",
      apiKey: ANTHROPIC_KEY,
    });

    expect(result.jobDescription).toBe("웹 서비스 개발");
    expect(result.sources.jobDescription).toEqual([
      { url: "https://example.com/job/1" },
    ]);
  });

  it("링크 경로에서는 web_fetch 도구를 선언해야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(anthropicPayload(FULL_RESULT)));

    await extractPosting({
      ...URL_TARGET,
      provider: "anthropic",
      apiKey: ANTHROPIC_KEY,
    });

    const tools = lastRequestBody().tools as { type: string }[];
    expect(tools.map((tool) => tool.type)).toContain("web_fetch_20260209");
  });

  it("붙여넣기 경로에서는 도구를 선언하지 않아야 한다", async () => {
    // 붙여넣은 본문이 정본인데 도구를 주면 불필요한 fetch 로 사용자 비용·시간을 쓴다
    fetchMock.mockResolvedValue(jsonResponse(anthropicPayload(FULL_RESULT)));

    await extractPosting({
      pastedText: "[담당 업무] 웹 서비스 개발\n[자격 요건] 경력 3년 이상",
      provider: "anthropic",
      apiKey: ANTHROPIC_KEY,
    });

    expect(lastRequestBody().tools).toBeUndefined();
  });

  it("페이지를 못 읽어 결과가 비면 fetchBlocked 로 알려야 한다", async () => {
    // 서버 도구 실패는 HTTP 200 본문 안의 error_code 로 온다 — 조용한 빈 결과가 되면 안 된다
    fetchMock.mockResolvedValue(
      jsonResponse(
        anthropicPayload(EMPTY_RESULT, [
          { type: "web_fetch_tool_result", content: { error_code: "unavailable" } },
        ]),
      ),
    );

    await expect(
      extractPosting({ ...URL_TARGET, provider: "anthropic", apiKey: ANTHROPIC_KEY }),
    ).rejects.toMatchObject({ kind: "fetchBlocked" });
  });

  it("붙여넣기 경로에서 결과가 비면 parse 로 알려야 한다", async () => {
    // 붙여넣은 본문에는 fetch 가 없으므로 폴백을 또 권하면 안 된다
    fetchMock.mockResolvedValue(jsonResponse(anthropicPayload(EMPTY_RESULT)));

    await expect(
      extractPosting({
        pastedText: "회사 소개만 잔뜩 적힌 본문",
        provider: "anthropic",
        apiKey: ANTHROPIC_KEY,
      }),
    ).rejects.toMatchObject({ kind: "parse" });
  });

  it("pause_turn 이면 이어서 재요청해야 한다", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(anthropicPayload("", [], "pause_turn")))
      .mockResolvedValueOnce(jsonResponse(anthropicPayload(FULL_RESULT)));

    const result = await extractPosting({
      ...URL_TARGET,
      provider: "anthropic",
      apiKey: ANTHROPIC_KEY,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.jobDescription).toBe("웹 서비스 개발");
  });

  it("401 이면 키 문제로 안내해야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 401));

    await expect(
      extractPosting({ ...URL_TARGET, provider: "anthropic", apiKey: ANTHROPIC_KEY }),
    ).rejects.toMatchObject({ kind: "auth" });
  });

  it("크레딧이 없으면 충전을 안내해야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { message: "Your credit balance is too low" } }, 400),
    );

    await expect(
      extractPosting({ ...URL_TARGET, provider: "anthropic", apiKey: ANTHROPIC_KEY }),
    ).rejects.toMatchObject({ kind: "credit" });
  });
});

const IMAGES = [{ mediaType: "image/png", data: "AAAA" }];

describe("extractPosting — 화면 캡처", () => {
  it("Anthropic 은 이미지 블록을 텍스트 앞에 실어야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(anthropicPayload(FULL_RESULT)));

    await extractPosting({
      images: IMAGES,
      provider: "anthropic",
      apiKey: ANTHROPIC_KEY,
    });

    const body = lastRequestBody();
    const content = (body.messages as { content: { type: string }[] }[])[0].content;

    expect(content[0]).toEqual({
      type: "image",
      source: { type: "base64", media_type: "image/png", data: "AAAA" },
    });
    expect(content[1].type).toBe("text");
    // 캡처가 정본이므로 페이지를 다시 읽으러 가지 않는다
    expect(body.tools).toBeUndefined();
  });

  it("Gemini 는 inlineData 를 텍스트 앞에 실어야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(geminiPayload(FULL_RESULT)));

    await extractPosting({ images: IMAGES, provider: "gemini", apiKey: GEMINI_KEY });

    const body = lastRequestBody();
    const parts = (body.contents as { parts: Record<string, unknown>[] }[])[0].parts;

    expect(parts[0]).toEqual({
      inlineData: { mimeType: "image/png", data: "AAAA" },
    });
    expect(parts[1]).toHaveProperty("text");
    expect(body.tools).toBeUndefined();
  });

  it("캡처에서 아무것도 못 뽑으면 다시 찍으라고 안내해야 한다", async () => {
    // 폴백으로 보낼 곳이 없다 — 링크 실패와 다른 안내가 나가야 한다
    fetchMock.mockResolvedValue(jsonResponse(anthropicPayload(EMPTY_RESULT)));

    await expect(
      extractPosting({ images: IMAGES, provider: "anthropic", apiKey: ANTHROPIC_KEY }),
    ).rejects.toThrowError(/캡처/);
  });

  it("캡처가 여러 장이면 이어지는 화면이라고 알려야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(geminiPayload(FULL_RESULT)));

    await extractPosting({
      images: [...IMAGES, { mediaType: "image/png", data: "BBBB" }],
      provider: "gemini",
      apiKey: GEMINI_KEY,
    });

    const parts = (
      lastRequestBody().contents as { parts: { text?: string }[] }[]
    )[0].parts;
    const prompt = parts.at(-1)?.text ?? "";

    expect(prompt).toContain("2장");
    expect(prompt).toContain("나눠 찍은");
  });
});

describe("extractPosting — Gemini", () => {
  it("공고를 읽으면 항목을 채워야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(geminiPayload(FULL_RESULT)));

    const result = await extractPosting({
      ...URL_TARGET,
      provider: "gemini",
      apiKey: GEMINI_KEY,
    });

    expect(result.requirements).toBe("경력 3년 이상");
  });

  it("링크 경로에서는 url_context 와 검색을 함께 선언해야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(geminiPayload(FULL_RESULT)));

    await extractPosting({ ...URL_TARGET, provider: "gemini", apiKey: GEMINI_KEY });

    const tools = lastRequestBody().tools as Record<string, unknown>[];
    expect(tools.some((tool) => "url_context" in tool)).toBe(true);
    expect(tools.some((tool) => "google_search" in tool)).toBe(true);
  });

  it("붙여넣기 경로에서는 도구를 선언하지 않아야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(geminiPayload(FULL_RESULT)));

    await extractPosting({
      pastedText: "[담당 업무] 웹 서비스 개발\n[자격 요건] 경력 3년 이상",
      provider: "gemini",
      apiKey: GEMINI_KEY,
    });

    expect(lastRequestBody().tools).toBeUndefined();
  });

  it("URL 조회가 모두 실패하면 내용이 있어도 fetchBlocked 로 알려야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        geminiPayload(FULL_RESULT, [
          {
            retrievedUrl: "https://example.com/job/1",
            urlRetrievalStatus: "URL_RETRIEVAL_STATUS_ERROR",
          },
        ]),
      ),
    );

    await expect(
      extractPosting({ ...URL_TARGET, provider: "gemini", apiKey: GEMINI_KEY }),
    ).rejects.toMatchObject({ kind: "fetchBlocked" });
  });

  it("URL 조회가 성공했으면 결과를 그대로 돌려줘야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        geminiPayload(FULL_RESULT, [
          {
            retrievedUrl: "https://example.com/job/1",
            urlRetrievalStatus: "URL_RETRIEVAL_STATUS_SUCCESS",
          },
        ]),
      ),
    );

    const result = await extractPosting({
      ...URL_TARGET,
      provider: "gemini",
      apiKey: GEMINI_KEY,
    });

    expect(result.jobDescription).toBe("웹 서비스 개발");
  });

  it("하루 한도를 넘기면 내일 다시 하라고 안내해야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { message: "Quota exceeded", details: [{ quotaId: "PerDay" }] } },
        429,
      ),
    );

    await expect(
      extractPosting({ ...URL_TARGET, provider: "gemini", apiKey: GEMINI_KEY }),
    ).rejects.toThrowError(/내일/);
  });

  it("네트워크가 끊기면 network 로 알려야 한다", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      extractPosting({ ...URL_TARGET, provider: "gemini", apiKey: GEMINI_KEY }),
    ).rejects.toMatchObject({ kind: "network" });
  });

  it("취소는 실패로 바꾸지 않아야 한다", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    fetchMock.mockRejectedValue(abortError);

    await expect(
      extractPosting({ ...URL_TARGET, provider: "gemini", apiKey: GEMINI_KEY }),
    ).rejects.not.toBeInstanceOf(PostingExtractError);
  });
});
