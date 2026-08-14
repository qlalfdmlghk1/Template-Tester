import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useJobPostingExtract } from "./useJobPostingExtract";
import { PostingExtractError } from "@/entities/job-application/api/posting.api";
import { createEmptyStages } from "@/entities/job-application/model/stage";
import type { StageEntry } from "@/entities/job-application/model/application.type";
import type { JobApplication } from "@/entities/job-application/model/application.type";
import type { StageKey } from "@/entities/job-application/model/stage";

const extractPostingMock = vi.hoisted(() => vi.fn());

vi.mock("@/entities/job-application/api/posting.api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/job-application/api/posting.api")>();
  return { ...actual, extractPosting: extractPostingMock };
});

const SAMPLE_KEY = "sk-ant-test-key";
const TARGET = { url: "https://example.com/job/1", companyName: "삼성전자" };

function makeApplication(
  stages: Partial<Record<StageKey, StageEntry>> = {},
): JobApplication {
  return {
    id: "app-1",
    userId: "user-1",
    companyId: "company-1",
    postingTitle: "2026 상반기 신입",
    jobTag: "IT",
    headcount: null,
    stages: { ...createEmptyStages(), ...stages } as JobApplication["stages"],
    createdAt: new Date("2026-08-01T00:00:00Z"),
  };
}

const OPTIONS = { application: makeApplication(), referenceYear: 2026 };

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("anthropic-api-key", SAMPLE_KEY);
  extractPostingMock.mockReset();
});

afterEach(() => {
  localStorage.clear();
});

describe("useJobPostingExtract", () => {
  it("키가 없으면 호출하지 않아야 한다", async () => {
    localStorage.clear();
    const { result } = renderHook(() => useJobPostingExtract(OPTIONS));

    expect(result.current.hasApiKey).toBe(false);

    await act(async () => {
      await result.current.run(TARGET);
    });

    expect(extractPostingMock).not.toHaveBeenCalled();
  });

  it("성공하면 내용이 있는 항목이 기본 선택돼야 한다", async () => {
    extractPostingMock.mockResolvedValue({
      jobDescription: "웹 서비스 개발",
      requirements: "",
      preferredQualifications: "React 경험",
      sources: {},
    });

    const { result } = renderHook(() => useJobPostingExtract(OPTIONS));

    await act(async () => {
      await result.current.run(TARGET);
    });

    await waitFor(() => {
      expect(result.current.selectedFields).toEqual([
        "jobDescription",
        "preferredQualifications",
      ]);
    });
  });

  it("공고를 못 읽으면 폴백을 유도할 수 있게 종류를 남겨야 한다", async () => {
    extractPostingMock.mockRejectedValue(
      new PostingExtractError("공고 페이지를 읽지 못했습니다.", "fetchBlocked"),
    );

    const { result } = renderHook(() => useJobPostingExtract(OPTIONS));

    await act(async () => {
      await result.current.run(TARGET);
    });

    await waitFor(() => {
      expect(result.current.errorKind).toBe("fetchBlocked");
      expect(result.current.error).toContain("읽지 못했습니다");
    });
  });

  it("항목 선택을 토글할 수 있어야 한다", async () => {
    extractPostingMock.mockResolvedValue({
      jobDescription: "웹 서비스 개발",
      requirements: "경력 3년 이상",
      sources: {},
    });

    const { result } = renderHook(() => useJobPostingExtract(OPTIONS));

    await act(async () => {
      await result.current.run(TARGET);
    });

    await waitFor(() => expect(result.current.selectedFields).toHaveLength(2));

    act(() => result.current.toggleField("requirements"));

    expect(result.current.selectedFields).toEqual(["jobDescription"]);
  });

  it("텍스트만 닫아도 일정 초안은 남아야 한다", async () => {
    // 반영 단위가 나뉘어 있으므로 닫는 단위도 나뉘어야 한다 —
    // 한쪽을 반영했다고 다른 쪽 초안까지 지우면 유료 호출을 다시 해야 한다
    extractPostingMock.mockResolvedValue({
      jobDescription: "웹 서비스 개발",
      sources: {},
      rawSchedules: { resume: { kind: "exact", at: "03-11" } },
    });

    const { result } = renderHook(() => useJobPostingExtract(OPTIONS));

    await act(async () => {
      await result.current.run(TARGET);
    });

    await waitFor(() => expect(result.current.scheduleDrafts).toHaveLength(1));

    act(() => result.current.dismissFields());

    expect(result.current.result).toBeNull();
    expect(result.current.scheduleDrafts).toHaveLength(1);
  });

  it("일정만 닫아도 텍스트 결과는 남아야 한다", async () => {
    extractPostingMock.mockResolvedValue({
      jobDescription: "웹 서비스 개발",
      sources: {},
      rawSchedules: { resume: { kind: "exact", at: "03-11" } },
    });

    const { result } = renderHook(() => useJobPostingExtract(OPTIONS));

    await act(async () => {
      await result.current.run(TARGET);
    });

    await waitFor(() => expect(result.current.scheduleDrafts).toHaveLength(1));

    act(() => result.current.dismissSchedules());

    expect(result.current.scheduleDrafts).toEqual([]);
    expect(result.current.result).not.toBeNull();
  });

  it("닫으면 결과와 에러가 모두 지워져야 한다", async () => {
    extractPostingMock.mockRejectedValue(
      new PostingExtractError("공고 페이지를 읽지 못했습니다.", "fetchBlocked"),
    );

    const { result } = renderHook(() => useJobPostingExtract(OPTIONS));

    await act(async () => {
      await result.current.run(TARGET);
    });

    await waitFor(() => expect(result.current.errorKind).toBe("fetchBlocked"));

    act(() => result.current.dismiss());

    expect(result.current.error).toBeNull();
    expect(result.current.errorKind).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it("연도 없는 일정은 기준 연도로 채우고 추정 표시를 남겨야 한다", async () => {
    extractPostingMock.mockResolvedValue({
      jobDescription: "웹 서비스 개발",
      sources: {},
      rawSchedules: { resume: { kind: "range", start: "03-04", end: "03-11T17:00" } },
    });

    const { result } = renderHook(() => useJobPostingExtract(OPTIONS));

    await act(async () => {
      await result.current.run(TARGET);
    });

    await waitFor(() => expect(result.current.scheduleDrafts).toHaveLength(1));

    const [draft] = result.current.scheduleDrafts;
    expect(draft.stage).toBe("resume");
    expect(draft.schedule).toEqual({
      kind: "range",
      start: "2026-03-04",
      end: "2026-03-11T17:00",
      hasTime: true,
    });
    expect(draft.yearInferred).toBe(true);
    expect(result.current.selectedStages).toEqual(["resume"]);
  });

  it("이미 일정이 있는 칸은 제안하지 않아야 한다", async () => {
    extractPostingMock.mockResolvedValue({
      jobDescription: "웹 서비스 개발",
      sources: {},
      rawSchedules: { resume: { kind: "exact", at: "2026-03-11" } },
    });

    const application = makeApplication({
      resume: {
        status: "PENDING",
        schedule: { kind: "exact", at: "2026-03-01", hasTime: false },
      },
    });

    const { result } = renderHook(() =>
      useJobPostingExtract({ application, referenceYear: 2026 }),
    );

    await act(async () => {
      await result.current.run(TARGET);
    });

    await waitFor(() => expect(result.current.result).not.toBeNull());
    expect(result.current.scheduleDrafts).toEqual([]);
  });

  it("사용자가 상태를 바꾼 칸은 제안하지 않아야 한다", async () => {
    // '해당 없음'으로 정리해 둔 칸에 일정을 써넣으면 합격률 집계가 틀어진다
    extractPostingMock.mockResolvedValue({
      jobDescription: "웹 서비스 개발",
      sources: {},
      rawSchedules: { codingTest: { kind: "exact", at: "2026-04-02" } },
    });

    const application = makeApplication({
      codingTest: { status: "NOT_APPLICABLE", schedule: null },
    });

    const { result } = renderHook(() =>
      useJobPostingExtract({ application, referenceYear: 2026 }),
    );

    await act(async () => {
      await result.current.run(TARGET);
    });

    await waitFor(() => expect(result.current.result).not.toBeNull());
    expect(result.current.scheduleDrafts).toEqual([]);
  });

  it("화면을 벗어나면 요청을 끊어야 한다", async () => {
    // 서버 도구로 공고를 가져오느라 수십 초 걸리는 호출이라,
    // 받을 곳이 사라진 뒤에도 계속 돌면 사용자 본인의 한도만 축낸다
    let capturedSignal: AbortSignal | undefined;
    extractPostingMock.mockImplementation(({ signal }: { signal?: AbortSignal }) => {
      capturedSignal = signal;
      return new Promise(() => {});
    });

    const { result, unmount } = renderHook(() => useJobPostingExtract(OPTIONS));

    act(() => {
      void result.current.run(TARGET);
    });

    await waitFor(() => expect(capturedSignal).toBeDefined());
    expect(capturedSignal?.aborted).toBe(false);

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });
});
