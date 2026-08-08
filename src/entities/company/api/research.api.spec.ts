import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { researchCompany, CompanyResearchError } from "./research.api";

const API_KEY = "sk-ant-test-key";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

/** 정상 조사 응답 한 건 */
function researchPayload() {
  return {
    stop_reason: "end_turn",
    content: [
      {
        type: "text",
        text: JSON.stringify({
          talentProfile: "도전하는 인재",
          businessSummary: "반도체 제조",
          recentIssues: "신규 공장 착공",
          sources: { talentProfile: ["https://example.com/values"] },
        }),
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

describe("researchCompany — 요청 형식", () => {
  it("브라우저 직접 호출 허용 헤더를 반드시 보내야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(researchPayload()));

    await researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" });

    const [, init] = fetchMock.mock.calls[0];
    const headers = init.headers as Record<string, string>;
    // 이 헤더가 빠지면 CORS 로 차단된다
    expect(headers["anthropic-dangerous-direct-browser-access"]).toBe("true");
    expect(headers["x-api-key"]).toBe(API_KEY);
  });

  it("웹 검색 도구를 검색 횟수 상한과 함께 선언해야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(researchPayload()));

    await researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.tools[0].type).toBe("web_search_20260209");
    expect(body.tools[0].max_uses).toBeGreaterThan(0);
  });

  it("동명 기업 구분 단서를 프롬프트에 담아야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(researchPayload()));

    await researchCompany({
      provider: "anthropic",
      apiKey: API_KEY,
      name: "한화",
      targetJob: "프론트엔드 개발자",
      location: "판교",
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages[0].content).toContain("한화");
    expect(body.messages[0].content).toContain("프론트엔드 개발자");
    expect(body.messages[0].content).toContain("판교");
  });
});

describe("researchCompany — 응답 처리", () => {
  it("조사 결과를 파싱해 돌려줘야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(researchPayload()));

    const result = await researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" });

    expect(result.talentProfile).toBe("도전하는 인재");
    expect(result.sources.talentProfile).toEqual(["https://example.com/values"]);
  });

  it("도구 결과 블록이 섞여 있어도 text 블록만 골라 파싱해야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        stop_reason: "end_turn",
        content: [
          { type: "server_tool_use", name: "web_search" },
          { type: "web_search_tool_result", content: [{ url: "https://x" }] },
          { type: "text", text: '{"businessSummary":"반도체","sources":{}}' },
        ],
      }),
    );

    const result = await researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" });

    expect(result.businessSummary).toBe("반도체");
  });

  it("코드펜스로 감싸인 JSON도 파싱해야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        stop_reason: "end_turn",
        content: [
          {
            type: "text",
            text: '```json\n{"businessSummary":"반도체","sources":{}}\n```',
          },
        ],
      }),
    );

    const result = await researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" });

    expect(result.businessSummary).toBe("반도체");
  });

  it("sources 가 없으면 빈 객체로 채워야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        stop_reason: "end_turn",
        content: [{ type: "text", text: '{"businessSummary":"반도체"}' }],
      }),
    );

    const result = await researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" });

    expect(result.sources).toEqual({});
  });
});

describe("researchCompany — pause_turn 재개", () => {
  it("pause_turn 이면 assistant 응답을 이어붙여 재요청해야 한다", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          stop_reason: "pause_turn",
          content: [{ type: "server_tool_use", name: "web_search" }],
        }),
      )
      .mockResolvedValueOnce(jsonResponse(researchPayload()));

    const result = await researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(secondBody.messages).toHaveLength(2);
    expect(secondBody.messages[1].role).toBe("assistant");
    expect(result.talentProfile).toBe("도전하는 인재");
  });

  it("계속 pause_turn 이면 상한에서 멈추고 에러를 던져야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ stop_reason: "pause_turn", content: [] }),
    );

    await expect(
      researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toBeInstanceOf(CompanyResearchError);

    // 무한 반복하지 않는다
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(4);
  });
});

describe("researchCompany — 에러 처리", () => {
  it("401 이면 키 문제로 구분해야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 401));

    await expect(
      researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toMatchObject({ kind: "auth" });
  });

  it("429 면 재시도 안내로 구분해야 한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 429));

    await expect(
      researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toMatchObject({ kind: "rateLimit" });
  });

  it("크레딧 부족은 영어 원문 대신 안내 문구로 바꿔야 한다", async () => {
    // 키 발급 후 충전을 안 한 상태가 가장 흔한 실패다
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          type: "error",
          error: {
            type: "invalid_request_error",
            message:
              "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.",
          },
        },
        400,
      ),
    );

    await expect(
      researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toMatchObject({
      kind: "credit",
      message: expect.stringContaining("크레딧"),
    });
  });

  it("400 이면 응답 본문의 원인을 메시지에 담아야 한다", async () => {
    // 상태 코드만 보여주면 무엇이 잘못됐는지 알 수 없다
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          type: "error",
          error: {
            type: "invalid_request_error",
            message: "tools.0.type: unexpected value",
          },
        },
        400,
      ),
    );

    await expect(
      researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toThrow(/tools\.0\.type: unexpected value/);
  });

  it("에러 본문을 읽지 못해도 상태 코드는 알려줘야 한다", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as Response);

    await expect(
      researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toThrow(/HTTP 500/);
  });

  it("네트워크 실패를 구분해야 한다", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(
      researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toMatchObject({ kind: "network" });
  });

  it("JSON 이 아니면 파싱 실패로 구분해야 한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        stop_reason: "end_turn",
        content: [{ type: "text", text: "조사 결과를 찾지 못했습니다." }],
      }),
    );

    await expect(
      researchCompany({ provider: "anthropic", apiKey: API_KEY, name: "삼성전자" }),
    ).rejects.toMatchObject({ kind: "parse" });
  });
});
