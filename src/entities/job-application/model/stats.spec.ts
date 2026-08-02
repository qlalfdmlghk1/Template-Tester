import { describe, it, expect } from "vitest";
import {
  calcStagePassRate,
  formatPassRate,
  getApplicationStatus,
  getCurrentStage,
  getUpcomingSchedule,
  isNotApplied,
} from "./stats";
import { STAGE_KEYS } from "./stage";
import type { StageKey, StageStatus } from "./stage";
import type { JobApplication, StageEntry } from "./application.type";
import type { Schedule } from "./schedule";

/** 모든 단계를 PENDING으로 채운 지원 건을 만들고, 지정한 단계만 덮어쓴다 */
function makeApplication(
  overrides: Partial<Record<StageKey, Partial<StageEntry>>> = {},
  extra: Partial<JobApplication> = {},
): JobApplication {
  const stages = {} as Record<StageKey, StageEntry>;
  for (const key of STAGE_KEYS) {
    stages[key] = { status: "PENDING", schedule: null, ...overrides[key] };
  }

  return {
    id: "app-1",
    userId: "user-1",
    companyId: "company-1",
    postingTitle: "2026 상반기 수시",
    jobTag: "FE",
    headcount: null,
    stages,
    createdAt: new Date(2026, 0, 1),
    ...extra,
  };
}

/** 특정 단계 상태만 지정한 지원 건 목록을 만든다 */
function makeApplications(stageKey: StageKey, statuses: StageStatus[]): JobApplication[] {
  return statuses.map((status, index) =>
    makeApplication({ [stageKey]: { status } }, { id: `app-${index}` }),
  );
}

describe("isNotApplied", () => {
  it("미지원 사유가 있으면 미지원 건이다", () => {
    expect(isNotApplied(makeApplication({}, { notAppliedReason: "지원 자격 미달" }))).toBe(true);
  });

  it("공백만 있는 사유는 미지원으로 보지 않는다", () => {
    expect(isNotApplied(makeApplication({}, { notAppliedReason: "   " }))).toBe(false);
  });

  it("사유가 없으면 미지원이 아니다", () => {
    expect(isNotApplied(makeApplication())).toBe(false);
  });
});

describe("getApplicationStatus", () => {
  it("미지원 사유가 있으면 다른 단계 상태보다 우선한다", () => {
    const application = makeApplication(
      { resume: { status: "PASSED" } },
      { notAppliedReason: "채용 규모 축소" },
    );
    expect(getApplicationStatus(application)).toBe("NOT_APPLIED");
  });

  it("불합격 단계가 하나라도 있으면 탈락이다", () => {
    const application = makeApplication({
      resume: { status: "PASSED" },
      written: { status: "FAILED" },
    });
    expect(getApplicationStatus(application)).toBe("REJECTED");
  });

  it("출근 단계가 합격이면 최종 합격이다", () => {
    const application = makeApplication({
      resume: { status: "PASSED" },
      onboarding: { status: "PASSED" },
    });
    expect(getApplicationStatus(application)).toBe("FINAL_PASSED");
  });

  it("그 외에는 진행 중이다", () => {
    const application = makeApplication({
      resume: { status: "PASSED" },
      written: { status: "SUBMITTED" },
    });
    expect(getApplicationStatus(application)).toBe("IN_PROGRESS");
  });
});

describe("calcStagePassRate", () => {
  it("합격 / (합격 + 불합격) 으로 계산한다 — 기존 시트 자소서 5/12 = 41.67%", () => {
    const applications = makeApplications("resume", [
      "PASSED",
      "PASSED",
      "PASSED",
      "PASSED",
      "PASSED",
      "FAILED",
      "FAILED",
      "FAILED",
      "FAILED",
      "FAILED",
      "FAILED",
      "FAILED",
      "SUBMITTED",
      "PENDING",
    ]);

    const result = calcStagePassRate(applications, "resume");

    expect(result.passed).toBe(5);
    expect(result.failed).toBe(7);
    expect(formatPassRate(result.rate)).toBe("41.67%");
  });

  it("응시·진행 전·해당 없음은 분모에서 뺀다", () => {
    const applications = makeApplications("written", [
      "PASSED",
      "SUBMITTED",
      "PENDING",
      "NOT_APPLICABLE",
    ]);

    const result = calcStagePassRate(applications, "written");

    expect(result.passed).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.rate).toBe(1);
  });

  it("미지원 건은 통째로 제외한다", () => {
    const applications = [
      makeApplication({ resume: { status: "PASSED" } }),
      makeApplication({ resume: { status: "FAILED" } }, { notAppliedReason: "미지원" }),
    ];

    const result = calcStagePassRate(applications, "resume");

    expect(result.passed).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("결과가 확정된 건이 없으면 rate 는 null 이다", () => {
    const applications = makeApplications("codingTest", ["PENDING", "SUBMITTED"]);
    expect(calcStagePassRate(applications, "codingTest").rate).toBeNull();
  });
});

describe("formatPassRate", () => {
  it("분모가 0이면 '-' 로 표시해 진행 전과 전원 탈락을 구분한다", () => {
    expect(formatPassRate(null)).toBe("-");
    expect(formatPassRate(0)).toBe("0.00%");
  });

  it("소수점 둘째 자리까지 표시한다", () => {
    expect(formatPassRate(2 / 3)).toBe("66.67%");
    expect(formatPassRate(1)).toBe("100.00%");
  });
});

describe("getUpcomingSchedule", () => {
  const today = new Date(2026, 2, 1);

  it("아직 결과가 안 나온 단계 중 가장 가까운 일정을 고른다", () => {
    const application = makeApplication({
      resume: {
        status: "SUBMITTED",
        schedule: { kind: "exact", at: "2026-03-11T17:00", hasTime: true } as Schedule,
      },
      codingTest: {
        status: "PENDING",
        schedule: { kind: "rough", year: 2026, month: 4, part: "whole" } as Schedule,
      },
    });

    expect(getUpcomingSchedule(application, today)?.stageKey).toBe("resume");
  });

  it("마감이 지난 일정은 건너뛴다", () => {
    const application = makeApplication({
      resume: {
        status: "PENDING",
        schedule: { kind: "exact", at: "2026-02-01", hasTime: false } as Schedule,
      },
      written: {
        status: "PENDING",
        schedule: { kind: "exact", at: "2026-04-11", hasTime: false } as Schedule,
      },
    });

    expect(getUpcomingSchedule(application, today)?.stageKey).toBe("written");
  });

  it("이미 결과가 나온 단계는 대상이 아니다", () => {
    const application = makeApplication({
      resume: {
        status: "PASSED",
        schedule: { kind: "exact", at: "2026-03-11", hasTime: false } as Schedule,
      },
    });

    expect(getUpcomingSchedule(application, today)).toBeNull();
  });

  it("탈락한 지원 건에는 임박 일정이 없다", () => {
    const application = makeApplication({
      resume: { status: "FAILED" },
      written: {
        status: "PENDING",
        schedule: { kind: "exact", at: "2026-04-11", hasTime: false } as Schedule,
      },
    });

    expect(getUpcomingSchedule(application, today)).toBeNull();
  });
});

describe("getCurrentStage", () => {
  it("탈락한 단계를 우선 가리킨다", () => {
    const application = makeApplication({
      resume: { status: "PASSED" },
      written: { status: "FAILED" },
    });
    expect(getCurrentStage(application)).toBe("written");
  });

  it("결과를 기다리는 단계를 가리킨다", () => {
    const application = makeApplication({
      resume: { status: "PASSED" },
      codingTest: { status: "SUBMITTED" },
    });
    expect(getCurrentStage(application)).toBe("codingTest");
  });

  it("응시한 단계가 없으면 진행 전인 첫 단계를 가리킨다", () => {
    const application = makeApplication({
      resume: { status: "PASSED" },
      aiTest: { status: "NOT_APPLICABLE" },
    });
    expect(getCurrentStage(application)).toBe("personality");
  });

  it("미지원 건은 현재 단계가 없다", () => {
    expect(getCurrentStage(makeApplication({}, { notAppliedReason: "미지원" }))).toBeNull();
  });
});
