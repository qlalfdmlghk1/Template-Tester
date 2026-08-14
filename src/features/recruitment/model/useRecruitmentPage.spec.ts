import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecruitmentPage } from "./useRecruitmentPage";
import { createEmptyStages } from "@/entities/job-application/model/stage";
import type { JobApplication } from "@/entities/job-application/model/application.type";
import type { ApplicationFormValue } from "./useApplicationForm";

const editApplicationMock = vi.hoisted(() => vi.fn());
const addApplicationMock = vi.hoisted(() => vi.fn());
const selectHalfMock = vi.hoisted(() => vi.fn());

vi.mock("./useRecruitmentBoard", () => ({
  useRecruitmentBoard: () => ({
    rows: [],
    companies: [],
    activeHalfId: "2026-H2",
    addCompany: vi.fn(),
    addApplication: addApplicationMock,
    editApplication: editApplicationMock,
    removeApplication: vi.fn(),
    editStage: vi.fn(),
    selectHalf: selectHalfMock,
    reload: vi.fn(),
  }),
}));

vi.mock("./useXlsxImport", () => ({
  useXlsxImport: () => ({ reset: vi.fn(), applySelected: vi.fn() }),
}));

vi.mock("@/shared/ui/molecules/AppToast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

function makeApplication(): JobApplication {
  return {
    id: "app-1",
    userId: "user-1",
    companyId: "company-1",
    postingTitle: "2026 상반기 신입",
    jobTag: "IT",
    headcount: null,
    stages: createEmptyStages(),
    createdAt: new Date("2026-08-01T00:00:00Z"),
  };
}

function makeValue(overrides: Partial<ApplicationFormValue> = {}): ApplicationFormValue {
  return {
    companyId: "company-1",
    newCompany: null,
    postingTitle: "2026 상반기 신입",
    jobTag: "IT",
    headcount: null,
    ...overrides,
  };
}

beforeEach(() => {
  editApplicationMock.mockReset().mockResolvedValue(undefined);
  addApplicationMock.mockReset().mockResolvedValue("app-new");
  selectHalfMock.mockReset();
});

describe("useRecruitmentPage — submitForm 의 stages 처리", () => {
  it("추출을 돌리지 않은 수정에는 stages 키를 싣지 않아야 한다", async () => {
    // 키를 실으면 undefined 가 toUpdatePayload 에서 deleteField() 로 바뀌어
    // 메모만 고쳐도 전형 상태·일정·단계 메모가 통째로 지워진다
    const { result } = renderHook(() => useRecruitmentPage());

    act(() => result.current.openEditForm(makeApplication()));

    await act(async () => {
      await result.current.submitForm(makeValue({ memo: "메모만 고침" }));
    });

    expect(editApplicationMock).toHaveBeenCalledTimes(1);
    const [, payload] = editApplicationMock.mock.calls[0];
    expect("stages" in payload).toBe(false);
  });

  it("추출로 일정을 뽑았으면 stages 를 실어야 한다", async () => {
    const stages: JobApplication["stages"] = createEmptyStages();
    stages.resume = {
      status: "PENDING",
      schedule: { kind: "exact", at: "2026-03-11", hasTime: false },
    };

    const { result } = renderHook(() => useRecruitmentPage());

    act(() => result.current.openEditForm(makeApplication()));

    await act(async () => {
      await result.current.submitForm(makeValue({ stages }));
    });

    const [, payload] = editApplicationMock.mock.calls[0];
    expect(payload.stages).toBe(stages);
  });

  it("신규 등록도 일정이 없으면 stages 키를 싣지 않아야 한다", async () => {
    const { result } = renderHook(() => useRecruitmentPage());

    act(() => result.current.openCreateForm());

    await act(async () => {
      await result.current.submitForm(makeValue());
    });

    expect(addApplicationMock).toHaveBeenCalledTimes(1);
    expect("stages" in addApplicationMock.mock.calls[0][0]).toBe(false);
  });

  it("신규 등록에 자소서 마감일이 있으면 그 날짜의 반기로 옮겨야 한다", async () => {
    // 등록 시점 반기로 옮기면 방금 만든 건이 목록에서 사라진 것처럼 보인다
    const stages: JobApplication["stages"] = createEmptyStages();
    stages.resume = {
      status: "PENDING",
      schedule: { kind: "exact", at: "2026-03-11", hasTime: false },
    };

    const { result } = renderHook(() => useRecruitmentPage());

    act(() => result.current.openCreateForm());

    await act(async () => {
      await result.current.submitForm(makeValue({ stages }));
    });

    expect(selectHalfMock).toHaveBeenCalledWith("2026-H1");
  });
});
