import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFriendSearch } from "./useFriendSearch";

// --- Mocks ---

const mockSendFriendRequest = vi.fn();
const mockGetFriendshipStatus = vi.fn();

vi.mock("../api/friend.api", () => ({
  sendFriendRequest: (...args: unknown[]) => mockSendFriendRequest(...args),
  getFriendshipStatus: (...args: unknown[]) =>
    mockGetFriendshipStatus(...args),
}));

const mockSearchUserByDisplayName = vi.fn();

vi.mock("@/entities/user/api/user.api", () => ({
  searchUserByDisplayName: (...args: unknown[]) =>
    mockSearchUserByDisplayName(...args),
}));

const mockAlert = vi.fn();
vi.stubGlobal("alert", mockAlert);

// --- Test Data ---

const mockUsers = [
  { uid: "u1", email: "user1@test.com", displayName: "테스터1", photoURL: null },
  { uid: "u2", email: "user2@test.com", displayName: "테스터2", photoURL: null },
];

// --- Tests ---

describe("useFriendSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("초기 상태", () => {
    it("검색어가 빈 문자열이어야 한다", () => {
      const { result } = renderHook(() => useFriendSearch("my-id"));
      expect(result.current.searchQuery).toBe("");
    });

    it("검색 결과가 빈 배열이어야 한다", () => {
      const { result } = renderHook(() => useFriendSearch("my-id"));
      expect(result.current.searchResults).toEqual([]);
    });

    it("isSearching이 false여야 한다", () => {
      const { result } = renderHook(() => useFriendSearch("my-id"));
      expect(result.current.isSearching).toBe(false);
    });
  });

  describe("handleSearch", () => {
    it("검색어가 비어있으면 검색하지 않아야 한다", async () => {
      const { result } = renderHook(() => useFriendSearch("my-id"));

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(mockSearchUserByDisplayName).not.toHaveBeenCalled();
    });

    it("검색어가 공백만이면 검색하지 않아야 한다", async () => {
      const { result } = renderHook(() => useFriendSearch("my-id"));

      act(() => {
        result.current.setSearchQuery("   ");
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(mockSearchUserByDisplayName).not.toHaveBeenCalled();
    });

    it("검색 성공 시 결과와 상태를 업데이트해야 한다", async () => {
      mockSearchUserByDisplayName.mockResolvedValue(mockUsers);
      mockGetFriendshipStatus.mockResolvedValue(null);

      const { result } = renderHook(() => useFriendSearch("my-id"));

      act(() => {
        result.current.setSearchQuery("테스터");
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(mockSearchUserByDisplayName).toHaveBeenCalledWith("테스터");
      expect(result.current.searchResults).toEqual(mockUsers);
      expect(result.current.isSearching).toBe(false);
    });

    it("검색 실패 시 alert을 표시해야 한다", async () => {
      mockSearchUserByDisplayName.mockRejectedValue(new Error("검색 실패"));

      const { result } = renderHook(() => useFriendSearch("my-id"));

      act(() => {
        result.current.setSearchQuery("테스터");
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(mockAlert).toHaveBeenCalledWith("사용자 검색에 실패했습니다.");
    });
  });

  describe("handleSendRequest", () => {
    it("요청 성공 시 alert을 표시하고 상태를 업데이트해야 한다", async () => {
      mockSendFriendRequest.mockResolvedValue(undefined);
      mockGetFriendshipStatus.mockResolvedValue({
        status: "pending",
        requesterId: "my-id",
      });

      const { result } = renderHook(() => useFriendSearch("my-id"));

      await act(async () => {
        await result.current.handleSendRequest("u1");
      });

      expect(mockSendFriendRequest).toHaveBeenCalledWith("u1");
      expect(mockAlert).toHaveBeenCalledWith("친구 요청을 보냈습니다.");
    });

    it("요청 실패 시 에러 메시지를 alert으로 표시해야 한다", async () => {
      mockSendFriendRequest.mockRejectedValue(
        new Error("이미 요청된 사용자입니다."),
      );

      const { result } = renderHook(() => useFriendSearch("my-id"));

      await act(async () => {
        await result.current.handleSendRequest("u1");
      });

      expect(mockAlert).toHaveBeenCalledWith("이미 요청된 사용자입니다.");
    });
  });

  describe("getRequestButtonText", () => {
    it("상태가 없으면 '친구 요청'을 반환해야 한다", () => {
      const { result } = renderHook(() => useFriendSearch("my-id"));
      expect(result.current.getRequestButtonText("unknown")).toBe("친구 요청");
    });

    it("accepted 상태면 '이미 친구'를 반환해야 한다", async () => {
      mockSearchUserByDisplayName.mockResolvedValue(mockUsers);
      mockGetFriendshipStatus.mockResolvedValue({ status: "accepted" });

      const { result } = renderHook(() => useFriendSearch("my-id"));

      act(() => {
        result.current.setSearchQuery("테스터");
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(result.current.getRequestButtonText("u1")).toBe("이미 친구");
    });

    it("pending + 내가 보낸 요청이면 '요청 보냄'을 반환해야 한다", async () => {
      mockSearchUserByDisplayName.mockResolvedValue([mockUsers[0]]);
      mockGetFriendshipStatus.mockResolvedValue({
        status: "pending",
        requesterId: "my-id",
      });

      const { result } = renderHook(() => useFriendSearch("my-id"));

      act(() => {
        result.current.setSearchQuery("테스터");
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(result.current.getRequestButtonText("u1")).toBe("요청 보냄");
    });

    it("pending + 상대가 보낸 요청이면 '요청 받음'을 반환해야 한다", async () => {
      mockSearchUserByDisplayName.mockResolvedValue([mockUsers[0]]);
      mockGetFriendshipStatus.mockResolvedValue({
        status: "pending",
        requesterId: "u1",
      });

      const { result } = renderHook(() => useFriendSearch("my-id"));

      act(() => {
        result.current.setSearchQuery("테스터");
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(result.current.getRequestButtonText("u1")).toBe("요청 받음");
    });
  });

  describe("isRequestDisabled", () => {
    it("상태가 없으면 false여야 한다", () => {
      const { result } = renderHook(() => useFriendSearch("my-id"));
      expect(result.current.isRequestDisabled("unknown")).toBe(false);
    });

    it("accepted 상태면 true여야 한다", async () => {
      mockSearchUserByDisplayName.mockResolvedValue([mockUsers[0]]);
      mockGetFriendshipStatus.mockResolvedValue({ status: "accepted" });

      const { result } = renderHook(() => useFriendSearch("my-id"));

      act(() => {
        result.current.setSearchQuery("테스터");
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(result.current.isRequestDisabled("u1")).toBe(true);
    });

    it("pending 상태면 true여야 한다", async () => {
      mockSearchUserByDisplayName.mockResolvedValue([mockUsers[0]]);
      mockGetFriendshipStatus.mockResolvedValue({
        status: "pending",
        requesterId: "my-id",
      });

      const { result } = renderHook(() => useFriendSearch("my-id"));

      act(() => {
        result.current.setSearchQuery("테스터");
      });

      await act(async () => {
        await result.current.handleSearch();
      });

      expect(result.current.isRequestDisabled("u1")).toBe(true);
    });
  });
});
