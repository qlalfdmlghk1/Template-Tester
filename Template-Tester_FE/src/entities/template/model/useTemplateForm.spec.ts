import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTemplateForm } from "./useTemplateForm";

// --- Mocks ---

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const mockGetUserTemplates = vi.fn();
const mockSaveUserTemplate = vi.fn();
const mockUpdateUserTemplate = vi.fn();

vi.mock("../api/template.api", () => ({
  getUserTemplates: (...args: unknown[]) => mockGetUserTemplates(...args),
  saveUserTemplate: (...args: unknown[]) => mockSaveUserTemplate(...args),
  updateUserTemplate: (...args: unknown[]) => mockUpdateUserTemplate(...args),
}));

// alert mock
const mockAlert = vi.fn();
vi.stubGlobal("alert", mockAlert);

// --- Tests ---

describe("useTemplateForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== 초기 상태 테스트 =====

  describe("초기 상태 (생성 모드)", () => {
    it("templateId가 없으면 isEditMode가 false여야 한다", () => {
      const { result } = renderHook(() => useTemplateForm());

      expect(result.current.isEditMode).toBe(false);
    });

    it("기본 카테고리는 algorithm이어야 한다", () => {
      const { result } = renderHook(() => useTemplateForm());

      expect(result.current.currentCategory).toBe("algorithm");
    });

    it("기본 templateType은 paragraph여야 한다", () => {
      const { result } = renderHook(() => useTemplateForm());

      expect(result.current.templateType).toBe("paragraph");
    });

    it("title, description, answer가 빈 문자열이어야 한다", () => {
      const { result } = renderHook(() => useTemplateForm());

      expect(result.current.title).toBe("");
      expect(result.current.description).toBe("");
      expect(result.current.answer).toBe("");
    });

    it("isSubmitting, isLoading이 false여야 한다", () => {
      const { result } = renderHook(() => useTemplateForm());

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ===== 편집 모드 테스트 =====

  describe("편집 모드 (templateId 전달)", () => {
    it("templateId가 있으면 isEditMode가 true여야 한다", () => {
      mockGetUserTemplates.mockResolvedValue([]);

      const { result } = renderHook(() => useTemplateForm("test-id"));

      expect(result.current.isEditMode).toBe(true);
    });

    it("편집 모드 진입 시 기존 템플릿 데이터를 로드해야 한다", async () => {
      const mockTemplate = {
        id: "test-id",
        category: "english" as const,
        title: "테스트 제목",
        description: "테스트 설명",
        answer: "테스트 답변",
        type: "problem" as const,
      };

      mockGetUserTemplates.mockResolvedValue([mockTemplate]);

      const { result } = renderHook(() => useTemplateForm("test-id"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentCategory).toBe("english");
      expect(result.current.title).toBe("테스트 제목");
      expect(result.current.description).toBe("테스트 설명");
      expect(result.current.answer).toBe("테스트 답변");
      expect(result.current.templateType).toBe("problem");
    });

    it("존재하지 않는 templateId일 경우 alert 후 홈으로 이동해야 한다", async () => {
      mockGetUserTemplates.mockResolvedValue([]);

      renderHook(() => useTemplateForm("nonexistent-id"));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith("템플릿을 찾을 수 없습니다.");
      });

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("템플릿 로드 실패 시 에러 alert을 표시해야 한다", async () => {
      mockGetUserTemplates.mockRejectedValue(new Error("네트워크 오류"));

      renderHook(() => useTemplateForm("test-id"));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          "템플릿을 불러오는데 실패했습니다.",
        );
      });
    });
  });

  // ===== 상태 변경 테스트 =====

  describe("상태 변경 (setter)", () => {
    it("setTitle로 제목을 변경할 수 있어야 한다", () => {
      const { result } = renderHook(() => useTemplateForm());

      act(() => {
        result.current.setTitle("새 제목");
      });

      expect(result.current.title).toBe("새 제목");
    });

    it("setCurrentCategory로 카테고리를 변경할 수 있어야 한다", () => {
      const { result } = renderHook(() => useTemplateForm());

      act(() => {
        result.current.setCurrentCategory("cs");
      });

      expect(result.current.currentCategory).toBe("cs");
    });

    it("setTemplateType으로 타입을 변경할 수 있어야 한다", () => {
      const { result } = renderHook(() => useTemplateForm());

      act(() => {
        result.current.setTemplateType("problem");
      });

      expect(result.current.templateType).toBe("problem");
    });
  });

  // ===== handleSubmit 테스트 =====

  describe("handleSubmit", () => {
    it("제목이 비어있으면 alert을 표시하고 제출하지 않아야 한다", async () => {
      const { result } = renderHook(() => useTemplateForm());

      act(() => {
        result.current.setAnswer("답변 있음");
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockAlert).toHaveBeenCalledWith("템플릿 제목을 입력해주세요.");
      expect(mockSaveUserTemplate).not.toHaveBeenCalled();
    });

    it("답변이 비어있으면 alert을 표시하고 제출하지 않아야 한다", async () => {
      const { result } = renderHook(() => useTemplateForm());

      act(() => {
        result.current.setTitle("제목 있음");
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockAlert).toHaveBeenCalledWith("정답 내용을 입력해주세요.");
      expect(mockSaveUserTemplate).not.toHaveBeenCalled();
    });

    it("생성 모드에서 saveUserTemplate을 호출해야 한다", async () => {
      mockSaveUserTemplate.mockResolvedValue("new-id");

      const { result } = renderHook(() => useTemplateForm());

      act(() => {
        result.current.setTitle("새 템플릿");
        result.current.setDescription("설명");
        result.current.setAnswer("정답");
        result.current.setCurrentCategory("cs");
        result.current.setTemplateType("problem");
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockSaveUserTemplate).toHaveBeenCalledWith(
        "cs",
        "새 템플릿",
        "설명",
        "정답",
        "problem",
      );
      expect(mockAlert).toHaveBeenCalledWith(
        "템플릿이 성공적으로 등록되었습니다!",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/my-templates");
    });

    it("편집 모드에서 updateUserTemplate을 호출해야 한다", async () => {
      const mockTemplate = {
        id: "edit-id",
        category: "algorithm" as const,
        title: "기존 제목",
        description: "기존 설명",
        answer: "기존 답변",
        type: "paragraph" as const,
      };

      mockGetUserTemplates.mockResolvedValue([mockTemplate]);
      mockUpdateUserTemplate.mockResolvedValue(undefined);

      const { result } = renderHook(() => useTemplateForm("edit-id"));

      await waitFor(() => {
        expect(result.current.title).toBe("기존 제목");
      });

      act(() => {
        result.current.setTitle("수정된 제목");
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockUpdateUserTemplate).toHaveBeenCalledWith(
        "edit-id",
        "algorithm",
        "수정된 제목",
        "기존 설명",
        "기존 답변",
        "paragraph",
      );
      expect(mockAlert).toHaveBeenCalledWith(
        "템플릿이 성공적으로 수정되었습니다!",
      );
      expect(mockNavigate).toHaveBeenCalledWith("/my-templates");
    });

    it("저장 실패 시 에러 메시지를 alert으로 표시해야 한다", async () => {
      mockSaveUserTemplate.mockRejectedValue(
        new Error("저장 중 오류 발생"),
      );

      const { result } = renderHook(() => useTemplateForm());

      act(() => {
        result.current.setTitle("제목");
        result.current.setAnswer("답변");
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockAlert).toHaveBeenCalledWith("저장 중 오류 발생");
      expect(mockNavigate).not.toHaveBeenCalledWith("/my-templates");
    });

    it("제출 중 isSubmitting이 true였다가 완료 후 false가 되어야 한다", async () => {
      let resolvePromise: (value: string) => void;
      mockSaveUserTemplate.mockImplementation(
        () =>
          new Promise<string>((resolve) => {
            resolvePromise = resolve;
          }),
      );

      const { result } = renderHook(() => useTemplateForm());

      act(() => {
        result.current.setTitle("제목");
        result.current.setAnswer("답변");
      });

      let submitPromise: Promise<void>;
      act(() => {
        submitPromise = result.current.handleSubmit();
      });

      // 제출 중에는 isSubmitting이 true
      expect(result.current.isSubmitting).toBe(true);

      await act(async () => {
        resolvePromise!("new-id");
        await submitPromise!;
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  // ===== handleReset 테스트 =====

  describe("handleReset", () => {
    it("폼 필드를 초기값으로 리셋해야 한다", () => {
      const { result } = renderHook(() => useTemplateForm());

      act(() => {
        result.current.setTitle("입력된 제목");
        result.current.setDescription("입력된 설명");
        result.current.setAnswer("입력된 답변");
        result.current.setTemplateType("problem");
      });

      expect(result.current.title).toBe("입력된 제목");

      act(() => {
        result.current.handleReset();
      });

      expect(result.current.title).toBe("");
      expect(result.current.description).toBe("");
      expect(result.current.answer).toBe("");
      expect(result.current.templateType).toBe("paragraph");
    });

    it("카테고리는 리셋하지 않아야 한다", () => {
      const { result } = renderHook(() => useTemplateForm());

      act(() => {
        result.current.setCurrentCategory("english");
        result.current.setTitle("제목");
      });

      act(() => {
        result.current.handleReset();
      });

      // 카테고리는 handleReset에 포함되지 않으므로 유지
      expect(result.current.currentCategory).toBe("english");
    });
  });
});
