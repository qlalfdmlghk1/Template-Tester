import { describe, it, expect } from "vitest";
import {
  ALL_HALF_ID,
  UNASSIGNED_HALF_ID,
  collectHalfIds,
  formatHalfId,
  getApplicationHalfId,
  getHalfOfDate,
  parseHalfId,
  toHalfId,
} from "./half";
import { STAGE_KEYS } from "./stage";
import type { StageKey } from "./stage";
import type { JobApplication, StageEntry } from "./application.type";
import type { Schedule } from "./schedule";

function makeApplication(resumeSchedule: Schedule | null, id = "app-1"): JobApplication {
  const stages = {} as Record<StageKey, StageEntry>;
  for (const key of STAGE_KEYS) {
    stages[key] = { status: "PENDING", schedule: null };
  }
  stages.resume = { status: "PENDING", schedule: resumeSchedule };

  return {
    id,
    userId: "user-1",
    companyId: "company-1",
    postingTitle: "공고",
    jobTag: "FE",
    headcount: null,
    stages,
    createdAt: new Date(2026, 0, 1),
  };
}

describe("getHalfOfDate", () => {
  it("1~6월은 상반기다", () => {
    expect(getHalfOfDate(new Date(2026, 0, 1))).toEqual({ year: 2026, half: 1 });
    expect(getHalfOfDate(new Date(2026, 5, 30))).toEqual({ year: 2026, half: 1 });
  });

  it("7~12월은 하반기다", () => {
    expect(getHalfOfDate(new Date(2026, 6, 1))).toEqual({ year: 2026, half: 2 });
    expect(getHalfOfDate(new Date(2026, 11, 31))).toEqual({ year: 2026, half: 2 });
  });
});

describe("toHalfId / parseHalfId / formatHalfId", () => {
  it("식별자와 객체를 서로 변환한다", () => {
    expect(toHalfId({ year: 2026, half: 1 })).toBe("2026-H1");
    expect(parseHalfId("2026-H2")).toEqual({ year: 2026, half: 2 });
  });

  it("형식이 어긋나면 null", () => {
    expect(parseHalfId("2026")).toBeNull();
    expect(parseHalfId(UNASSIGNED_HALF_ID)).toBeNull();
  });

  it("사람이 읽는 문구로 표시한다", () => {
    expect(formatHalfId("2026-H1")).toBe("2026 상반기");
    expect(formatHalfId("2026-H2")).toBe("2026 하반기");
    expect(formatHalfId(UNASSIGNED_HALF_ID)).toBe("미분류");
    expect(formatHalfId(ALL_HALF_ID)).toBe("전체");
  });
});

describe("getApplicationHalfId", () => {
  it("자소서 마감일 기준으로 반기를 정한다", () => {
    const application = makeApplication({
      kind: "exact",
      at: "2026-03-11T17:00",
      hasTime: true,
    });
    expect(getApplicationHalfId(application)).toBe("2026-H1");
  });

  it("7월 이후 마감이면 하반기로 간다 — 기존 시트에서 상반기 탭에 섞여 있던 건", () => {
    const application = makeApplication({ kind: "exact", at: "2026-07-13", hasTime: false });
    expect(getApplicationHalfId(application)).toBe("2026-H2");
  });

  it("러프 표기도 대표 일자로 환산해 판정한다", () => {
    const application = makeApplication({ kind: "rough", year: 2026, month: 6, part: "late" });
    expect(getApplicationHalfId(application)).toBe("2026-H1");
  });

  it("자소서 일정이 없으면 미분류다", () => {
    expect(getApplicationHalfId(makeApplication(null))).toBe(UNASSIGNED_HALF_ID);
  });
});

describe("collectHalfIds", () => {
  it("전체가 맨 앞에 오고 그 뒤로 최신 반기 순으로 붙는다", () => {
    const applications = [
      makeApplication({ kind: "exact", at: "2026-03-11", hasTime: false }, "a"),
      makeApplication({ kind: "exact", at: "2026-08-09", hasTime: false }, "b"),
      makeApplication({ kind: "exact", at: "2025-09-01", hasTime: false }, "c"),
    ];

    expect(collectHalfIds(applications)).toEqual([
      ALL_HALF_ID,
      "2026-H2",
      "2026-H1",
      "2025-H2",
    ]);
  });

  it("미분류는 선택지로 노출하지 않는다 — 전체에서 함께 보인다", () => {
    const applications = [
      makeApplication({ kind: "exact", at: "2026-03-11", hasTime: false }, "a"),
      makeApplication(null, "b"),
    ];

    expect(collectHalfIds(applications)).toEqual([ALL_HALF_ID, "2026-H1"]);
  });

  it("지원 건이 없어도 전체 선택지는 남는다", () => {
    expect(collectHalfIds([])).toEqual([ALL_HALF_ID]);
  });

  it("중복 반기는 하나로 묶인다", () => {
    const applications = [
      makeApplication({ kind: "exact", at: "2026-03-11", hasTime: false }, "a"),
      makeApplication({ kind: "exact", at: "2026-04-01", hasTime: false }, "b"),
    ];

    expect(collectHalfIds(applications)).toEqual([ALL_HALF_ID, "2026-H1"]);
  });
});
