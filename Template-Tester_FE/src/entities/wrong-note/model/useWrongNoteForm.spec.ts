import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWrongNoteForm } from "./useWrongNoteForm";

// --- Mocks ---

const mockSaveWrongNote = vi.fn();
const mockUpdateWrongNote = vi.fn();

vi.mock("../api/wrong-note.api", () => ({
  saveWrongNote: (...args: unknown[]) => mockSaveWrongNote(...args),
  updateWrongNote: (...args: unknown[]) => mockUpdateWrongNote(...args),
}));

vi.mock("@/shared/lib/options", () => ({
  programmersGrades: [
    { value: "lv1", label: "Lv.1" },
    { value: "lv2", label: "Lv.2" },
  ],
  baekjoonGrades: [
    { value: "골드1", label: "골드 1" },
    { value: "실버1", label: "실버 1" },
  ],
}));

const mockAlert = vi.fn();
vi.stubGlobal("alert", mockAlert);

// --- Tests ---

describe("useWrongNoteForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("초기 상태", () => {
    it("기본 초기값으로 폼이 생성되어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteForm());

      expect(result.current.formData).toEqual({
        title: "",
        link: "",
        language: "",
        date: "",
        platform: "",
        category: "",
        grade: "",
        myCode: "",
        solution: "",
        comment: "",
        share: false,
        tags: [],
        result: "",
      });
      expect(result.current.isSubmitting).toBe(false);
    });

    it("initialData가 있으면 해당 값으로 초기화되어야 한다", () => {
      const initialData = {
        title: "기존 제목",
        link: "https://example.com",
        language: "python",
        date: "2026-01-01",
        platform: "programmers",
        category: "dp",
        grade: "lv2",
        myCode: "print('hello')",
        solution: "print('world')",
        comment: "풀이 메모",
        share: true,
        tags: ["algorithm_fail"],
        result: "wrong",
      };

      const { result } = renderHook(() =>
        useWrongNoteForm({ initialData }),
      );

      expect(result.current.formData).toEqual(initialData);
    });
  });

  describe("handleInputChange", () => {
    it("문자열 필드를 변경할 수 있어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteForm());

      act(() => {
        result.current.handleInputChange("title", "새 제목");
      });

      expect(result.current.formData.title).toBe("새 제목");
    });

    it("boolean 필드를 변경할 수 있어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteForm());

      act(() => {
        result.current.handleInputChange("share", true);
      });

      expect(result.current.formData.share).toBe(true);
    });

    it("배열 필드를 변경할 수 있어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteForm());

      act(() => {
        result.current.handleInputChange("tags", ["algorithm_fail", "misunderstand"]);
      });

      expect(result.current.formData.tags).toEqual(["algorithm_fail", "misunderstand"]);
    });
  });

  describe("handlePlatformChange", () => {
    it("플랫폼 변경 시 grade를 초기화해야 한다", () => {
      const { result } = renderHook(() => useWrongNoteForm());

      act(() => {
        result.current.handleInputChange("grade", "lv2");
        result.current.handlePlatformChange("baekjoon");
      });

      expect(result.current.formData.platform).toBe("baekjoon");
      expect(result.current.formData.grade).toBe("");
    });
  });

  describe("getGradeOptions", () => {
    it("programmers 플랫폼이면 프로그래머스 등급을 반환해야 한다", () => {
      const { result } = renderHook(() => useWrongNoteForm());

      act(() => {
        result.current.handlePlatformChange("programmers");
      });

      const options = result.current.getGradeOptions();
      expect(options).toEqual([
        { value: "lv1", label: "Lv.1" },
        { value: "lv2", label: "Lv.2" },
      ]);
    });

    it("baekjoon 플랫폼이면 백준 등급을 반환해야 한다", () => {
      const { result } = renderHook(() => useWrongNoteForm());

      act(() => {
        result.current.handlePlatformChange("baekjoon");
      });

      const options = result.current.getGradeOptions();
      expect(options).toEqual([
        { value: "골드1", label: "골드 1" },
        { value: "실버1", label: "실버 1" },
      ]);
    });

    it("플랫폼이 없으면 빈 배열을 반환해야 한다", () => {
      const { result } = renderHook(() => useWrongNoteForm());

      const options = result.current.getGradeOptions();
      expect(options).toEqual([]);
    });
  });

  describe("resetForm", () => {
    it("폼을 기본 초기값으로 리셋해야 한다", () => {
      const { result } = renderHook(() => useWrongNoteForm());

      act(() => {
        result.current.handleInputChange("title", "입력된 제목");
        result.current.handleInputChange("share", true);
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.title).toBe("");
      expect(result.current.formData.share).toBe(false);
    });

    it("initialData가 있으면 해당 값으로 리셋해야 한다", () => {
      const initialData = {
        title: "초기 제목",
        link: "",
        language: "python",
        date: "",
        platform: "",
        category: "",
        grade: "",
        myCode: "",
        solution: "",
        comment: "",
        share: false,
        tags: [],
        result: "",
      };

      const { result } = renderHook(() =>
        useWrongNoteForm({ initialData }),
      );

      act(() => {
        result.current.handleInputChange("title", "변경된 제목");
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.formData.title).toBe("초기 제목");
    });
  });

  describe("setInitialData", () => {
    it("외부에서 폼 데이터를 직접 설정할 수 있어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteForm());

      const newData = {
        title: "외부 데이터",
        link: "https://test.com",
        language: "java",
        date: "2026-02-01",
        platform: "baekjoon",
        category: "graph",
        grade: "골드1",
        myCode: "code",
        solution: "sol",
        comment: "memo",
        share: true,
        tags: ["implementation_fail"],
        result: "timeout",
      };

      act(() => {
        result.current.setInitialData(newData);
      });

      expect(result.current.formData).toEqual(newData);
    });
  });

  describe("handleSubmit", () => {
    it("생성 모드에서 saveWrongNote를 호출해야 한다", async () => {
      mockSaveWrongNote.mockResolvedValue(undefined);
      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useWrongNoteForm({ onSuccess }),
      );

      act(() => {
        result.current.handleInputChange("title", "제목");
      });

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockSaveWrongNote).toHaveBeenCalledWith(
        expect.objectContaining({ title: "제목" }),
      );
      expect(onSuccess).toHaveBeenCalled();
    });

    it("편집 모드에서 updateWrongNote를 호출해야 한다", async () => {
      mockUpdateWrongNote.mockResolvedValue(undefined);
      const onSuccess = vi.fn();

      const { result } = renderHook(() =>
        useWrongNoteForm({ noteId: "note-123", onSuccess }),
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockUpdateWrongNote).toHaveBeenCalledWith(
        "note-123",
        expect.any(Object),
      );
      expect(onSuccess).toHaveBeenCalled();
    });

    it("저장 실패 시 alert을 표시해야 한다", async () => {
      mockSaveWrongNote.mockRejectedValue(new Error("저장 실패"));

      const { result } = renderHook(() => useWrongNoteForm());

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockAlert).toHaveBeenCalledWith("저장에 실패했습니다.");
    });

    it("제출 중 중복 호출을 방지해야 한다", async () => {
      let resolvePromise: () => void;
      mockSaveWrongNote.mockImplementation(
        () => new Promise<void>((resolve) => { resolvePromise = resolve; }),
      );

      const { result } = renderHook(() => useWrongNoteForm());

      let firstSubmit: Promise<void>;
      act(() => {
        firstSubmit = result.current.handleSubmit();
      });

      // isSubmitting이 true인 상태에서 재호출
      await act(async () => {
        await result.current.handleSubmit();
      });

      // saveWrongNote는 1번만 호출되어야 함
      expect(mockSaveWrongNote).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolvePromise!();
        await firstSubmit!;
      });
    });

    it("제출 완료 후 isSubmitting이 false가 되어야 한다", async () => {
      mockSaveWrongNote.mockResolvedValue(undefined);

      const { result } = renderHook(() => useWrongNoteForm());

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });
});
