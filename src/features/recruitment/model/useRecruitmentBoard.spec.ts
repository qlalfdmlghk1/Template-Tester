import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecruitmentBoard } from "./useRecruitmentBoard";
import { createEmptyStages } from "@/entities/job-application/model/stage";
import { ALL_HALF_ID } from "@/entities/job-application/model/half";
import type { JobApplication } from "@/entities/job-application/model/application.type";
import type { Company } from "@/entities/company/model/company.type";

const companiesMock = vi.hoisted(() => ({ value: [] as Company[] }));
const applicationsMock = vi.hoisted(() => ({ value: [] as JobApplication[] }));

vi.mock("@/entities/company/model/useCompanies", () => ({
  useCompanies: () => ({
    companies: companiesMock.value,
    isLoading: false,
    error: null,
    addCompany: vi.fn(),
    editCompany: vi.fn(),
    reload: vi.fn(),
  }),
}));

vi.mock("@/entities/job-application/model/useApplications", () => ({
  useApplications: () => ({
    applications: applicationsMock.value,
    isLoading: false,
    error: null,
    addApplication: vi.fn(),
    editApplication: vi.fn(),
    removeApplication: vi.fn(),
    editStage: vi.fn(),
    reload: vi.fn(),
  }),
}));

function makeCompany(id: string, name: string): Company {
  return { id, userId: "user-1", name, createdAt: new Date("2026-01-01") };
}

function makeApplication(id: string, companyId: string): JobApplication {
  return {
    id,
    userId: "user-1",
    companyId,
    postingTitle: "2026 하반기",
    jobTag: "IT",
    headcount: null,
    stages: createEmptyStages(),
    createdAt: new Date("2026-08-01T00:00:00Z"),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  companiesMock.value = [
    makeCompany("company-1", "삼성전자"),
    makeCompany("company-2", "네이버"),
  ];
  applicationsMock.value = [
    makeApplication("app-1", "company-1"),
    makeApplication("app-2", "company-2"),
  ];
});

afterEach(() => {
  vi.useRealTimers();
});

/** 반기 선택에 걸리지 않도록 "전체"로 열어 둔다 */
function renderBoard() {
  const rendered = renderHook(() => useRecruitmentBoard());
  act(() => rendered.result.current.selectHalf(ALL_HALF_ID));
  return rendered;
}

/** 검색어를 입력하고 디바운스가 끝날 때까지 시간을 흘린다 */
function search(rendered: ReturnType<typeof renderBoard>, keyword: string) {
  act(() => rendered.result.current.setFilter({ ...rendered.result.current.filter, keyword }));
  act(() => void vi.advanceTimersByTime(300));
}

describe("useRecruitmentBoard — 기업명 검색", () => {
  it("검색어가 없으면 모두 보여준다", () => {
    const { result } = renderBoard();

    expect(result.current.rows).toHaveLength(2);
  });

  it("기업명이 걸리는 건만 남긴다", () => {
    const rendered = renderBoard();

    search(rendered, "네이버");

    expect(rendered.result.current.rows.map((row) => row.application.id)).toEqual(["app-2"]);
  });

  it("일부만 입력해도, 대소문자가 달라도 걸린다", () => {
    companiesMock.value = [makeCompany("company-1", "Kakao")];
    applicationsMock.value = [makeApplication("app-1", "company-1")];

    const rendered = renderBoard();

    search(rendered, "kaka");

    expect(rendered.result.current.rows).toHaveLength(1);
  });

  it("앞뒤 공백만 있는 검색어는 검색으로 보지 않는다", () => {
    const rendered = renderBoard();

    search(rendered, "  ");

    expect(rendered.result.current.rows).toHaveLength(2);
  });

  it("검색으로 좁혀도 합격률 모수는 그대로다", () => {
    // 특정 기업을 찾아보는 조회이지 "이 조건의 합격률"처럼 물을 수 있는 구분이 아니다
    const rendered = renderBoard();
    const before = rendered.result.current.passRates;

    search(rendered, "네이버");

    expect(rendered.result.current.passRates).toEqual(before);
  });

  it("참조가 끊긴 지원 건은 검색어가 있으면 걸러진다", () => {
    applicationsMock.value = [makeApplication("app-3", "deleted-company")];

    const rendered = renderBoard();

    search(rendered, "삼성");

    expect(rendered.result.current.rows).toHaveLength(0);
  });

  it("필터 초기화는 검색어도 비우고, 목록을 기다리지 않고 되돌린다", () => {
    // 입력창은 즉시 비는데 목록만 300ms 남아 있으면 클릭이 안 먹은 것처럼 보인다
    const rendered = renderBoard();

    search(rendered, "네이버");
    act(() => rendered.result.current.resetFilter());

    expect(rendered.result.current.filter.keyword).toBe("");
    expect(rendered.result.current.rows).toHaveLength(2);
  });

  it("검색어를 직접 지워도 즉시 되돌아온다", () => {
    const rendered = renderBoard();

    search(rendered, "네이버");
    act(() =>
      rendered.result.current.setFilter({ ...rendered.result.current.filter, keyword: "" }),
    );

    expect(rendered.result.current.rows).toHaveLength(2);
  });
});

describe("useRecruitmentBoard — 검색어 디바운스", () => {
  it("입력값은 즉시 반영해야 한다", () => {
    // 목록과 함께 늦추면 입력창이 한 박자 늦게 따라와 한글 조합이 끊긴다
    const rendered = renderBoard();

    act(() =>
      rendered.result.current.setFilter({ ...rendered.result.current.filter, keyword: "네" }),
    );

    expect(rendered.result.current.filter.keyword).toBe("네");
  });

  it("타이핑이 잠잠해지기 전에는 목록을 다시 거르지 않는다", () => {
    const rendered = renderBoard();

    act(() =>
      rendered.result.current.setFilter({ ...rendered.result.current.filter, keyword: "네이버" }),
    );
    act(() => void vi.advanceTimersByTime(200));

    expect(rendered.result.current.rows).toHaveLength(2);

    act(() => void vi.advanceTimersByTime(100));

    expect(rendered.result.current.rows).toHaveLength(1);
  });

  it("타이핑이 이어지면 대기 시간이 다시 시작된다", () => {
    // 단순 지연이면 첫 입력 300ms 시점에 중간 결과가 한 번 깜빡인다
    const rendered = renderBoard();

    act(() =>
      rendered.result.current.setFilter({ ...rendered.result.current.filter, keyword: "네" }),
    );
    act(() => void vi.advanceTimersByTime(200));

    act(() =>
      rendered.result.current.setFilter({ ...rendered.result.current.filter, keyword: "네이버" }),
    );
    act(() => void vi.advanceTimersByTime(200));

    expect(rendered.result.current.rows).toHaveLength(2);

    act(() => void vi.advanceTimersByTime(100));

    expect(rendered.result.current.rows).toHaveLength(1);
  });
});
