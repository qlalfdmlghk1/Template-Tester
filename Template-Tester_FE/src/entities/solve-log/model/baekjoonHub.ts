// BaekjoonHub 자동 커밋 해석 — 순수 함수 계층 (네트워크·저장소를 참조하지 않음)
//
// BaekjoonHub 확장은 프로그래머스·백준에서 채점을 통과하면 지정한 GitHub 저장소에
// 아래 형태로 자동 커밋한다. 우리는 이 커밋만 읽어 풀이 기록을 복원한다.
//
//   메시지: [level 2] Title: 의상, Time: 0.23 ms, Memory: 44.1 MB -BaekjoonHub
//           [Silver III] Title: 두 수의 합, Time: 80 ms, Memory: 42660 KB -BaekjoonHub
//           [Silver I] Title: 볼 모으기, Time: 192 ms, Memory: 40880 KB, Score: 100 point -BaekjoonHub
//   경로:   프로그래머스/{레벨}/{번호}. {제목}/{제목}.js
//           백준/{티어}/{번호}. {제목}/{제목}.py
//
// 메시지에는 문제 번호가 없다. 커밋마다 상세 API를 부르면 요청 수가 폭발하므로,
// 트리를 한 번만 읽어 "제목 → 번호" 색인을 만든 뒤 커밋 제목과 대조한다.

import type { SolvePlatform } from "./solve-log.type";

/** BaekjoonHub 자동 커밋임을 나타내는 꼬리표 */
const BAEKJOONHUB_SUFFIX = "-BaekjoonHub";

const MESSAGE_PATTERN =
  /^\[([^\]]+)\]\s*Title:\s*(.+?),\s*Time:\s*([^,]*?),\s*Memory:\s*([^,]*?)(?:,\s*Score:\s*([^,]*?))?\s*-BaekjoonHub$/;

const PROGRAMMERS_LEVEL_PATTERN = /^level\s*(\d+)$/i;

/** 트리 경로의 플랫폼 폴더명 */
const PLATFORM_DIR: Record<string, SolvePlatform> = {
  프로그래머스: "programmers",
  백준: "boj",
};

/** `{번호}. {제목}` 형태의 문제 폴더명 */
const PROBLEM_DIR_PATTERN = /^(\d+)\.\s*(.+)$/;

/** 풀이 파일로 치지 않는 파일명 */
const NON_SOLUTION_FILES = new Set(["README.md", "readme.md"]);

/** 커밋 메시지에서 뽑아낸 값 */
export interface ParsedCommitMessage {
  platform: SolvePlatform;
  title: string;
  /** `level 2` / `Silver III` 등 원문 표기 */
  difficulty: string;
  /** 프로그래머스 레벨 숫자. 백준이면 null */
  level: number | null;
  runtime: string | null;
  memory: string | null;
  score: string | null;
}

/** 제목 색인 항목 */
export interface ProblemIndexEntry {
  problemNo: string;
  /** 풀이 파일 확장자 (예: `py`, `js`). 못 찾으면 null */
  language: string | null;
}

/**
 * 제목 정규화 — 색인 조회 키를 만든다.
 *
 * BaekjoonHub는 경로에 쓸 수 없는 문자를 전각으로 바꿔 저장한다
 * (`A＋B`, `별 찍기 － 1`, `2541년생？！`). 커밋 메시지의 제목은 원문 그대로라
 * 정규화 없이 대조하면 상당수가 어긋난다.
 * 전각 ASCII(U+FF01~U+FF5E)를 반각으로 되돌리고 공백을 정리한다.
 */
export function normalizeProblemTitle(title: string): string {
  return title
    .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, " ")
    .trim();
}

/** BaekjoonHub 자동 커밋인가 (사용자가 손으로 만든 커밋을 걸러낸다) */
export function isBaekjoonHubCommit(message: string): boolean {
  return firstLine(message).trimEnd().endsWith(BAEKJOONHUB_SUFFIX);
}

/**
 * 커밋 메시지 파싱. BaekjoonHub 커밋이 아니거나 형식이 다르면 null.
 *
 * 사용자가 직접 정리한 뭉치 커밋(`260202-260331 업로드` 등)은 커밋 날짜가
 * 실제 푼 날짜와 무관하므로 여기서 걸러진다.
 */
export function parseBaekjoonHubMessage(message: string): ParsedCommitMessage | null {
  const match = firstLine(message).trim().match(MESSAGE_PATTERN);
  if (!match) return null;

  const [, badge, title, runtime, memory, score] = match;
  const levelMatch = badge.trim().match(PROGRAMMERS_LEVEL_PATTERN);

  return {
    platform: levelMatch ? "programmers" : "boj",
    title: title.trim(),
    difficulty: badge.trim(),
    level: levelMatch ? Number(levelMatch[1]) : null,
    runtime: cleanMetaValue(runtime),
    memory: cleanMetaValue(memory),
    score: cleanMetaValue(score),
  };
}

/**
 * 트리 경로 목록 → `플랫폼:정규화제목` → {번호, 언어} 색인.
 *
 * 같은 제목이 여러 번 나오면 처음 것을 유지한다. 언어는 README가 아닌
 * 풀이 파일에서 채우므로, 번호를 먼저 잡고 언어를 나중에 보완한다.
 */
export function buildProblemIndex(paths: Iterable<string>): Map<string, ProblemIndexEntry> {
  const index = new Map<string, ProblemIndexEntry>();

  for (const path of paths) {
    const segments = path.split("/");
    if (segments.length < 3) continue;

    const platform = PLATFORM_DIR[segments[0]];
    if (!platform) continue;

    const problemDir = segments[2].match(PROBLEM_DIR_PATTERN);
    if (!problemDir) continue;

    const [, problemNo, rawTitle] = problemDir;
    const key = toIndexKey(platform, rawTitle);

    const existing = index.get(key);
    if (!existing) {
      index.set(key, { problemNo, language: extractLanguage(segments[3]) });
      continue;
    }

    if (!existing.language) {
      existing.language = extractLanguage(segments[3]);
    }
  }

  return index;
}

/** 색인 조회 키 */
export function toIndexKey(platform: SolvePlatform, title: string): string {
  return `${platform}:${normalizeProblemTitle(title)}`;
}

/** 문제 원문 URL. 번호를 모르면 null */
export function buildProblemUrl(platform: SolvePlatform, problemNo: string | null): string | null {
  if (!problemNo) return null;

  return platform === "programmers"
    ? `https://school.programmers.co.kr/learn/courses/30/lessons/${problemNo}`
    : `https://www.acmicpc.net/problem/${problemNo}`;
}

/**
 * 결정적 문서 ID.
 *
 * 백필 구간과 증분 동기화 구간이 겹쳐도 같은 풀이가 같은 ID로 떨어져
 * 중복 생성 대신 덮어쓰기가 된다. 번호를 못 찾은 기록은 제목을 대신 쓴다.
 */
export function buildSolveLogId(
  userId: string,
  platform: SolvePlatform,
  problemNo: string | null,
  title: string,
  dateKey: string,
): string {
  const problemPart = problemNo ?? `t-${normalizeProblemTitle(title)}`;
  return [userId, platform, problemPart, dateKey.replace(/-/g, "")]
    .join("__")
    .replace(/\//g, "／"); // Firestore 문서 ID에 "/"를 쓸 수 없다
}

// ===== 내부 헬퍼 =====

function firstLine(message: string): string {
  return message.split("\n")[0];
}

/** 빈 값·`undefined` 문자열을 null로 정리 */
function cleanMetaValue(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "undefined") return null;
  return trimmed;
}

/** 파일명에서 확장자 추출 (README는 언어로 치지 않음) */
function extractLanguage(fileName: string | undefined): string | null {
  if (!fileName || NON_SOLUTION_FILES.has(fileName)) return null;

  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) return null;

  return fileName.slice(dotIndex + 1).toLowerCase();
}
