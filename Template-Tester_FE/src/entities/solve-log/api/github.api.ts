// GitHub 공개 API 호출 — 인증 없이 공개 저장소만 읽는다.
//
// Cloud Functions를 경유하지 않고 브라우저에서 직접 호출한다.
// api.github.com은 CORS를 허용하고, 비인증 rate limit(60회/시간)이 서버 IP 하나가 아닌
// 사용자 IP 기준으로 걸리기 때문에 오히려 직접 호출이 유리하다.
// (실측: 전체 백필에 커밋 3페이지 + 트리 1회 = 4요청)

const GITHUB_API = "https://api.github.com";
const PER_PAGE = 100;
/** 폭주 방지 상한 — 100 × 30 = 커밋 3000개 */
const MAX_PAGES = 30;

/** 커밋 목록에서 필요한 최소 정보 */
export interface GithubCommit {
  sha: string;
  message: string;
  /** 커밋 시각 (UTC ISO 문자열) */
  committedAt: string;
}

export interface RepoRef {
  owner: string;
  repo: string;
}

/** rate limit 초과처럼 사용자에게 그대로 보여줘야 하는 실패 */
export class GithubApiError extends Error {
  readonly status: number;
  /** rate limit 해제 시각 (해당하는 경우) */
  readonly resetAt: Date | null;

  constructor(message: string, status: number, resetAt: Date | null = null) {
    super(message);
    this.name = "GithubApiError";
    this.status = status;
    this.resetAt = resetAt;
  }
}

async function requestGithub(path: string): Promise<Response> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (response.ok) return response;

  if (response.status === 404) {
    throw new GithubApiError(
      "저장소를 찾을 수 없습니다. 공개 저장소인지, 경로가 맞는지 확인해주세요.",
      404,
    );
  }

  // 비인증 한도(60회/시간)를 넘기면 403 또는 429로 떨어지고 remaining이 0이 된다
  const remaining = response.headers.get("x-ratelimit-remaining");
  if ((response.status === 403 || response.status === 429) && remaining === "0") {
    const resetHeader = response.headers.get("x-ratelimit-reset");
    const resetAt = resetHeader ? new Date(Number(resetHeader) * 1000) : null;
    throw new GithubApiError(
      "GitHub 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
      response.status,
      resetAt,
    );
  }

  throw new GithubApiError(`GitHub 요청에 실패했습니다. (${response.status})`, response.status);
}

/** 저장소 존재·공개 여부 확인 (설정 저장 전 검증용) */
export async function verifyRepo({ owner, repo }: RepoRef): Promise<void> {
  await requestGithub(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
}

/**
 * 커밋 목록 조회.
 *
 * @param since 이 시각 이후 커밋만 (증분 동기화). 없으면 전체 히스토리.
 */
export async function fetchCommits(
  { owner, repo }: RepoRef,
  since?: Date | null,
): Promise<GithubCommit[]> {
  const commits: GithubCommit[] = [];
  const basePath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`;
  const sinceParam = since ? `&since=${encodeURIComponent(since.toISOString())}` : "";

  for (let page = 1; page <= MAX_PAGES; page++) {
    const response = await requestGithub(`${basePath}?per_page=${PER_PAGE}&page=${page}${sinceParam}`);
    const body = (await response.json()) as Array<{
      sha: string;
      commit: { message: string; author: { date: string } | null; committer: { date: string } | null };
    }>;

    for (const item of body) {
      // author.date는 원 작성 시각, committer.date는 저장소 반영 시각.
      // BaekjoonHub는 채점 직후 커밋하므로 author.date가 실제 푼 시각에 가깝다.
      const date = item.commit.author?.date ?? item.commit.committer?.date;
      if (!date) continue;

      commits.push({ sha: item.sha, message: item.commit.message, committedAt: date });
    }

    if (body.length < PER_PAGE) break;
  }

  return commits;
}

/**
 * 저장소 전체 파일 경로 조회 (재귀).
 *
 * 커밋마다 상세 API를 부르는 대신 이 한 번의 호출로 "제목 → 문제번호" 색인을 만든다.
 */
export async function fetchRepoTree({ owner, repo }: RepoRef): Promise<string[]> {
  const response = await requestGithub(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/HEAD?recursive=1`,
  );
  const body = (await response.json()) as {
    tree: Array<{ path: string; type: string }>;
    truncated?: boolean;
  };

  if (body.truncated) {
    // 파일이 매우 많은 저장소에서 발생. 색인이 불완전해져 일부 문제 링크가 비게 된다.
    console.warn("GitHub 트리 응답이 잘렸습니다. 일부 문제 번호를 찾지 못할 수 있습니다.");
  }

  return body.tree.filter((item) => item.type === "blob").map((item) => item.path);
}
