import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMyTemplates } from "./useMyTemplates";

// --- Mocks ---

const mockGetUserTemplatesByCategory = vi.fn();
const mockDeleteUserTemplate = vi.fn();

vi.mock("../api/template.api", () => ({
  getUserTemplatesByCategory: (...args: unknown[]) =>
    mockGetUserTemplatesByCategory(...args),
  deleteUserTemplate: (...args: unknown[]) =>
    mockDeleteUserTemplate(...args),
}));

const mockAlert = vi.fn();
const mockConfirm = vi.fn();
vi.stubGlobal("alert", mockAlert);
vi.stubGlobal("confirm", mockConfirm);

// --- Test Data ---

const mockTemplates = [
  {
    id: "1",
    category: "algorithm" as const,
    title: "버블 정렬",
    description: "정렬 알고리즘",
    answer: "answer1",
  },
  {
    id: "2",
    category: "algorithm" as const,
    title: "이진 탐색",
    description: "탐색 알고리즘",
    answer: "answer2",
  },
];

// --- Tests ---

describe("useMyTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("초기 상태", () => {
    it("templates가 빈 배열이어야 한다", () => {
      const { result } = renderHook(() => useMyTemplates());
      expect(result.current.templates).toEqual([]);
    });

    it("isLoading이 true여야 한다", () => {
      const { result } = renderHook(() => useMyTemplates());
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("loadTemplates", () => {
    it("템플릿 목록을 로드해야 한다", async () => {
      mockGetUserTemplatesByCategory.mockResolvedValue(mockTemplates);

      const { result } = renderHook(() => useMyTemplates());

      await act(async () => {
        await result.current.loadTemplates();
      });

      expect(result.current.templates).toEqual(mockTemplates);
      expect(result.current.isLoading).toBe(false);
    });

    it("로드 실패 시 alert을 표시해야 한다", async () => {
      mockGetUserTemplatesByCategory.mockRejectedValue(
        new Error("로드 실패"),
      );

      const { result } = renderHook(() => useMyTemplates());

      await act(async () => {
        await result.current.loadTemplates();
      });

      expect(mockAlert).toHaveBeenCalledWith(
        "템플릿을 불러오는데 실패했습니다.",
      );
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("handleDelete", () => {
    it("confirm 취소 시 삭제하지 않아야 한다", async () => {
      mockConfirm.mockReturnValue(false);

      const { result } = renderHook(() => useMyTemplates());

      await act(async () => {
        await result.current.handleDelete("1", "버블 정렬");
      });

      expect(mockDeleteUserTemplate).not.toHaveBeenCalled();
    });

    it("confirm에 템플릿 제목이 포함되어야 한다", async () => {
      mockConfirm.mockReturnValue(false);

      const { result } = renderHook(() => useMyTemplates());

      await act(async () => {
        await result.current.handleDelete("1", "버블 정렬");
      });

      expect(mockConfirm).toHaveBeenCalledWith(
        '"버블 정렬" 템플릿을 삭제하시겠습니까?',
      );
    });

    it("삭제 성공 시 alert을 표시하고 목록을 새로고침해야 한다", async () => {
      mockConfirm.mockReturnValue(true);
      mockDeleteUserTemplate.mockResolvedValue(undefined);
      mockGetUserTemplatesByCategory.mockResolvedValue([]);

      const { result } = renderHook(() => useMyTemplates());

      await act(async () => {
        await result.current.handleDelete("1", "버블 정렬");
      });

      expect(mockDeleteUserTemplate).toHaveBeenCalledWith("1");
      expect(mockAlert).toHaveBeenCalledWith("템플릿이 삭제되었습니다.");
    });

    it("삭제 실패 시 에러 alert을 표시해야 한다", async () => {
      mockConfirm.mockReturnValue(true);
      mockDeleteUserTemplate.mockRejectedValue(new Error("삭제 실패"));

      const { result } = renderHook(() => useMyTemplates());

      await act(async () => {
        await result.current.handleDelete("1", "버블 정렬");
      });

      expect(mockAlert).toHaveBeenCalledWith("템플릿 삭제에 실패했습니다.");
    });
  });
});
