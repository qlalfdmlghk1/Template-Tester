import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useWrongNoteDetail } from "./useWrongNoteDetail";
import type { WrongNote } from "./wrong-note.type";

// --- Mocks ---

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const mockGetWrongNoteById = vi.fn();
const mockDeleteWrongNote = vi.fn();

vi.mock("../api/wrong-note.api", () => ({
  getWrongNoteById: (...args: unknown[]) => mockGetWrongNoteById(...args),
  deleteWrongNote: (...args: unknown[]) => mockDeleteWrongNote(...args),
}));

const mockAlert = vi.fn();
const mockConfirm = vi.fn();
vi.stubGlobal("alert", mockAlert);
vi.stubGlobal("confirm", mockConfirm);

// --- Test Data ---

const mockNote: WrongNote = {
  id: "note-1",
  userId: "user1",
  userEmail: "test@test.com",
  title: "테스트 오답노트",
  link: "https://programmers.co.kr/1",
  language: "python",
  category: "dp",
  date: "2026-01-01",
  platform: "programmers",
  grade: "lv2",
  myCode: "print('hello')",
  solution: "print('world')",
  comment: "메모",
  share: false,
  tags: ["algorithm_fail"],
  result: "wrong",
  createdAt: new Date("2026-01-01"),
};

// --- Tests ---

describe("useWrongNoteDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("초기 상태", () => {
    it("note가 null이어야 한다", () => {
      mockGetWrongNoteById.mockResolvedValue({ note: null, isOwner: false });

      const { result } = renderHook(() => useWrongNoteDetail(undefined));
      expect(result.current.note).toBeNull();
    });

    it("isEditMode가 false여야 한다", () => {
      const { result } = renderHook(() => useWrongNoteDetail(undefined));
      expect(result.current.isEditMode).toBe(false);
    });
  });

  describe("데이터 로드", () => {
    it("id가 있으면 오답노트를 로드해야 한다", async () => {
      mockGetWrongNoteById.mockResolvedValue({
        note: mockNote,
        isOwner: true,
      });

      const { result } = renderHook(() => useWrongNoteDetail("note-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.note).toEqual(mockNote);
      expect(result.current.isOwner).toBe(true);
    });

    it("id가 없으면 API를 호출하지 않아야 한다", async () => {
      const { result } = renderHook(() => useWrongNoteDetail(undefined));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetWrongNoteById).not.toHaveBeenCalled();
    });

    it("로드 실패 시 note가 null로 유지되어야 한다", async () => {
      mockGetWrongNoteById.mockRejectedValue(new Error("조회 실패"));

      const { result } = renderHook(() => useWrongNoteDetail("note-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.note).toBeNull();
    });
  });

  describe("handleDelete", () => {
    it("note가 없으면 삭제하지 않아야 한다", async () => {
      const { result } = renderHook(() => useWrongNoteDetail(undefined));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(mockConfirm).not.toHaveBeenCalled();
      expect(mockDeleteWrongNote).not.toHaveBeenCalled();
    });

    it("confirm 취소 시 삭제하지 않아야 한다", async () => {
      mockGetWrongNoteById.mockResolvedValue({
        note: mockNote,
        isOwner: true,
      });
      mockConfirm.mockReturnValue(false);

      const { result } = renderHook(() => useWrongNoteDetail("note-1"));

      await waitFor(() => {
        expect(result.current.note).not.toBeNull();
      });

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(mockDeleteWrongNote).not.toHaveBeenCalled();
    });

    it("삭제 성공 시 오답노트 목록으로 이동해야 한다", async () => {
      mockGetWrongNoteById.mockResolvedValue({
        note: mockNote,
        isOwner: true,
      });
      mockConfirm.mockReturnValue(true);
      mockDeleteWrongNote.mockResolvedValue(undefined);

      const { result } = renderHook(() => useWrongNoteDetail("note-1"));

      await waitFor(() => {
        expect(result.current.note).not.toBeNull();
      });

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(mockDeleteWrongNote).toHaveBeenCalledWith("note-1");
      expect(mockNavigate).toHaveBeenCalledWith("/wrong-notes");
    });

    it("삭제 실패 시 alert을 표시해야 한다", async () => {
      mockGetWrongNoteById.mockResolvedValue({
        note: mockNote,
        isOwner: true,
      });
      mockConfirm.mockReturnValue(true);
      mockDeleteWrongNote.mockRejectedValue(new Error("삭제 실패"));

      const { result } = renderHook(() => useWrongNoteDetail("note-1"));

      await waitFor(() => {
        expect(result.current.note).not.toBeNull();
      });

      await act(async () => {
        await result.current.handleDelete();
      });

      expect(mockAlert).toHaveBeenCalledWith("삭제에 실패했습니다.");
    });
  });

  describe("noteToFormData", () => {
    it("WrongNote를 FormData로 변환해야 한다", async () => {
      mockGetWrongNoteById.mockResolvedValue({
        note: mockNote,
        isOwner: true,
      });

      const { result } = renderHook(() => useWrongNoteDetail("note-1"));

      await waitFor(() => {
        expect(result.current.note).not.toBeNull();
      });

      const formData = result.current.noteToFormData(mockNote);

      expect(formData).toEqual({
        title: "테스트 오답노트",
        link: "https://programmers.co.kr/1",
        language: "python",
        date: "2026-01-01",
        platform: "programmers",
        grade: "lv2",
        category: "dp",
        myCode: "print('hello')",
        solution: "print('world')",
        comment: "메모",
        share: false,
        tags: ["algorithm_fail"],
        result: "wrong",
      });
    });
  });

  describe("편집 모드", () => {
    it("setIsEditMode로 편집 모드를 활성화할 수 있어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteDetail(undefined));

      act(() => {
        result.current.setIsEditMode(true);
      });

      expect(result.current.isEditMode).toBe(true);
    });

    it("handleCancel로 편집 모드를 종료할 수 있어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteDetail(undefined));

      act(() => {
        result.current.setIsEditMode(true);
      });

      act(() => {
        result.current.handleCancel();
      });

      expect(result.current.isEditMode).toBe(false);
    });

    it("handleSaveSuccess로 편집 모드를 종료하고 alert을 표시해야 한다", async () => {
      mockGetWrongNoteById.mockResolvedValue({
        note: mockNote,
        isOwner: true,
      });

      const { result } = renderHook(() => useWrongNoteDetail("note-1"));

      await waitFor(() => {
        expect(result.current.note).not.toBeNull();
      });

      act(() => {
        result.current.setIsEditMode(true);
      });

      act(() => {
        result.current.handleSaveSuccess();
      });

      expect(result.current.isEditMode).toBe(false);
      expect(mockAlert).toHaveBeenCalledWith("수정되었습니다.");
    });
  });
});
