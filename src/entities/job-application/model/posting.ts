import { STAGE_KEYS } from "./stage";
import type {
  JobApplication,
  JobApplicationInput,
  StageEntry,
} from "./application.type";
import type { PostingScheduleDraft } from "./postingSchedule";
import type { StageKey } from "./stage";

/**
 * 사용자에게 제안해도 되는 일정만 남긴다.
 *
 * **손대지 않은 칸에만 제안한다** — 상태가 `PENDING` 이고 일정이 비어 있는 칸이다.
 * 사용자가 이미 일정을 넣었거나 `해당 없음`·`불참` 으로 정리해 둔 칸을 후보로 올리면,
 * 실수로 한 번 체크했을 때 합격률 집계까지 틀어진다.
 */
export function filterProposableSchedules(
  application: JobApplication | null,
  drafts: PostingScheduleDraft[],
): PostingScheduleDraft[] {
  // 아직 저장 전인 신규 등록에는 손댄 칸이 없으므로 전부 제안한다
  if (!application) return drafts;

  return drafts.filter((draft) => {
    const entry = application.stages[draft.stage];
    return entry?.status === "PENDING" && !entry.schedule;
  });
}

/**
 * 고른 일정을 단계 맵에 반영한다.
 *
 * **상태(`status`)는 건드리지 않는다.** 일정이 잡혔다고 응시·제출이 된 것은 아니고,
 * 상태는 합격률 집계의 입력이라 사용자만 바꿔야 한다.
 *
 * Firestore 는 문서 필드의 undefined 를 거부하는데 수정 경로(`toUpdatePayload`)는
 * 중첩 객체 안쪽을 훑지 않는다. 단계 맵을 통째로 써야 하므로 여기서 각 칸을 새로 만들어
 * `memo` 가 없는 칸에 undefined 가 남지 않게 한다.
 */
export function mergePostingSchedules(
  // 아직 저장 전인 신규 등록에도 쓰므로 단계 맵만 받는다
  application: Pick<JobApplication, "stages">,
  drafts: PostingScheduleDraft[],
  selectedStages: StageKey[],
): Partial<JobApplicationInput> {
  const picked = drafts.filter((draft) => selectedStages.includes(draft.stage));
  if (picked.length === 0) return {};

  const byStage = new Map(picked.map((draft) => [draft.stage, draft.schedule]));
  const stages = {} as Record<StageKey, StageEntry>;

  for (const key of STAGE_KEYS) {
    const entry = application.stages[key];
    const nextSchedule = byStage.get(key) ?? entry?.schedule ?? null;

    const merged: StageEntry = {
      status: entry?.status ?? "PENDING",
      schedule: nextSchedule,
    };
    // undefined 를 담으면 저장이 거부되므로 값이 있을 때만 키를 만든다
    if (entry?.memo) merged.memo = entry.memo;

    stages[key] = merged;
  }

  return { stages };
}
