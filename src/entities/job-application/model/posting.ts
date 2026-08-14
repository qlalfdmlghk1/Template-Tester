import type { ResearchSource } from "@/shared/model/aiSource";
import type { JobApplication, JobApplicationInput, PostingField } from "./application.type";
import type { PostingScheduleDraft } from "./postingSchedule";
import { STAGE_KEYS } from "./stage";
import type { StageEntry } from "./application.type";
import type { StageKey } from "./stage";

/** 추출 결과 중 반영에 필요한 부분만 — 호출 계층 타입에 묶이지 않게 최소로 받는다 */
export interface PostingDraft {
  jobDescription?: string;
  requirements?: string;
  preferredQualifications?: string;
  sources: Partial<Record<PostingField, ResearchSource[]>>;
}

/**
 * 선택한 항목만 지원 건에 반영할 입력값으로 만든다.
 *
 * AI 결과는 초안이므로 고르지 않은 항목은 건드리지 않는다 — 사용자가 직접 적어 둔
 * 내용을 한 번의 실행으로 통째로 날려버리지 않기 위해서다.
 *
 * 출처도 같은 규칙을 따른다. 고른 항목만 새 출처로 갈고 나머지는 기존 값을 남기는데,
 * 안 그러면 반영하지 않은 항목의 근거 링크가 사라져 나중에 사실 확인을 못 하게 된다.
 */
export function mergePostingDraft(
  application: JobApplication,
  draft: PostingDraft,
  selectedFields: PostingField[],
  extractedAt: Date,
): Partial<JobApplicationInput> {
  if (selectedFields.length === 0) return {};

  const patch: Partial<JobApplicationInput> = {};
  const sources: Partial<Record<PostingField, ResearchSource[]>> = {
    ...application.postingSources,
  };

  for (const field of selectedFields) {
    const value = draft[field]?.trim();
    if (!value) continue;

    patch[field] = value;

    const fieldSources = draft.sources[field];
    if (fieldSources?.length) {
      sources[field] = fieldSources;
    } else {
      // 붙여넣은 본문에서 뽑은 경우엔 URL 근거가 없다.
      // 이전 실행의 출처를 그대로 두면 지금 내용의 근거인 것처럼 보이므로 지운다.
      delete sources[field];
    }
  }

  // 반영된 항목이 없으면(전부 빈 값이었으면) 실행 시각도 남기지 않는다
  if (Object.keys(patch).length === 0) return {};

  patch.postingSources = sources;
  patch.extractedAt = extractedAt;

  return patch;
}

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
