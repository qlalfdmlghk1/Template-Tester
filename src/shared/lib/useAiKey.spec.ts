import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAiKey, maskApiKey, looksLikeApiKey } from "./useAiKey";

const STORAGE_KEY = "anthropic-api-key";
const SAMPLE_KEY = "sk-ant-api03-abcdefghijklmnop1234";

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
  it("sk-ant- 로 시작하면 통과해야 한다", () => {
    expect(looksLikeApiKey(SAMPLE_KEY)).toBe(true);
    expect(looksLikeApiKey(`  ${SAMPLE_KEY}  `)).toBe(true);
  });

  it("다른 형식은 걸러야 한다", () => {
    expect(looksLikeApiKey("sk-proj-openai-key")).toBe(false);
    expect(looksLikeApiKey("")).toBe(false);
  });
});

describe("useAiKey", () => {
  it("저장된 키가 없으면 hasApiKey 가 false 여야 한다", () => {
    const { result } = renderHook(() => useAiKey());

    expect(result.current.apiKey).toBeNull();
    expect(result.current.hasApiKey).toBe(false);
    expect(result.current.maskedApiKey).toBeNull();
  });

  it("저장하면 localStorage 에 반영되고 상태가 갱신돼야 한다", () => {
    const { result } = renderHook(() => useAiKey());

    act(() => result.current.saveApiKey(SAMPLE_KEY));

    expect(localStorage.getItem(STORAGE_KEY)).toBe(SAMPLE_KEY);
    expect(result.current.hasApiKey).toBe(true);
    expect(result.current.maskedApiKey).toBe("sk-ant-a••••••••1234");
  });

  it("앞뒤 공백을 제거하고 저장해야 한다", () => {
    const { result } = renderHook(() => useAiKey());

    act(() => result.current.saveApiKey(`  ${SAMPLE_KEY}\n`));

    expect(localStorage.getItem(STORAGE_KEY)).toBe(SAMPLE_KEY);
  });

  it("삭제하면 localStorage 에서 지워져야 한다", () => {
    localStorage.setItem(STORAGE_KEY, SAMPLE_KEY);
    const { result } = renderHook(() => useAiKey());

    act(() => result.current.clearApiKey());

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(result.current.hasApiKey).toBe(false);
  });

  it("같은 탭의 다른 인스턴스에도 변경이 전파돼야 한다", () => {
    const a = renderHook(() => useAiKey());
    const b = renderHook(() => useAiKey());

    act(() => a.result.current.saveApiKey(SAMPLE_KEY));

    expect(b.result.current.hasApiKey).toBe(true);
  });
});
