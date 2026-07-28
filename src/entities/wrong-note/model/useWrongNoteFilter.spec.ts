import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWrongNoteFilter } from "./useWrongNoteFilter";

describe("useWrongNoteFilter", () => {
  describe("초기 상태", () => {
    it("모든 필터가 빈 문자열이어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteFilter());

      expect(result.current.filters).toEqual({
        platform: "",
        category: "",
        language: "",
        result: "",
        tag: "",
      });
    });

    it("sortBy 기본값은 latest여야 한다", () => {
      const { result } = renderHook(() => useWrongNoteFilter());
      expect(result.current.sortBy).toBe("latest");
    });

    it("searchQuery 기본값은 빈 문자열이어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteFilter());
      expect(result.current.searchQuery).toBe("");
    });

    it("활성 필터가 없어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteFilter());
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe("handleFilterChange", () => {
    it("특정 필터 키를 변경할 수 있어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteFilter());

      act(() => {
        result.current.handleFilterChange("platform", "programmers");
      });

      expect(result.current.filters.platform).toBe("programmers");
      expect(result.current.filters.category).toBe("");
    });

    it("여러 필터를 동시에 설정할 수 있어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteFilter());

      act(() => {
        result.current.handleFilterChange("platform", "baekjoon");
        result.current.handleFilterChange("result", "correct");
      });

      expect(result.current.filters.platform).toBe("baekjoon");
      expect(result.current.filters.result).toBe("correct");
    });
  });

  describe("handleSortByChange", () => {
    it("정렬 기준을 변경할 수 있어야 한다", () => {
      const { result } = renderHook(() => useWrongNoteFilter());

      act(() => {
        result.current.handleSortByChange("oldest");
      });

      expect(result.current.sortBy).toBe("oldest");
    });
  });

  describe("hasActiveFilters", () => {
    it("platform 필터가 설정되면 true여야 한다", () => {
      const { result } = renderHook(() => useWrongNoteFilter());

      act(() => {
        result.current.handleFilterChange("platform", "programmers");
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("result 필터가 설정되면 true여야 한다", () => {
      const { result } = renderHook(() => useWrongNoteFilter());

      act(() => {
        result.current.handleFilterChange("result", "wrong");
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("searchQuery가 설정되면 true여야 한다", () => {
      const { result } = renderHook(() => useWrongNoteFilter());

      act(() => {
        result.current.setSearchQuery("검색어");
      });

      expect(result.current.hasActiveFilters).toBe(true);
    });

    it("category, language 필터만 설정되면 false여야 한다", () => {
      const { result } = renderHook(() => useWrongNoteFilter());

      act(() => {
        result.current.handleFilterChange("category", "dp");
        result.current.handleFilterChange("language", "python");
      });

      // hasActiveFilters는 platform, result, tag, searchQuery만 체크
      expect(result.current.hasActiveFilters).toBe(false);
    });
  });

  describe("clearFilters", () => {
    it("모든 필터와 검색어를 초기화해야 한다", () => {
      const { result } = renderHook(() => useWrongNoteFilter());

      act(() => {
        result.current.handleFilterChange("platform", "programmers");
        result.current.handleFilterChange("result", "correct");
        result.current.handleFilterChange("tag", "algorithm_fail");
        result.current.setSearchQuery("검색어");
      });

      expect(result.current.hasActiveFilters).toBe(true);

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.filters).toEqual({
        platform: "",
        category: "",
        language: "",
        result: "",
        tag: "",
      });
      expect(result.current.searchQuery).toBe("");
      expect(result.current.hasActiveFilters).toBe(false);
    });

    it("sortBy는 초기화하지 않아야 한다", () => {
      const { result } = renderHook(() => useWrongNoteFilter());

      act(() => {
        result.current.handleSortByChange("oldest");
        result.current.handleFilterChange("platform", "baekjoon");
      });

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.sortBy).toBe("oldest");
    });
  });
});
