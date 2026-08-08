import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCompanyAiResearch } from "./useCompanyAiResearch";
import { CompanyResearchError } from "@/entities/company/api/research.api";

const researchCompanyMock = vi.hoisted(() => vi.fn());

vi.mock("@/entities/company/api/research.api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/company/api/research.api")>();
  return { ...actual, researchCompany: researchCompanyMock };
});

const SAMPLE_KEY = "sk-ant-test-key";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("anthropic-api-key", SAMPLE_KEY);
  researchCompanyMock.mockReset();
});

afterEach(() => {
  localStorage.clear();
});

describe("useCompanyAiResearch", () => {
  it("키가 없으면 조사를 호출하지 않아야 한다", async () => {
    localStorage.clear();
    const { result } = renderHook(() => useCompanyAiResearch());

    expect(result.current.hasApiKey).toBe(false);

    await act(async () => {
      await result.current.run({ name: "삼성전자" });
    });

    expect(researchCompanyMock).not.toHaveBeenCalled();
  });

  it("조사에 성공하면 내용이 있는 항목이 기본 선택돼야 한다", async () => {
    researchCompanyMock.mockResolvedValue({
      talentProfile: "도전하는 인재",
      businessSummary: "",
      recentIssues: "신규 공장 착공",
      sources: {},
    });

    const { result } = renderHook(() => useCompanyAiResearch());

    await act(async () => {
      await result.current.run({ name: "삼성전자" });
    });

    // 비어 있는 businessSummary 는 선택 대상이 아니다
    expect(result.current.selectedFields).toEqual([
      "talentProfile",
      "recentIssues",
    ]);
  });

  it("저장된 키를 호출에 실어 보내야 한다", async () => {
    researchCompanyMock.mockResolvedValue({ sources: {} });
    const { result } = renderHook(() => useCompanyAiResearch());

    await act(async () => {
      await result.current.run({ name: "삼성전자", targetJob: "개발자" });
    });

    expect(researchCompanyMock).toHaveBeenCalledWith({
      name: "삼성전자",
      targetJob: "개발자",
      provider: "anthropic",
      apiKey: SAMPLE_KEY,
    });
  });

  it("선택 항목을 토글할 수 있어야 한다", async () => {
    researchCompanyMock.mockResolvedValue({
      talentProfile: "도전하는 인재",
      sources: {},
    });

    const { result } = renderHook(() => useCompanyAiResearch());
    await act(async () => {
      await result.current.run({ name: "삼성전자" });
    });

    act(() => result.current.toggleField("talentProfile"));
    expect(result.current.selectedFields).toEqual([]);

    act(() => result.current.toggleField("talentProfile"));
    expect(result.current.selectedFields).toEqual(["talentProfile"]);
  });

  it("실패하면 사용자용 메시지를 노출하고 결과를 비워야 한다", async () => {
    researchCompanyMock.mockRejectedValue(
      new CompanyResearchError("API 키가 올바르지 않습니다.", "auth"),
    );

    const { result } = renderHook(() => useCompanyAiResearch());

    await act(async () => {
      await result.current.run({ name: "삼성전자" });
    });

    await waitFor(() => {
      expect(result.current.error).toBe("API 키가 올바르지 않습니다.");
    });
    expect(result.current.result).toBeNull();
    expect(result.current.isResearching).toBe(false);
  });

  it("예상치 못한 예외도 사용자용 문구로 바꿔야 한다", async () => {
    researchCompanyMock.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useCompanyAiResearch());

    await act(async () => {
      await result.current.run({ name: "삼성전자" });
    });

    // 내부 오류 메시지가 그대로 노출되지 않는다
    expect(result.current.error).not.toContain("boom");
    expect(result.current.error).toBeTruthy();
  });

  it("dismiss 하면 결과·에러·선택이 모두 초기화돼야 한다", async () => {
    researchCompanyMock.mockResolvedValue({
      talentProfile: "도전하는 인재",
      sources: {},
    });

    const { result } = renderHook(() => useCompanyAiResearch());
    await act(async () => {
      await result.current.run({ name: "삼성전자" });
    });

    act(() => result.current.dismiss());

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.selectedFields).toEqual([]);
  });
});
