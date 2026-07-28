import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFriendList } from "./useFriendList";

// --- Mocks ---

const mockGetFriendList = vi.fn();
const mockGetFriendshipStatus = vi.fn();
const mockDeleteFriendship = vi.fn();

vi.mock("../api/friend.api", () => ({
  getFriendList: (...args: unknown[]) => mockGetFriendList(...args),
  getFriendshipStatus: (...args: unknown[]) => mockGetFriendshipStatus(...args),
  deleteFriendship: (...args: unknown[]) => mockDeleteFriendship(...args),
}));

const mockAlert = vi.fn();
const mockConfirm = vi.fn();
vi.stubGlobal("alert", mockAlert);
vi.stubGlobal("confirm", mockConfirm);

// --- Test Data ---

const mockFriends = [
  {
    odUserId: "user1",
    email: "friend1@test.com",
    displayName: "친구1",
    photoURL: null,
  },
  {
    odUserId: "user2",
    email: "friend2@test.com",
    displayName: "친구2",
    photoURL: null,
  },
];

// --- Tests ---

describe("useFriendList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("초기 상태", () => {
    it("friends가 빈 배열이어야 한다", () => {
      const { result } = renderHook(() => useFriendList());
      expect(result.current.friends).toEqual([]);
    });

    it("isLoading이 false여야 한다", () => {
      const { result } = renderHook(() => useFriendList());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("loadFriendList", () => {
    it("친구 목록을 로드해야 한다", async () => {
      mockGetFriendList.mockResolvedValue(mockFriends);

      const { result } = renderHook(() => useFriendList());

      await act(async () => {
        await result.current.loadFriendList();
      });

      expect(result.current.friends).toEqual(mockFriends);
      expect(result.current.isLoading).toBe(false);
    });

    it("로드 실패 시 빈 배열을 유지해야 한다", async () => {
      mockGetFriendList.mockRejectedValue(new Error("로드 실패"));

      const { result } = renderHook(() => useFriendList());

      await act(async () => {
        await result.current.loadFriendList();
      });

      expect(result.current.friends).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("handleDeleteFriend", () => {
    it("confirm 취소 시 삭제하지 않아야 한다", async () => {
      mockConfirm.mockReturnValue(false);

      const { result } = renderHook(() => useFriendList());

      await act(async () => {
        await result.current.handleDeleteFriend("user1");
      });

      expect(mockGetFriendshipStatus).not.toHaveBeenCalled();
    });

    it("confirm 확인 시 friendship 상태 확인 후 삭제해야 한다", async () => {
      mockConfirm.mockReturnValue(true);
      mockGetFriendshipStatus.mockResolvedValue({ id: "fs-1" });
      mockDeleteFriendship.mockResolvedValue(undefined);
      mockGetFriendList.mockResolvedValue([]);

      const { result } = renderHook(() => useFriendList());

      await act(async () => {
        await result.current.handleDeleteFriend("user1");
      });

      expect(mockGetFriendshipStatus).toHaveBeenCalledWith("user1");
      expect(mockDeleteFriendship).toHaveBeenCalledWith("fs-1");
      expect(mockAlert).toHaveBeenCalledWith("친구를 삭제했습니다.");
    });

    it("삭제 실패 시 alert을 표시해야 한다", async () => {
      mockConfirm.mockReturnValue(true);
      mockGetFriendshipStatus.mockRejectedValue(new Error("실패"));

      const { result } = renderHook(() => useFriendList());

      await act(async () => {
        await result.current.handleDeleteFriend("user1");
      });

      expect(mockAlert).toHaveBeenCalledWith("친구 삭제에 실패했습니다.");
    });
  });
});
