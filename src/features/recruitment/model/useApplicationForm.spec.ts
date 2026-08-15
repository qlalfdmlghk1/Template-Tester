import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useApplicationForm } from "./useApplicationForm";
import { createEmptyStages } from "@/entities/job-application/model/stage";
import type { JobApplication } from "@/entities/job-application/model/application.type";
import type { Company } from "@/entities/company/model/company.type";

const extractPostingMock = vi.hoisted(() => vi.fn());

vi.mock("@/entities/job-application/api/posting.api", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/entities/job-application/api/posting.api")>();
  return { ...actual, extractPosting: extractPostingMock };
});

const SAMPLE_KEY = "sk-ant-test-key";

const COMPANIES: Company[] = [
  { id: "company-1", userId: "user-1", name: "삼성전자", createdAt: new Date() },
];

function makeApplication(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: "app-1",
    userId: "user-1",
    companyId: "company-1",
    postingTitle: "2026 상반기 신입",
    jobTag: "IT",
    headcount: null,
    stages: createEmptyStages(),
    createdAt: new Date("2026-08-01T00:00:00Z"),
    ...overrides,
  };
}

function renderForm(application: JobApplication | null) {
  return renderHook(() =>
    useApplicationForm({ application, companies: COMPANIES, referenceYear: 2026 }),
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("anthropic-api-key", SAMPLE_KEY);
  extractPostingMock.mockReset();
});

afterEach(() => {
  localStorage.clear();
});

describe("useApplicationForm — buildValue", () => {
  it("추출을 돌리지 않았으면 stages 를 넘기지 않아야 한다", () => {
    // stages 키를 실으면 undefined 가 toUpdatePayload 에서 deleteField() 로 바뀌어
    // 수정만 해도 전형 상태·일정·메모가 통째로 지워진다
    const { result } = renderForm(makeApplication());

    // 소비처(useRecruitmentPage)가 이 값이 없을 때 payload 에서 키를 뺀다.
    // 실제 가드는 거기 있으므로 이 단언만으로는 회귀를 못 잡는다 — 별도 테스트 필요.
    expect(result.current.buildValue().stages).toBeUndefined();
  });

  it("빈 폼에서는 모집 요강도 넘기지 않아야 한다", () => {
    const { result } = renderForm(null);
    const value = result.current.buildValue();

    expect(value.jobDescription).toBeUndefined();
    expect(value.requirements).toBeUndefined();
    expect(value.preferredQualifications).toBeUndefined();
  });

  it("공고명을 비워 두면 그 건이 속한 반기로 채워야 한다", () => {
    // 같은 기업에 여러 번 지원하면 목록에서 구분되지 않는다.
    // 등록 시점이 2026-08 이므로 하반기
    const { result } = renderForm(makeApplication({ postingTitle: "" }));

    expect(result.current.buildValue().postingTitle).toBe("2026 하반기");
  });

  it("자소서 마감일이 있으면 등록 시점이 아니라 그 날짜의 반기를 쓴다", () => {
    // 목록에서 잡히는 반기와 어긋나면 안 된다
    const stages: JobApplication["stages"] = createEmptyStages();
    stages.resume = {
      status: "PENDING",
      schedule: { kind: "exact", at: "2026-03-11", hasTime: false },
    };

    const { result } = renderForm(makeApplication({ postingTitle: "", stages }));

    expect(result.current.buildValue().postingTitle).toBe("2026 상반기");
  });

  it("공백만 적은 공고명도 비운 것으로 본다", () => {
    const { result } = renderForm(makeApplication({ postingTitle: "   " }));

    expect(result.current.buildValue().postingTitle).toBe("2026 하반기");
  });

  it("공고명을 적었으면 그대로 둔다", () => {
    const { result } = renderForm(makeApplication({ postingTitle: "2026 상반기 수시" }));

    expect(result.current.buildValue().postingTitle).toBe("2026 상반기 수시");
  });

  it("수정 대상의 기존 값을 초기값으로 실어야 한다", () => {
    const { result } = renderForm(
      makeApplication({ jobDescription: "웹 개발", memo: "메모" }),
    );

    const value = result.current.buildValue();
    expect(value.jobDescription).toBe("웹 개발");
    expect(value.memo).toBe("메모");
  });
});

describe("useApplicationForm — 추출 결과 반영", () => {
  it("비어 있던 칸만 채우고 그 칸의 출처만 남겨야 한다", async () => {
    // 사용자가 직접 쓴 본문 아래에 AI 출처가 붙으면 근거가 내용과 어긋난다
    extractPostingMock.mockResolvedValue({
      jobDescription: "AI 가 뽑은 직무 설명",
      requirements: "AI 가 뽑은 자격 요건",
      sources: {
        jobDescription: [{ url: "https://a.example.com/jd" }],
        requirements: [{ url: "https://a.example.com/req" }],
      },
    });

    const { result } = renderForm(
      makeApplication({ requirements: "내가 직접 적은 자격 요건" }),
    );

    await act(async () => {
      await result.current.runExtract({ pastedText: "본문" });
    });

    await waitFor(() => {
      const value = result.current.buildValue();
      // 비어 있던 칸만 채워진다
      expect(value.jobDescription).toBe("AI 가 뽑은 직무 설명");
      // 사용자가 적은 칸은 그대로
      expect(value.requirements).toBe("내가 직접 적은 자격 요건");
      // 덮지 않은 칸의 출처는 붙이지 않는다
      expect(value.postingSources).toEqual({
        jobDescription: [{ url: "https://a.example.com/jd" }],
      });
    });
  });

  it("채운 항목이 없으면 실행 시각을 남기지 않아야 한다", async () => {
    extractPostingMock.mockResolvedValue({
      jobDescription: "AI 가 뽑은 직무 설명",
      sources: { jobDescription: [{ url: "https://a.example.com/jd" }] },
    });

    const { result } = renderForm(
      makeApplication({ jobDescription: "내가 이미 적어 둔 직무 설명" }),
    );

    await act(async () => {
      await result.current.runExtract({ pastedText: "본문" });
    });

    await waitFor(() => {
      expect(result.current.buildValue().extractedAt).toBeUndefined();
    });
  });

  it("일정을 뽑았으면 단계 맵으로 옮겨 담아야 한다", async () => {
    extractPostingMock.mockResolvedValue({
      jobDescription: "웹 개발",
      sources: {},
      rawSchedules: { resume: { kind: "exact", at: "03-11T17:00" } },
    });

    const { result } = renderForm(makeApplication());

    await act(async () => {
      await result.current.runExtract({ pastedText: "본문" });
    });

    await waitFor(() => expect(result.current.schedules).toHaveLength(1));

    const value = result.current.buildValue();
    expect(value.stages?.resume.schedule).toEqual({
      kind: "exact",
      at: "2026-03-11T17:00",
      hasTime: true,
    });
    // 일정만 채우고 상태는 건드리지 않는다
    expect(value.stages?.resume.status).toBe("PENDING");
  });

  it("일정을 빼면 단계 맵도 넘기지 않아야 한다", async () => {
    extractPostingMock.mockResolvedValue({
      jobDescription: "웹 개발",
      sources: {},
      rawSchedules: { resume: { kind: "exact", at: "03-11" } },
    });

    const { result } = renderForm(makeApplication());

    await act(async () => {
      await result.current.runExtract({ pastedText: "본문" });
    });

    await waitFor(() => expect(result.current.schedules).toHaveLength(1));

    act(() => result.current.removeSchedule(result.current.schedules[0]));

    expect(result.current.buildValue().stages).toBeUndefined();
  });
});
