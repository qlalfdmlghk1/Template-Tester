import { describe, it, expect } from "vitest";
import {
  filterProposableSchedules,
  mergePostingSchedules,
} from "./posting";
import { createEmptyStages } from "./stage";
import type { JobApplication } from "./application.type";
import type { PostingScheduleDraft } from "./postingSchedule";

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

const RESUME_DRAFT: PostingScheduleDraft = {
  stage: "resume",
  schedule: { kind: "exact", at: "2026-03-11T17:00", hasTime: true },
  yearInferred: true,
};

describe("filterProposableSchedules", () => {
  it("비어 있고 진행 전인 칸은 제안해야 한다", () => {
    expect(filterProposableSchedules(makeApplication(), [RESUME_DRAFT])).toEqual([
      RESUME_DRAFT,
    ]);
  });

  it("이미 일정이 있으면 제안하지 않아야 한다", () => {
    const application = makeApplication();
    application.stages.resume = {
      status: "PENDING",
      schedule: { kind: "exact", at: "2026-03-01", hasTime: false },
    };

    expect(filterProposableSchedules(application, [RESUME_DRAFT])).toEqual([]);
  });

  it("사용자가 상태를 바꾼 칸은 제안하지 않아야 한다", () => {
    const application = makeApplication();
    application.stages.resume = { status: "SUBMITTED", schedule: null };

    expect(filterProposableSchedules(application, [RESUME_DRAFT])).toEqual([]);
  });

  it("아직 저장 전인 신규 등록에는 전부 제안해야 한다", () => {
    // 손댄 칸이 없으므로 걸러낼 것도 없다
    expect(filterProposableSchedules(null, [RESUME_DRAFT])).toEqual([RESUME_DRAFT]);
  });
});

describe("mergePostingSchedules", () => {
  it("고른 단계에만 일정을 넣어야 한다", () => {
    const patch = mergePostingSchedules(makeApplication(), [RESUME_DRAFT], ["resume"]);

    expect(patch.stages?.resume.schedule).toEqual(RESUME_DRAFT.schedule);
    expect(patch.stages?.codingTest.schedule).toBeNull();
  });

  it("상태는 건드리지 않아야 한다", () => {
    // 일정이 잡혔다고 응시·제출이 된 것은 아니다. 상태는 합격률 집계의 입력이다
    const patch = mergePostingSchedules(makeApplication(), [RESUME_DRAFT], ["resume"]);

    expect(patch.stages?.resume.status).toBe("PENDING");
  });

  it("고르지 않은 단계의 기존 일정·메모는 남겨야 한다", () => {
    const application = makeApplication();
    application.stages.interview1 = {
      status: "PASSED",
      schedule: { kind: "exact", at: "2026-05-02", hasTime: false },
      memo: "인성 위주",
    };

    const patch = mergePostingSchedules(application, [RESUME_DRAFT], ["resume"]);

    expect(patch.stages?.interview1).toEqual({
      status: "PASSED",
      schedule: { kind: "exact", at: "2026-05-02", hasTime: false },
      memo: "인성 위주",
    });
  });

  it("메모가 없는 칸에 undefined 키를 남기지 않아야 한다", () => {
    // 단계 맵을 통째로 쓰는데 toUpdatePayload 는 중첩 객체 안쪽을 훑지 않는다.
    // memo: undefined 가 남으면 Firestore 저장이 거부된다
    const patch = mergePostingSchedules(makeApplication(), [RESUME_DRAFT], ["resume"]);

    for (const entry of Object.values(patch.stages ?? {})) {
      expect("memo" in entry).toBe(false);
    }
  });

  it("고른 단계가 없으면 빈 patch 를 줘야 한다", () => {
    expect(mergePostingSchedules(makeApplication(), [RESUME_DRAFT], [])).toEqual({});
  });
});
