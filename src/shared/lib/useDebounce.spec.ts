import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./useDebounce";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebounce", () => {
  it("처음에는 값을 그대로 돌려줘야 한다", () => {
    const { result } = renderHook(() => useDebounce("삼성", 300));

    expect(result.current).toBe("삼성");
  });

  it("지연 시간이 지나야 새 값을 반영해야 한다", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "삼" },
    });

    rerender({ value: "삼성" });
    expect(result.current).toBe("삼");

    act(() => void vi.advanceTimersByTime(300));
    expect(result.current).toBe("삼성");
  });

  it("연속 입력 중에는 반영하지 않고 마지막 값만 넘겨야 한다", () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: "" },
    });

    // 한 글자씩 빠르게 치는 상황
    rerender({ value: "삼" });
    act(() => void vi.advanceTimersByTime(200));
    rerender({ value: "삼성" });
    act(() => void vi.advanceTimersByTime(200));
    rerender({ value: "삼성생명" });

    // 아직 조용해지지 않았으므로 그대로
    expect(result.current).toBe("");

    act(() => void vi.advanceTimersByTime(300));
    expect(result.current).toBe("삼성생명");
  });
});
