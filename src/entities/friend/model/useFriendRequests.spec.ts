import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFriendRequests } from "./useFriendRequests";

// --- Mocks ---

const mockGetReceivedFriendRequests = vi.fn();
const mockGetSentFriendRequests = vi.fn();
const mockAcceptFriendRequest = vi.fn();
const mockRejectFriendRequest = vi.fn();
const mockDeleteFriendship = vi.fn();

vi.mock("../api/friend.api", () => ({
  getReceivedFriendRequests: (...args: unknown[]) =>
    mockGetReceivedFriendRequests(...args),
  getSentFriendRequests: (...args: unknown[]) =>
    mockGetSentFriendRequests(...args),
  acceptFriendRequest: (...args: unknown[]) =>
    mockAcceptFriendRequest(...args),
  rejectFriendRequest: (...args: unknown[]) =>
    mockRejectFriendRequest(...args),
  deleteFriendship: (...args: unknown[]) =>
    mockDeleteFriendship(...args),
}));

const mockAlert = vi.fn();
vi.stubGlobal("alert", mockAlert);

// --- Test Data ---

const mockReceived = [
  {
    id: "fr-1",
    requesterId: "user-a",
    requesterEmail: "a@test.com",
    requesterDisplayName: "UserA",
    requesterPhotoURL: null,
    receiverId: "me",
    receiverEmail: "me@test.com",
    receiverDisplayName: "Me",
    receiverPhotoURL: null,
    status: "pending" as const,
    createdAt: new Date(),
  },
];

const mockSent = [
  {
    id: "fr-2",
    requesterId: "me",
    requesterEmail: "me@test.com",
    requesterDisplayName: "Me",
    requesterPhotoURL: null,
    receiverId: "user-b",
    receiverEmail: "b@test.com",
    receiverDisplayName: "UserB",
    receiverPhotoURL: null,
    status: "pending" as const,
    createdAt: new Date(),
  },
];

// --- Tests ---

describe("useFriendRequests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("초기 상태", () => {
    it("받은/보낸 요청이 빈 배열이어야 한다", () => {
      const { result } = renderHook(() => useFriendRequests());
      expect(result.current.receivedRequests).toEqual([]);
      expect(result.current.sentRequests).toEqual([]);
    });
  });

  describe("loadRequests", () => {
    it("받은 요청과 보낸 요청을 동시에 로드해야 한다", async () => {
      mockGetReceivedFriendRequests.mockResolvedValue(mockReceived);
      mockGetSentFriendRequests.mockResolvedValue(mockSent);

      const { result } = renderHook(() => useFriendRequests());

      await act(async () => {
        await result.current.loadRequests();
      });

      expect(result.current.receivedRequests).toEqual(mockReceived);
      expect(result.current.sentRequests).toEqual(mockSent);
      expect(result.current.isLoading).toBe(false);
    });

    it("로드 실패 시 빈 배열을 유지해야 한다", async () => {
      mockGetReceivedFriendRequests.mockRejectedValue(new Error("실패"));

      const { result } = renderHook(() => useFriendRequests());

      await act(async () => {
        await result.current.loadRequests();
      });

      expect(result.current.receivedRequests).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("handleAccept", () => {
    it("수락 성공 시 alert을 표시하고 목록을 새로고침해야 한다", async () => {
      mockAcceptFriendRequest.mockResolvedValue(undefined);
      mockGetReceivedFriendRequests.mockResolvedValue([]);
      mockGetSentFriendRequests.mockResolvedValue([]);

      const { result } = renderHook(() => useFriendRequests());

      await act(async () => {
        await result.current.handleAccept("fr-1");
      });

      expect(mockAcceptFriendRequest).toHaveBeenCalledWith("fr-1");
      expect(mockAlert).toHaveBeenCalledWith("친구 요청을 수락했습니다.");
    });

    it("수락 실패 시 에러 alert을 표시해야 한다", async () => {
      mockAcceptFriendRequest.mockRejectedValue(new Error("실패"));

      const { result } = renderHook(() => useFriendRequests());

      await act(async () => {
        await result.current.handleAccept("fr-1");
      });

      expect(mockAlert).toHaveBeenCalledWith(
        "친구 요청 수락에 실패했습니다.",
      );
    });
  });

  describe("handleReject", () => {
    it("거절 성공 시 alert을 표시해야 한다", async () => {
      mockRejectFriendRequest.mockResolvedValue(undefined);
      mockGetReceivedFriendRequests.mockResolvedValue([]);
      mockGetSentFriendRequests.mockResolvedValue([]);

      const { result } = renderHook(() => useFriendRequests());

      await act(async () => {
        await result.current.handleReject("fr-1");
      });

      expect(mockRejectFriendRequest).toHaveBeenCalledWith("fr-1");
      expect(mockAlert).toHaveBeenCalledWith("친구 요청을 거절했습니다.");
    });

    it("거절 실패 시 에러 alert을 표시해야 한다", async () => {
      mockRejectFriendRequest.mockRejectedValue(new Error("실패"));

      const { result } = renderHook(() => useFriendRequests());

      await act(async () => {
        await result.current.handleReject("fr-1");
      });

      expect(mockAlert).toHaveBeenCalledWith(
        "친구 요청 거절에 실패했습니다.",
      );
    });
  });

  describe("handleCancelRequest", () => {
    it("취소 성공 시 alert을 표시해야 한다", async () => {
      mockDeleteFriendship.mockResolvedValue(undefined);
      mockGetReceivedFriendRequests.mockResolvedValue([]);
      mockGetSentFriendRequests.mockResolvedValue([]);

      const { result } = renderHook(() => useFriendRequests());

      await act(async () => {
        await result.current.handleCancelRequest("fr-2");
      });

      expect(mockDeleteFriendship).toHaveBeenCalledWith("fr-2");
      expect(mockAlert).toHaveBeenCalledWith("친구 요청을 취소했습니다.");
    });

    it("취소 실패 시 에러 alert을 표시해야 한다", async () => {
      mockDeleteFriendship.mockRejectedValue(new Error("실패"));

      const { result } = renderHook(() => useFriendRequests());

      await act(async () => {
        await result.current.handleCancelRequest("fr-2");
      });

      expect(mockAlert).toHaveBeenCalledWith(
        "친구 요청 취소에 실패했습니다.",
      );
    });
  });
});
