import { describe, it, expect } from "vitest";
import {
  ALL_HALF_ID,
  UNASSIGNED_HALF_ID,
  collectHalfIds,
  formatHalfId,
  getApplicationHalfId,
  getDraftHalfId,
  getHalfOfDate,
  getStagesHalfId,
  parseHalfId,
  toHalfId,
} from "./half";
import { STAGE_KEYS } from "./stage";
import type { StageKey } from "./stage";
import type { JobApplication, StageEntry } from "./application.type";
import type { Schedule } from "./schedule";

function makeApplication(
  resumeSchedule: Schedule | null,
  id = "app-1",
  createdAt = new Date(2026, 0, 1),
  otherStages: Partial<Record<StageKey, Schedule>> = {},
): JobApplication {
  const stages = {} as Record<StageKey, StageEntry>;
  for (const key of STAGE_KEYS) {
    stages[key] = { status: "PENDING", schedule: otherStages[key] ?? null };
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
    createdAt,
  };
}

describe("getStagesHalfId", () => {
  it("자소서 마감일의 반기를 준다", () => {
    const { stages } = makeApplication({ kind: "exact", at: "2026-03-11", hasTime: false });

    expect(getStagesHalfId(stages)).toBe("2026-H1");
  });

  it("자소서가 비면 가장 이른 다른 일정을 본다", () => {
    const { stages } = makeApplication(null, "app-1", new Date(2026, 0, 1), {
      codingTest: { kind: "exact", at: "2026-09-02", hasTime: false },
    });

    expect(getStagesHalfId(stages)).toBe("2026-H2");
  });

  it("아는 날짜가 없으면 null 이어야 한다", () => {
    // 등록 직후 반기를 정할 때 "일정으로는 모른다"를 구분해야 한다
    const { stages } = makeApplication(null);

    expect(getStagesHalfId(stages)).toBeNull();
  });
});

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

  it("자소서가 비어 있으면 다른 전형 단계의 일정을 본다 — 등록 시점보다 우선", () => {
    const application = makeApplication(null, "a", new Date(2026, 0, 1), {
      codingTest: { kind: "exact", at: "2025-09-20", hasTime: false },
    });
    expect(getApplicationHalfId(application)).toBe("2025-H2");
  });

  it("전형 단계가 여럿이면 가장 이른 일정을 쓴다", () => {
    const application = makeApplication(null, "a", new Date(2026, 0, 1), {
      interview1: { kind: "exact", at: "2025-11-10", hasTime: false },
      codingTest: { kind: "exact", at: "2025-09-20", hasTime: false },
      finalResult: { kind: "exact", at: "2025-12-01", hasTime: false },
    });
    expect(getApplicationHalfId(application)).toBe("2025-H2");
  });

  it("자소서가 있으면 다른 단계가 더 일러도 자소서를 따른다", () => {
    const application = makeApplication(
      { kind: "exact", at: "2026-03-11", hasTime: false },
      "a",
      new Date(2026, 0, 1),
      { codingTest: { kind: "exact", at: "2025-09-20", hasTime: false } },
    );
    expect(getApplicationHalfId(application)).toBe("2026-H1");
  });

  it("자소서도 다른 일정도 없으면 등록 시점 반기로 귀속된다", () => {
    expect(getApplicationHalfId(makeApplication(null, "a", new Date(2026, 2, 5)))).toBe("2026-H1");
    expect(getApplicationHalfId(makeApplication(null, "b", new Date(2026, 8, 5)))).toBe("2026-H2");
  });

  it("자소서 일정이 생기면 등록 시점이 아니라 그 날짜를 따른다", () => {
    const application = makeApplication(
      { kind: "exact", at: "2026-09-01", hasTime: false },
      "a",
      new Date(2026, 0, 1),
    );
    expect(getApplicationHalfId(application)).toBe("2026-H2");
  });

  it("등록 시점을 읽을 수 없으면 미분류로 남는다", () => {
    const application = makeApplication(null, "a", new Date("깨진 값"));
    expect(getApplicationHalfId(application)).toBe(UNASSIGNED_HALF_ID);
  });
});

describe("getDraftHalfId", () => {
  const TODAY = new Date(2026, 8, 15);

  it("폼이 들고 있는 일정이 있으면 그 날짜의 반기를 쓴다", () => {
    const { stages } = makeApplication({ kind: "exact", at: "2026-03-11", hasTime: false });

    expect(getDraftHalfId(stages, null, TODAY)).toBe("2026-H1");
  });

  it("신규 등록이고 일정도 없으면 오늘의 반기로 떨어진다", () => {
    expect(getDraftHalfId(null, null, TODAY)).toBe("2026-H2");
  });

  it("수정 중이면 그 건의 기존 귀속을 따른다 — 오늘이 아니다", () => {
    // 지난 반기의 건을 고치는데 오늘 반기를 쓰면 목록에서 잡히는 반기와 어긋난다
    const application = makeApplication(null, "a", new Date(2025, 2, 5));

    expect(getDraftHalfId(null, application, TODAY)).toBe("2025-H1");
  });

  it("폼의 일정이 기존 귀속보다 우선한다", () => {
    const application = makeApplication(null, "a", new Date(2025, 2, 5));
    const { stages } = makeApplication({ kind: "exact", at: "2026-08-09", hasTime: false });

    expect(getDraftHalfId(stages, application, TODAY)).toBe("2026-H2");
  });

  it("미분류로 떨어지는 건은 오늘의 반기로 대신한다", () => {
    // 사람에게 보여줄 이름을 만드는 용도라 "미분류"를 그대로 흘릴 수 없다
    const application = makeApplication(null, "a", new Date("깨진 값"));

    expect(getDraftHalfId(null, application, TODAY)).toBe("2026-H2");
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

  it("일정이 없는 건도 등록 시점 반기로 선택지에 잡힌다", () => {
    const applications = [
      makeApplication({ kind: "exact", at: "2026-03-11", hasTime: false }, "a"),
      makeApplication(null, "b", new Date(2026, 8, 1)),
    ];

    expect(collectHalfIds(applications)).toEqual([ALL_HALF_ID, "2026-H2", "2026-H1"]);
  });

  it("미분류는 선택지로 노출하지 않는다 — 전체에서만 보인다", () => {
    const applications = [
      makeApplication({ kind: "exact", at: "2026-03-11", hasTime: false }, "a"),
      makeApplication(null, "b", new Date("깨진 값")),
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
