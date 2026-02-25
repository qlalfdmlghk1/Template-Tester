import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "./useTheme";

// --- Mocks ---

const mockMatchMedia = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();

  // matchMedia mock
  mockMatchMedia.mockReturnValue({
    matches: false,
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: mockMatchMedia,
  });

  // document.documentElement.setAttribute mock
  vi.spyOn(document.documentElement, "setAttribute");
});

// --- Tests ---

describe("useTheme", () => {
  describe("초기 상태", () => {
    it("localStorage에 값이 없고 시스템이 light이면 light여야 한다", () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe("light");
      expect(result.current.isDark).toBe(false);
    });

    it("localStorage에 dark가 저장되어 있으면 dark여야 한다", () => {
      localStorage.setItem("theme", "dark");

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe("dark");
      expect(result.current.isDark).toBe(true);
    });

    it("localStorage에 light가 저장되어 있으면 light여야 한다", () => {
      localStorage.setItem("theme", "light");

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe("light");
    });

    it("시스템이 다크 모드이고 localStorage가 비어있으면 dark여야 한다", () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      });

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe("dark");
    });
  });

  describe("toggleTheme", () => {
    it("light에서 dark로 토글해야 한다", () => {
      localStorage.setItem("theme", "light");

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe("dark");
      expect(result.current.isDark).toBe(true);
    });

    it("dark에서 light로 토글해야 한다", () => {
      localStorage.setItem("theme", "dark");

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe("light");
      expect(result.current.isDark).toBe(false);
    });
  });

  describe("setTheme", () => {
    it("테마를 직접 설정할 수 있어야 한다", () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme("dark");
      });

      expect(result.current.theme).toBe("dark");
    });
  });

  describe("DOM 업데이트", () => {
    it("테마 변경 시 data-theme 속성을 업데이트해야 한다", () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme("dark");
      });

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        "data-theme",
        "dark",
      );
    });

    it("테마 변경 시 localStorage에 저장해야 한다", () => {
      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme("dark");
      });

      expect(localStorage.getItem("theme")).toBe("dark");
    });
  });

  describe("시스템 테마 변경 감지", () => {
    it("matchMedia change 이벤트를 구독해야 한다", () => {
      renderHook(() => useTheme());

      expect(mockAddEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );
    });

    it("언마운트 시 이벤트 리스너를 제거해야 한다", () => {
      const { unmount } = renderHook(() => useTheme());

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        "change",
        expect.any(Function),
      );
    });
  });
});
