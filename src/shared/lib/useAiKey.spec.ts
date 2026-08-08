import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAiKey, maskApiKey, looksLikeApiKey } from "./useAiKey";

const STORAGE_KEY = "anthropic-api-key";
const SAMPLE_KEY = "sk-ant-api03-abcdefghijklmnop1234";
const GEMINI_KEY = "AIzaSyExampleGeminiKey1234";

beforeEach(() => {
  localStorage.clear();
});

describe("maskApiKey", () => {
  it("앞 8자와 끝 4자만 남기고 가려야 한다", () => {
    expect(maskApiKey(SAMPLE_KEY)).toBe("sk-ant-a••••••••1234");
  });

  it("짧은 값은 전부 가려야 한다", () => {
    expect(maskApiKey("short")).toBe("•••••");
  });

  it("가린 결과에 원문 중간부가 남지 않아야 한다", () => {
    expect(maskApiKey(SAMPLE_KEY)).not.toContain("defghijklmnop");
  });
});

describe("looksLikeApiKey", () => {
  it("Anthropic 은 sk-ant- 로 시작해야 통과한다", () => {
    expect(looksLikeApiKey(SAMPLE_KEY, "anthropic")).toBe(true);
    expect(looksLikeApiKey(`  ${SAMPLE_KEY}  `, "anthropic")).toBe(true);
    expect(looksLikeApiKey("sk-proj-openai-key", "anthropic")).toBe(false);
  });

  it("Gemini 는 고정 접두사가 없어 비어 있지만 않으면 통과한다", () => {
    expect(looksLikeApiKey("AIzaSyExample", "gemini")).toBe(true);
    expect(looksLikeApiKey("", "gemini")).toBe(false);
  });
});

describe("useAiKey — 제공자 선택", () => {
  it("아무 키도 없으면 충전이 필요 없는 Gemini 를 기본으로 해야 한다", () => {
    const { result } = renderHook(() => useAiKey());

    expect(result.current.provider).toBe("gemini");
  });

  it("Anthropic 키가 이미 있으면 그 선택을 유지해야 한다", () => {
    // 제공자 선택 기능이 생기기 전부터 키를 넣어둔 사용자
    localStorage.setItem(STORAGE_KEY, SAMPLE_KEY);
    const { result } = renderHook(() => useAiKey());

    expect(result.current.provider).toBe("anthropic");
    expect(result.current.apiKey).toBe(SAMPLE_KEY);
  });

  it("선택한 제공자를 저장해 다음에도 유지해야 한다", () => {
    const { result } = renderHook(() => useAiKey());

    act(() => result.current.setProvider("anthropic"));

    expect(localStorage.getItem("ai-provider")).toBe("anthropic");
    expect(renderHook(() => useAiKey()).result.current.provider).toBe("anthropic");
  });
});

describe("useAiKey — 키 보관", () => {
  it("저장된 키가 없으면 hasApiKey 가 false 여야 한다", () => {
    const { result } = renderHook(() => useAiKey());

    expect(result.current.apiKey).toBeNull();
    expect(result.current.hasApiKey).toBe(false);
    expect(result.current.maskedApiKey).toBeNull();
  });

  it("현재 제공자의 저장소에 저장하고 상태를 갱신해야 한다", () => {
    const { result } = renderHook(() => useAiKey());

    act(() => result.current.setProvider("anthropic"));
    act(() => result.current.saveApiKey(SAMPLE_KEY));

    expect(localStorage.getItem(STORAGE_KEY)).toBe(SAMPLE_KEY);
    expect(result.current.hasApiKey).toBe(true);
    expect(result.current.maskedApiKey).toBe("sk-ant-a••••••••1234");
  });

  it("앞뒤 공백을 제거하고 저장해야 한다", () => {
    const { result } = renderHook(() => useAiKey());

    act(() => result.current.saveApiKey(`  ${GEMINI_KEY}\n`));

    expect(localStorage.getItem("gemini-api-key")).toBe(GEMINI_KEY);
  });

  it("제공자별로 키를 따로 보관해 오가도 다시 입력하지 않아야 한다", () => {
    const { result } = renderHook(() => useAiKey());

    act(() => result.current.saveApiKey(GEMINI_KEY));
    act(() => result.current.setProvider("anthropic"));
    act(() => result.current.saveApiKey(SAMPLE_KEY));

    expect(result.current.apiKey).toBe(SAMPLE_KEY);

    act(() => result.current.setProvider("gemini"));
    expect(result.current.apiKey).toBe(GEMINI_KEY);
  });

  it("삭제는 현재 제공자의 키만 지워야 한다", () => {
    localStorage.setItem(STORAGE_KEY, SAMPLE_KEY);
    localStorage.setItem("gemini-api-key", GEMINI_KEY);
    const { result } = renderHook(() => useAiKey());

    act(() => result.current.setProvider("anthropic"));
    act(() => result.current.clearApiKey());

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    // 다른 제공자 키는 남아 있어야 한다
    expect(localStorage.getItem("gemini-api-key")).toBe(GEMINI_KEY);
  });

  it("hasKeyFor 로 다른 제공자의 키 보유 여부를 알 수 있어야 한다", () => {
    localStorage.setItem("gemini-api-key", GEMINI_KEY);
    const { result } = renderHook(() => useAiKey());

    expect(result.current.hasKeyFor("gemini")).toBe(true);
    expect(result.current.hasKeyFor("anthropic")).toBe(false);
  });

  it("같은 탭의 다른 인스턴스에도 변경이 전파돼야 한다", () => {
    const a = renderHook(() => useAiKey());
    const b = renderHook(() => useAiKey());

    act(() => a.result.current.saveApiKey(GEMINI_KEY));

    expect(b.result.current.hasApiKey).toBe(true);
  });
});
