import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { researchCompany } from "./research.api";

const API_KEY = "AIzaSyExampleKey";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

/** Gemini 정상 응답 한 건 */
function geminiPayload(
  text: string,
  grounding: { uri: string; title?: string }[] = [],
) {
  return {
    candidates: [
      {
        content: { parts: [{ text }] },
        groundingMetadata: {
          groundingChunks: grounding.map((web) => ({ web })),
        },
      },
    ],
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Gemini 조사 — 요청 형식", () => {
  it("키를 URL 이 아니라 헤더로 보내야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(geminiPayload('{"businessSummary":"반도체","sources":{}}')),
    );

    await researchCompany({ provider: "gemini", apiKey: API_KEY, name: "삼성전자" });

    const [url, init] = fetchMock.mock.calls[0];
    // URL 에 키를 붙이면 브라우저 기록·리퍼러에 남는다
    expect(url).not.toContain(API_KEY);
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe(API_KEY);
  });

  it("Google 검색 grounding 도구를 선언해야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(geminiPayload('{"businessSummary":"반도체","sources":{}}')),
    );

    await researchCompany({ provider: "gemini", apiKey: API_KEY, name: "삼성전자" });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.tools[0]).toHaveProperty("google_search");
    expect(body.systemInstruction.parts[0].text).toContain("조사원");
  });
});

describe("Gemini 조사 — 응답 처리", () => {
  it("결과를 파싱해 돌려줘야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        geminiPayload(
          '{"talentProfile":"도전하는 인재","sources":{"talentProfile":["https://a.com"]}}',
        ),
      ),
    );

    const result = await researchCompany({
      provider: "gemini",
      apiKey: API_KEY,
      name: "삼성전자",
    });

    expect(result.talentProfile).toBe("도전하는 인재");
    expect(result.sources.talentProfile).toEqual([{ url: "https://a.com" }]);
  });

  it("모델이 출처를 안 주면 grounding 이 참조한 URL 로 메워야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        geminiPayload('{"businessSummary":"반도체","sources":{}}', [
          { uri: "https://grounded.example/1", title: "출처 제목 1" },
          { uri: "https://grounded.example/2" },
        ]),
      ),
    );

    const result = await researchCompany({
      provider: "gemini",
      apiKey: API_KEY,
      name: "삼성전자",
    });

    // 제목이 함께 저장돼야 화면에서 링크를 구분할 수 있다.
    // 제목이 없으면 키를 만들지 않는다 — undefined 가 섞이면 Firestore 저장이 거부된다
    expect(result.sources.businessSummary).toEqual([
      { url: "https://grounded.example/1", title: "출처 제목 1" },
      { url: "https://grounded.example/2" },
    ]);
    expect(result.sources.businessSummary?.[1]).not.toHaveProperty("title");
  });

  it("내용이 없는 항목에는 출처를 붙이지 않아야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        geminiPayload('{"businessSummary":"반도체","sources":{}}', [
          { uri: "https://grounded.example/1" },
        ]),
      ),
    );

    const result = await researchCompany({
      provider: "gemini",
      apiKey: API_KEY,
      name: "삼성전자",
    });

    expect(result.sources.talentProfile).toBeUndefined();
  });

  it("JSON 앞뒤에 설명이 붙어도 파싱해야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        geminiPayload(
          '조사 결과입니다.\n{"businessSummary":"반도체","sources":{}}\n확인해 주세요.',
        ),
      ),
    );

    const result = await researchCompany({
      provider: "gemini",
      apiKey: API_KEY,
      name: "삼성전자",
    });

    expect(result.businessSummary).toBe("반도체");
  });
});

describe("Gemini 조사 — 에러 처리", () => {
  it("키가 잘못되면 키 문제로 구분해야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { message: "API key not valid. Please pass a valid API key." } },
        400,
      ),
    );

    await expect(
      researchCompany({ provider: "gemini", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toMatchObject({ kind: "auth" });
  });

  it("무료 한도 초과는 사용량 문제로 구분해야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { message: "Quota exceeded for quota metric" } }, 429),
    );

    await expect(
      researchCompany({ provider: "gemini", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toMatchObject({ kind: "rateLimit" });
  });

  it("하루 한도면 오늘은 더 못 쓴다고 알려야 한다", async () => {
    // 기다려도 소용없으므로 제공자 전환을 안내한다
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            message: "Quota exceeded",
            details: [
              {
                violations: [
                  { quotaId: "GenerateRequestsPerDayPerProjectPerModel" },
                ],
              },
            ],
          },
        },
        429,
      ),
    );

    await expect(
      researchCompany({ provider: "gemini", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toMatchObject({
      kind: "rateLimit",
      message: expect.stringContaining("하루 한도"),
    });
  });

  it("분당 한도면 재시도 대기 시간을 알려야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          error: {
            message: "Quota exceeded",
            details: [
              {
                violations: [
                  { quotaId: "GenerateRequestsPerMinutePerProjectPerModel" },
                ],
              },
              { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "39s" },
            ],
          },
        },
        429,
      ),
    );

    await expect(
      researchCompany({ provider: "gemini", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toMatchObject({
      kind: "rateLimit",
      message: expect.stringContaining("39초"),
    });
  });

  it("한도 종류를 알 수 없으면 두 경우를 모두 안내해야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: { message: "RESOURCE_EXHAUSTED: quota" } }, 429),
    );

    await expect(
      researchCompany({ provider: "gemini", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("잠시 후 또는 내일"),
    });
  });

  it("그 외 실패는 응답 본문의 원인을 담아야 한다", async () => {
    // 모델명이 바뀐 경우 등 — 상태 코드만으로는 원인을 알 수 없다
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { message: "models/gemini-x is not found for API version v1beta" } },
        404,
      ),
    );

    await expect(
      researchCompany({ provider: "gemini", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toThrow(/is not found/);
  });
});
