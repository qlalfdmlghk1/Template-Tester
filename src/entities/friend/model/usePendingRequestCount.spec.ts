import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePendingRequestCount } from "./usePendingRequestCount";

// --- Mocks ---

const mockGetReceivedFriendRequests = vi.fn();

vi.mock("../api/friend.api", () => ({
  getReceivedFriendRequests: (...args: unknown[]) =>
    mockGetReceivedFriendRequests(...args),
}));

// --- Tests ---

describe("usePendingRequestCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("로그인 상태가 아니면 요청을 보내지 않아야 한다", () => {
    renderHook(() => usePendingRequestCount(false));
    expect(mockGetReceivedFriendRequests).not.toHaveBeenCalled();
  });

  it("로그인 상태이면 즉시 요청 수를 로드해야 한다", async () => {
    mockGetReceivedFriendRequests.mockResolvedValue([
      { id: "1" },
      { id: "2" },
      { id: "3" },
    ]);

    const { result } = renderHook(() => usePendingRequestCount(true));

    await waitFor(() => {
      expect(result.current.pendingRequestCount).toBe(3);
    });
  });

  it("API 에러 시 count를 0으로 유지해야 한다", async () => {
    mockGetReceivedFriendRequests.mockRejectedValue(new Error("에러"));

    const { result } = renderHook(() => usePendingRequestCount(true));

    await waitFor(() => {
      expect(mockGetReceivedFriendRequests).toHaveBeenCalled();
    });

    expect(result.current.pendingRequestCount).toBe(0);
  });

  it("언마운트 시 interval을 정리해야 한다", async () => {
    mockGetReceivedFriendRequests.mockResolvedValue([{ id: "1" }]);

    const { unmount } = renderHook(() => usePendingRequestCount(true));

    await waitFor(() => {
      expect(mockGetReceivedFriendRequests).toHaveBeenCalledTimes(1);
    });

    // clearInterval이 호출되는지 확인 (언마운트 시 cleanup)
    const clearIntervalSpy = vi.spyOn(global, "clearInterval");
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
