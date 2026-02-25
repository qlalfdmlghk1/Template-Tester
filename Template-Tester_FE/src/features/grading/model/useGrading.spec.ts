import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useGrading } from "./useGrading";

// --- Mocks ---

const mockGetUserTemplatesByCategory = vi.fn();
const mockSaveSubmission = vi.fn();

vi.mock("@/entities/template/api/template.api", () => ({
  getUserTemplatesByCategory: (...args: unknown[]) =>
    mockGetUserTemplatesByCategory(...args),
}));

vi.mock("@/entities/submission/api/submission.api", () => ({
  saveSubmission: (...args: unknown[]) => mockSaveSubmission(...args),
}));

// gradeAnswer는 실제 로직 사용 (순수 함수이므로 mock 불필요)

const mockAlert = vi.fn();
vi.stubGlobal("alert", mockAlert);

// scrollIntoView mock
const mockScrollIntoView = vi.fn();

// --- Test Data ---

const mockTemplates = [
  {
    id: "t1",
    category: "algorithm" as const,
    title: "정렬 알고리즘",
    description: "버블 정렬 구현",
    answer: "function bubbleSort(arr) {\n  return arr.sort();\n}",
  },
  {
    id: "t2",
    category: "algorithm" as const,
    title: "이진 탐색",
    description: "이진 탐색 구현",
    answer: "function binarySearch(arr, target) {\n  return arr.indexOf(target);\n}",
  },
];

// --- Tests ---

describe("useGrading", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserTemplatesByCategory.mockResolvedValue(mockTemplates);
    vi.spyOn(document, "getElementById").mockReturnValue({
      scrollIntoView: mockScrollIntoView,
    } as unknown as HTMLElement);
  });

  describe("초기 상태", () => {
    it("기본 카테고리는 algorithm이어야 한다", () => {
      const { result } = renderHook(() => useGrading());
      expect(result.current.currentCategory).toBe("algorithm");
    });

    it("selectedTemplateId가 빈 문자열이어야 한다", () => {
      const { result } = renderHook(() => useGrading());
      expect(result.current.selectedTemplateId).toBe("");
    });

    it("userCode가 빈 문자열이어야 한다", () => {
      const { result } = renderHook(() => useGrading());
      expect(result.current.userCode).toBe("");
    });

    it("gradingResult가 null이어야 한다", () => {
      const { result } = renderHook(() => useGrading());
      expect(result.current.gradingResult).toBeNull();
    });
  });

  describe("템플릿 로드", () => {
    it("마운트 시 현재 카테고리의 템플릿을 로드해야 한다", async () => {
      renderHook(() => useGrading());

      await waitFor(() => {
        expect(mockGetUserTemplatesByCategory).toHaveBeenCalledWith(
          "algorithm",
        );
      });
    });
  });

  describe("handleCategoryChange", () => {
    it("카테고리 변경 시 관련 상태를 초기화해야 한다", async () => {
      const { result } = renderHook(() => useGrading());

      await waitFor(() => {
        expect(mockGetUserTemplatesByCategory).toHaveBeenCalled();
      });

      act(() => {
        result.current.handleCategoryChange("english");
      });

      expect(result.current.currentCategory).toBe("english");
      expect(result.current.selectedTemplateId).toBe("");
      expect(result.current.userCode).toBe("");
      expect(result.current.gradingResult).toBeNull();
    });
  });

  describe("handleTemplateChange", () => {
    it("템플릿 변경 시 코드와 결과를 초기화해야 한다", async () => {
      const { result } = renderHook(() => useGrading());

      await waitFor(() => {
        expect(mockGetUserTemplatesByCategory).toHaveBeenCalled();
      });

      act(() => {
        result.current.setUserCode("some code");
      });

      act(() => {
        result.current.handleTemplateChange("t1");
      });

      expect(result.current.selectedTemplateId).toBe("t1");
      expect(result.current.userCode).toBe("");
      expect(result.current.gradingResult).toBeNull();
    });
  });

  describe("selectedTemplate", () => {
    it("selectedTemplateId에 해당하는 템플릿을 반환해야 한다", async () => {
      const { result } = renderHook(() => useGrading());

      await waitFor(() => {
        expect(result.current.templates).toHaveLength(2);
      });

      act(() => {
        result.current.handleTemplateChange("t1");
      });

      expect(result.current.selectedTemplate?.title).toBe("정렬 알고리즘");
    });

    it("선택된 템플릿이 없으면 undefined여야 한다", () => {
      const { result } = renderHook(() => useGrading());
      expect(result.current.selectedTemplate).toBeUndefined();
    });
  });

  describe("handleGrade", () => {
    it("템플릿 미선택 시 alert을 표시해야 한다", async () => {
      const { result } = renderHook(() => useGrading());

      await act(async () => {
        await result.current.handleGrade();
      });

      expect(mockAlert).toHaveBeenCalledWith("템플릿을 먼저 선택해주세요.");
    });

    it("채점 후 gradingResult가 설정되어야 한다", async () => {
      mockSaveSubmission.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGrading());

      await waitFor(() => {
        expect(result.current.templates).toHaveLength(2);
      });

      act(() => {
        result.current.handleTemplateChange("t1");
      });

      act(() => {
        result.current.setUserCode(
          "function bubbleSort(arr) {\n  return arr.sort();\n}",
        );
      });

      await act(async () => {
        await result.current.handleGrade();
      });

      expect(result.current.gradingResult).not.toBeNull();
      expect(result.current.gradingResult!.accuracy).toBe(100);
    });

    it("정답과 다른 코드일 경우 정확도가 100 미만이어야 한다", async () => {
      mockSaveSubmission.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGrading());

      await waitFor(() => {
        expect(result.current.templates).toHaveLength(2);
      });

      act(() => {
        result.current.handleTemplateChange("t1");
      });

      act(() => {
        result.current.setUserCode("function wrongCode() {\n  return null;\n}");
      });

      await act(async () => {
        await result.current.handleGrade();
      });

      expect(result.current.gradingResult).not.toBeNull();
      expect(result.current.gradingResult!.accuracy).toBeLessThan(100);
    });

    it("채점 후 saveSubmission을 호출해야 한다", async () => {
      mockSaveSubmission.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGrading());

      await waitFor(() => {
        expect(result.current.templates).toHaveLength(2);
      });

      act(() => {
        result.current.handleTemplateChange("t1");
        result.current.setUserCode("test code");
      });

      await act(async () => {
        await result.current.handleGrade();
      });

      expect(mockSaveSubmission).toHaveBeenCalledWith(
        "t1",
        "정렬 알고리즘",
        "algorithm",
        "test code",
        expect.any(Object),
      );
    });
  });

  describe("handleReset", () => {
    it("코드와 채점 결과를 초기화해야 한다", async () => {
      mockSaveSubmission.mockResolvedValue(undefined);

      const { result } = renderHook(() => useGrading());

      await waitFor(() => {
        expect(result.current.templates).toHaveLength(2);
      });

      act(() => {
        result.current.handleTemplateChange("t1");
        result.current.setUserCode("some code");
      });

      await act(async () => {
        await result.current.handleGrade();
      });

      act(() => {
        result.current.handleReset();
      });

      expect(result.current.userCode).toBe("");
      expect(result.current.gradingResult).toBeNull();
    });

    it("selectedTemplateId는 유지해야 한다", async () => {
      const { result } = renderHook(() => useGrading());

      await waitFor(() => {
        expect(result.current.templates).toHaveLength(2);
      });

      act(() => {
        result.current.handleTemplateChange("t1");
      });

      act(() => {
        result.current.handleReset();
      });

      expect(result.current.selectedTemplateId).toBe("t1");
    });
  });
});
