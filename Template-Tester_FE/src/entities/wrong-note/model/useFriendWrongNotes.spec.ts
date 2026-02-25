import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFriendWrongNotes } from "./useFriendWrongNotes";
import type { WrongNote, Filters } from "./wrong-note.type";

// --- Mocks ---

const mockGetFriendsSharedWrongNotes = vi.fn();

vi.mock("../api/wrong-note.api", () => ({
  getFriendsSharedWrongNotes: (...args: unknown[]) =>
    mockGetFriendsSharedWrongNotes(...args),
}));

const mockGetFriendList = vi.fn();

vi.mock("@/entities/friend/api/friend.api", () => ({
  getFriendList: (...args: unknown[]) => mockGetFriendList(...args),
}));

// --- Test Data ---

const mockFriendNotes: WrongNote[] = [
  {
    id: "fn1",
    userId: "friend-1",
    userEmail: "f1@test.com",
    title: "친구의 DP 문제",
    link: "https://programmers.co.kr/1",
    language: "python",
    category: "dp",
    date: "2026-01-01",
    platform: "programmers",
    grade: "lv3",
    myCode: "code1",
    solution: "sol1",
    comment: "",
    share: true,
    tags: ["algorithm_fail"],
    result: "wrong",
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "fn2",
    userId: "friend-2",
    userEmail: "f2@test.com",
    title: "친구의 BFS 문제",
    link: "https://baekjoon.com/2",
    language: "java",
    category: "bfs",
    date: "2026-01-02",
    platform: "baekjoon",
    grade: "골드2",
    myCode: "code2",
    solution: "sol2",
    comment: "",
    share: true,
    tags: [],
    result: "timeout",
    createdAt: new Date("2026-01-02"),
  },
];

const mockFriends = [
  {
    odUserId: "friend-1",
    email: "f1@test.com",
    displayName: "친구일",
    photoURL: null,
  },
  {
    odUserId: "friend-2",
    email: "f2@test.com",
    displayName: null,
    photoURL: null,
  },
];

// --- Tests ---

describe("useFriendWrongNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("초기 상태", () => {
    it("friendNotes가 빈 배열이어야 한다", () => {
      const { result } = renderHook(() => useFriendWrongNotes());
      expect(result.current.friendNotes).toEqual([]);
    });

    it("friendFilter가 빈 문자열이어야 한다", () => {
      const { result } = renderHook(() => useFriendWrongNotes());
      expect(result.current.friendFilter).toBe("");
    });
  });

  describe("loadFriendNotes", () => {
    it("친구 오답노트와 친구 목록을 동시에 로드해야 한다", async () => {
      mockGetFriendsSharedWrongNotes.mockResolvedValue(mockFriendNotes);
      mockGetFriendList.mockResolvedValue(mockFriends);

      const { result } = renderHook(() => useFriendWrongNotes());

      await act(async () => {
        await result.current.loadFriendNotes();
      });

      expect(result.current.friendNotes).toEqual(mockFriendNotes);
      expect(result.current.friendList).toEqual(mockFriends);
      expect(result.current.isFriendNotesLoading).toBe(false);
    });

    it("로드 실패 시 빈 배열을 유지해야 한다", async () => {
      mockGetFriendsSharedWrongNotes.mockRejectedValue(new Error("실패"));

      const { result } = renderHook(() => useFriendWrongNotes());

      await act(async () => {
        await result.current.loadFriendNotes();
      });

      expect(result.current.friendNotes).toEqual([]);
      expect(result.current.isFriendNotesLoading).toBe(false);
    });
  });

  describe("getFriendDisplayName", () => {
    it("displayName이 있으면 반환해야 한다", async () => {
      mockGetFriendsSharedWrongNotes.mockResolvedValue(mockFriendNotes);
      mockGetFriendList.mockResolvedValue(mockFriends);

      const { result } = renderHook(() => useFriendWrongNotes());

      await act(async () => {
        await result.current.loadFriendNotes();
      });

      expect(result.current.getFriendDisplayName("friend-1")).toBe("친구일");
    });

    it("displayName이 없으면 email을 반환해야 한다", async () => {
      mockGetFriendsSharedWrongNotes.mockResolvedValue(mockFriendNotes);
      mockGetFriendList.mockResolvedValue(mockFriends);

      const { result } = renderHook(() => useFriendWrongNotes());

      await act(async () => {
        await result.current.loadFriendNotes();
      });

      expect(result.current.getFriendDisplayName("friend-2")).toBe(
        "f2@test.com",
      );
    });

    it("친구 목록에 없으면 '알 수 없음'을 반환해야 한다", async () => {
      mockGetFriendsSharedWrongNotes.mockResolvedValue([]);
      mockGetFriendList.mockResolvedValue([]);

      const { result } = renderHook(() => useFriendWrongNotes());

      await act(async () => {
        await result.current.loadFriendNotes();
      });

      expect(result.current.getFriendDisplayName("unknown")).toBe("알 수 없음");
    });
  });

  describe("getFilteredFriendNotes", () => {
    const emptyFilters: Filters = {
      platform: "",
      category: "",
      result: "",
      language: "",
      tag: "",
    };

    it("필터 없으면 전체를 반환해야 한다", async () => {
      mockGetFriendsSharedWrongNotes.mockResolvedValue(mockFriendNotes);
      mockGetFriendList.mockResolvedValue(mockFriends);

      const { result } = renderHook(() => useFriendWrongNotes());

      await act(async () => {
        await result.current.loadFriendNotes();
      });

      const filtered = result.current.getFilteredFriendNotes(emptyFilters, "");
      expect(filtered).toHaveLength(2);
    });

    it("friendFilter로 특정 친구의 노트만 필터링해야 한다", async () => {
      mockGetFriendsSharedWrongNotes.mockResolvedValue(mockFriendNotes);
      mockGetFriendList.mockResolvedValue(mockFriends);

      const { result } = renderHook(() => useFriendWrongNotes());

      await act(async () => {
        await result.current.loadFriendNotes();
      });

      act(() => {
        result.current.setFriendFilter("friend-1");
      });

      const filtered = result.current.getFilteredFriendNotes(emptyFilters, "");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].userId).toBe("friend-1");
    });

    it("platform 필터를 적용해야 한다", async () => {
      mockGetFriendsSharedWrongNotes.mockResolvedValue(mockFriendNotes);
      mockGetFriendList.mockResolvedValue(mockFriends);

      const { result } = renderHook(() => useFriendWrongNotes());

      await act(async () => {
        await result.current.loadFriendNotes();
      });

      const filtered = result.current.getFilteredFriendNotes(
        { ...emptyFilters, platform: "baekjoon" },
        "",
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].platform).toBe("baekjoon");
    });

    it("검색어로 title을 필터링해야 한다", async () => {
      mockGetFriendsSharedWrongNotes.mockResolvedValue(mockFriendNotes);
      mockGetFriendList.mockResolvedValue(mockFriends);

      const { result } = renderHook(() => useFriendWrongNotes());

      await act(async () => {
        await result.current.loadFriendNotes();
      });

      const filtered = result.current.getFilteredFriendNotes(
        emptyFilters,
        "DP",
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("친구의 DP 문제");
    });
  });
});
