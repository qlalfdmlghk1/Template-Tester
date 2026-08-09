import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { useCompanyResearch } from "./useCompanyResearch";

vi.mock("@/entities/company/model/useCompanies", () => ({
  useCompanies: () => ({
    companies: [],
    isLoading: false,
    error: null,
    removeCompany: vi.fn(),
    reload: vi.fn(),
  }),
}));

vi.mock("@/entities/job-application/model/useApplications", () => ({
  useApplications: () => ({ applications: [], reload: vi.fn() }),
}));

vi.mock("@/shared/ui/molecules/AppToast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useCompanyResearch — 검색어 입력", () => {
  it("입력값은 즉시 반영돼야 한다", () => {
    // 주소 갱신을 기다렸다가 반영하면 한글 조합이 끊긴다
    const { result } = renderHook(() => useCompanyResearch(), { wrapper });

    act(() => result.current.setKeyword("삼"));
    expect(result.current.keyword).toBe("삼");

    act(() => result.current.setKeyword("삼성"));
    expect(result.current.keyword).toBe("삼성");
  });

  it("타이핑이 잠잠해진 뒤에만 주소에 반영해야 한다", () => {
    const { result } = renderHook(() => useCompanyResearch(), { wrapper });

    act(() => result.current.setKeyword("삼성"));
    expect(window.location.search).not.toContain("q=");

    act(() => void vi.advanceTimersByTime(400));
    expect(result.current.keyword).toBe("삼성");
  });
});
