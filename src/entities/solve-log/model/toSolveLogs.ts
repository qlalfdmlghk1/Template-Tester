// 커밋 목록 + 저장소 트리 → 풀이 기록 변환 (순수 함수)
//
// 네트워크·Firestore를 참조하지 않으므로 실제 저장소 데이터를 넣어 그대로 검증할 수 있다.

import { toKstDateKey } from "@/shared/lib/date";
import type { GithubCommit } from "../api/github.api";
import type { SolveLog } from "./solve-log.type";
import {
  parseBaekjoonHubMessage,
  buildProblemIndex,
  toIndexKey,
  buildProblemUrl,
  buildSolveLogId,
} from "./baekjoonHub";

export interface ToSolveLogsParams {
  userId: string;
  commits: GithubCommit[];
  /** 저장소 전체 파일 경로 — 제목→문제번호 색인 재료 */
  treePaths: string[];
}

/**
 * BaekjoonHub 자동 커밋만 골라 풀이 기록으로 변환한다.
 *
 * 같은 문제를 같은 날 여러 번 제출하면 커밋도 여러 개 생기지만,
 * 문서 ID가 `{uid}__{platform}__{번호}__{날짜}`로 같으므로 한 건으로 합쳐진다.
 * 이때 **더 나중 커밋**을 남긴다 — 재제출은 보통 개선한 풀이이기 때문이다.
 * (GitHub 커밋 목록은 최신순이므로 먼저 만난 것이 더 나중 커밋이다)
 */
export function toSolveLogs({ userId, commits, treePaths }: ToSolveLogsParams): SolveLog[] {
  const index = buildProblemIndex(treePaths);
  const byId = new Map<string, SolveLog>();

  for (const commit of commits) {
    const parsed = parseBaekjoonHubMessage(commit.message);
    if (!parsed) continue;

    const entry = index.get(toIndexKey(parsed.platform, parsed.title));
    const problemNo = entry?.problemNo ?? null;
    const solvedAt = new Date(commit.committedAt);
    const dateKey = toKstDateKey(solvedAt);
    const id = buildSolveLogId(userId, parsed.platform, problemNo, parsed.title, dateKey);

    if (byId.has(id)) continue;

    byId.set(id, {
      id,
      userId,
      platform: parsed.platform,
      problemNo,
      title: parsed.title,
      difficulty: parsed.difficulty,
      level: parsed.level,
      language: entry?.language ?? null,
      solvedAt,
      dateKey,
      source: "baekjoonhub",
      runtime: parsed.runtime,
      memory: parsed.memory,
      url: buildProblemUrl(parsed.platform, problemNo),
      memo: null,
    });
  }

  return [...byId.values()];
}

/** 날짜 키별로 묶기 — 달력 렌더링용 */
export function groupByDateKey(logs: SolveLog[]): Map<string, SolveLog[]> {
  const grouped = new Map<string, SolveLog[]>();

  for (const log of logs) {
    const bucket = grouped.get(log.dateKey);
    if (bucket) {
      bucket.push(log);
    } else {
      grouped.set(log.dateKey, [log]);
    }
  }

  return grouped;
}
