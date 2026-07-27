/** 풀이 기록이 나온 플랫폼 */
export type SolvePlatform = "programmers" | "boj";

/** 기록이 들어온 경로 — 자동 동기화인지 직접 입력인지 */
export type SolveLogSource = "baekjoonhub" | "manual";

/** 하루치 코딩테스트 풀이 기록 한 건 */
export interface SolveLog {
  /**
   * `{uid}__{platform}__{problemNo}__{YYYYMMDD}` 결정적 키.
   * 재동기화해도 같은 문서를 덮어쓰도록 하여 중복 생성을 막는다.
   * 문제 번호를 못 찾은 기록과 수동 기록은 뒤에 임의 suffix가 붙는다.
   */
  id: string;
  userId: string;
  platform: SolvePlatform;
  /** 프로그래머스 lesson 번호 / 백준 문제 번호. 매핑 실패 시 null */
  problemNo: string | null;
  title: string;
  /** 프로그래머스 `level 2`, 백준 `Silver III` 등 원문 표기 */
  difficulty: string | null;
  /** 프로그래머스 레벨 숫자. 백준이거나 파싱 실패 시 null */
  level: number | null;
  /** 풀이 파일 확장자에서 추정한 언어 (예: `py`, `js`). 알 수 없으면 null */
  language: string | null;
  /** 원본 시각 (커밋 시각 또는 수동 입력 날짜의 자정) */
  solvedAt: Date;
  /** KST 기준 YYYY-MM-DD — 달력 그룹핑 키 */
  dateKey: string;
  source: SolveLogSource;
  /** BaekjoonHub 커밋 메시지의 실행 시간 (예: `0.23 ms`) */
  runtime: string | null;
  /** BaekjoonHub 커밋 메시지의 메모리 (예: `44.1 MB`) */
  memory: string | null;
  /** 문제 원문 URL. problemNo가 없으면 null */
  url: string | null;
  /** 수동 기록의 메모 */
  memo: string | null;
}

/** 사용자별 달력 연동 설정 (문서 ID = uid) */
export interface CalendarSettings {
  repoOwner: string;
  repoName: string;
  /** 마지막 동기화 시각 — 증분 동기화의 `since` 기준 */
  lastSyncedAt: Date | null;
}
