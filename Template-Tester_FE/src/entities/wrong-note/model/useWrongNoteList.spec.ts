import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWrongNoteList } from "./useWrongNoteList";
import type { WrongNote, Filters } from "./wrong-note.type";

// --- Mocks ---

const mockGetWrongNotes = vi.fn();
const mockDeleteWrongNote = vi.fn();

vi.mock("../api/wrong-note.api", () => ({
  getWrongNotes: (...args: unknown[]) => mockGetWrongNotes(...args),
  deleteWrongNote: (...args: unknown[]) => mockDeleteWrongNote(...args),
}));

const mockAlert = vi.fn();
const mockConfirm = vi.fn();
vi.stubGlobal("alert", mockAlert);
vi.stubGlobal("confirm", mockConfirm);

// --- Test Data ---

const mockNotes: WrongNote[] = [
  {
    id: "1",
    userId: "user1",
    userEmail: "test@test.com",
    title: "두 수의 합",
    link: "https://programmers.co.kr/1",
    language: "python",
    category: "dp",
    date: "2026-01-01",
    platform: "programmers",
    grade: "lv2",
    myCode: "code1",
    solution: "sol1",
    comment: "메모1",
    share: false,
    tags: ["algorithm_fail"],
    result: "wrong",
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "2",
    userId: "user1",
    userEmail: "test@test.com",
    title: "BFS 탐색",
    link: "https://baekjoon.com/2",
    language: "java",
    category: "bfs",
    date: "2026-01-02",
    platform: "baekjoon",
    grade: "골드3",
    myCode: "code2",
    solution: "sol2",
    comment: "메모2",
    share: true,
    tags: ["implementation_fail"],
    result: "timeout",
    createdAt: new Date("2026-01-02"),
  },
  {
    id: "3",
    userId: "user1",
    userEmail: "test@test.com",
    title: "그리디 문제",
    link: "https://programmers.co.kr/3",
    language: "python",
    category: "greedy",
    date: "2026-01-03",
    platform: "programmers",
    grade: "lv3",
    myCode: "code3",
    solution: "sol3",
    comment: "",
    share: false,
    tags: ["better_solution"],
    result: "correct",
    createdAt: new Date("2026-01-03"),
  },
];

// --- Tests ---

describe("useWrongNoteList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("초기 상태", () => {
    it("notes가 빈 배열이어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteList());
      expect(result.current.notes).toEqual([]);
    });

    it("isLoading이 false여야 한다", () => {
      const { result } = renderHook(() => useWrongNoteList());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("loadNotes", () => {
    it("오답노트 목록을 로드해야 한다", async () => {
      mockGetWrongNotes.mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      expect(result.current.notes).toEqual(mockNotes);
      expect(result.current.isLoading).toBe(false);
    });

    it("로드 실패 시 notes를 변경하지 않아야 한다", async () => {
      mockGetWrongNotes.mockRejectedValue(new Error("조회 실패"));

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      expect(result.current.notes).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("handleDelete", () => {
    it("confirm 취소 시 삭제하지 않아야 한다", async () => {
      mockGetWrongNotes.mockResolvedValue(mockNotes);
      mockConfirm.mockReturnValue(false);

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      await act(async () => {
        await result.current.handleDelete("1");
      });

      expect(mockDeleteWrongNote).not.toHaveBeenCalled();
      expect(result.current.notes).toHaveLength(3);
    });

    it("confirm 확인 시 삭제하고 목록에서 제거해야 한다", async () => {
      mockGetWrongNotes.mockResolvedValue(mockNotes);
      mockConfirm.mockReturnValue(true);
      mockDeleteWrongNote.mockResolvedValue(undefined);

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      await act(async () => {
        await result.current.handleDelete("1");
      });

      expect(mockDeleteWrongNote).toHaveBeenCalledWith("1");
      expect(result.current.notes).toHaveLength(2);
      expect(result.current.notes.find((n) => n.id === "1")).toBeUndefined();
    });

    it("삭제 실패 시 alert을 표시해야 한다", async () => {
      mockGetWrongNotes.mockResolvedValue(mockNotes);
      mockConfirm.mockReturnValue(true);
      mockDeleteWrongNote.mockRejectedValue(new Error("삭제 실패"));

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      await act(async () => {
        await result.current.handleDelete("1");
      });

      expect(mockAlert).toHaveBeenCalledWith("삭제에 실패했습니다.");
      // 삭제 실패 시 목록은 유지
      expect(result.current.notes).toHaveLength(3);
    });
  });

  describe("getFilteredNotes", () => {
    const emptyFilters: Filters = {
      platform: "",
      category: "",
      result: "",
      language: "",
      tag: "",
    };

    it("필터 없으면 전체 노트를 반환해야 한다", async () => {
      mockGetWrongNotes.mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      const filtered = result.current.getFilteredNotes(emptyFilters, "");
      expect(filtered).toHaveLength(3);
    });

    it("platform 필터를 적용해야 한다", async () => {
      mockGetWrongNotes.mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      const filtered = result.current.getFilteredNotes(
        { ...emptyFilters, platform: "programmers" },
        "",
      );
      expect(filtered).toHaveLength(2);
      expect(filtered.every((n) => n.platform === "programmers")).toBe(true);
    });

    it("category 필터를 적용해야 한다", async () => {
      mockGetWrongNotes.mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      const filtered = result.current.getFilteredNotes(
        { ...emptyFilters, category: "dp" },
        "",
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("두 수의 합");
    });

    it("result 필터를 적용해야 한다", async () => {
      mockGetWrongNotes.mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      const filtered = result.current.getFilteredNotes(
        { ...emptyFilters, result: "timeout" },
        "",
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("BFS 탐색");
    });

    it("language 필터를 적용해야 한다", async () => {
      mockGetWrongNotes.mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      const filtered = result.current.getFilteredNotes(
        { ...emptyFilters, language: "python" },
        "",
      );
      expect(filtered).toHaveLength(2);
    });

    it("tag 필터를 적용해야 한다", async () => {
      mockGetWrongNotes.mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      const filtered = result.current.getFilteredNotes(
        { ...emptyFilters, tag: "algorithm_fail" },
        "",
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("1");
    });

    it("검색어로 title을 필터링해야 한다", async () => {
      mockGetWrongNotes.mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      const filtered = result.current.getFilteredNotes(emptyFilters, "BFS");
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("BFS 탐색");
    });

    it("검색어로 link를 필터링해야 한다", async () => {
      mockGetWrongNotes.mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      const filtered = result.current.getFilteredNotes(
        emptyFilters,
        "baekjoon",
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("2");
    });

    it("여러 필터를 복합 적용해야 한다", async () => {
      mockGetWrongNotes.mockResolvedValue(mockNotes);

      const { result } = renderHook(() => useWrongNoteList());

      await act(async () => {
        await result.current.loadNotes();
      });

      const filtered = result.current.getFilteredNotes(
        { ...emptyFilters, platform: "programmers", language: "python" },
        "",
      );
      expect(filtered).toHaveLength(2);
    });
  });
});
