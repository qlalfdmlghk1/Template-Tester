# CLAUDE.md

이 파일은 프로젝트에서 Claude Code가 항상 먼저 읽는 팀 표준 진입점입니다.

## 사용 전 설정

새 프로젝트에 `.claude`를 적용한 뒤, 먼저 아래 파일을 프로젝트 상황에 맞게 채웁니다.

1. `.claude/project.config.md`
2. `.claude/CLAUDE.md`의 프로젝트 개요
3. 필요한 기술 스택 rule

`project.config.md`가 없다면 `.claude/project.config.example.md`를 복사해서 만듭니다.

## 프로젝트 개요

- 프로젝트명: `Template-Tester` (모노레포: `Template-Tester_FE` / `Template-Tester_BE`, 이 설정은 **FE 전용**)
- 설명: `{PROJECT_DESCRIPTION}` — 미정, 채워주세요
- 주요 스택: `React 19 + Vite + TypeScript + Tailwind CSS` (Storybook, Vitest, Playwright, Firebase)
- 기본 브랜치: `dev`
- Jira 프로젝트 키: `{JIRA_PROJECT_KEY}` — 미정 (Jira 미사용이면 비워둠)
- GitHub 기본 reviewer: `{DEFAULT_REVIEWER}` — 미정
- Confluence 기술 문서 위치: `{CONFLUENCE_SPACE}` / `{TECH_DOC_PARENT_PAGE_ID}` — 미정

### 이 프로젝트의 현재 구조

- FE는 **FSD(Feature-Sliced Design) + Atomic Design** 구조를 이미 사용 중입니다. 상세 컨벤션은 `.claude/rules/fe-convention.md`(프로젝트 고유)를 우선 따르고, 표준 rule `.claude/rules/fe/react-vite.md`는 보완적으로 참고합니다.
- BE(`Template-Tester_BE`)는 Spring Boot(Java 17/Gradle)이며 팀 표준에 해당 rule이 아직 없습니다. 이 설정의 적용 범위 밖입니다.

## 기본 작업 원칙

- 의미 있는 변경은 Plan → Code → Review 순서로 진행합니다.
- `/start`를 사용하면 plan.md 합의 후 Jira, GitHub Issue, branch, progress.md를 생성합니다.
- 개발 중 결정은 `progress.md` 또는 `/note`로 남깁니다.
- **커밋·PR·리뷰·기록 요청은 반드시 해당 스킬로 처리합니다.** 사용자가 "커밋해줘"·"PR 올려줘"·"리뷰해줘"·"기록해줘"처럼 자연어로 말해도 — 슬래시 커맨드가 아니어도 — `git commit`·`gh pr create` 등을 **직접 실행하지 말고** `/commit`·`/pr`·`/review`(또는 `/review-converge`)·`/note` 스킬을 호출합니다. 스킬이 커밋 컨벤션·이슈 연결·리뷰 등록 등 팀 표준 절차를 보장하므로, 직접 처리하면 그 절차가 누락됩니다.
- 프로젝트별 예외는 `.claude/project.config.md`에 명시하고, skill 본문을 직접 고치기 전에 팀 표준 반영 여부를 검토합니다.

## 필수 사전 준비

- Atlassian MCP: Jira/Confluence 자동화에 필요
- Figma MCP: 디자인 분석이 필요한 UI 작업에 필요
- `gh` CLI: GitHub Issue, PR 생성, PR 코멘트 등록에 필요
- Playwright MCP: `/e2e` 테스트 저작에 필요 (선택)
- Node.js/npm: hooks와 type-check 실행에 필요

## 기술 스택별 rule

이 프로젝트(FE)에 적용되는 rule입니다. 다른 스택 rule은 이 프로젝트에 배치하지 않았습니다.

- React / Vite (SPA) — 팀 표준: `.claude/rules/fe/react-vite.md`
- FE 컨벤션 (FSD·Atomic·Tailwind·테스트) — 프로젝트 고유: `.claude/rules/fe-convention.md`
- 공통 팀 원칙: `.claude/rules/team.md`, `.claude/rules/project.md`
- 보안/ISMS-P 정본: `.claude/rules/security-compliance.md`
- API 가이드 참조(`/e2e`): `.claude/rules/api-guide-reference.md`
- 도메인 문서 갱신 — 프로젝트 고유: `.claude/rules/domain-update.md`

커밋·PR 규칙은 프로젝트 rule이 아니라 팀 표준 스킬(`/commit`·`/pr`)을 따릅니다.

## 도메인 언어

프로젝트 유비쿼터스 언어는 `.claude/DOMAIN.md`(인덱스)와 `.claude/domain/{domain}.md`(정의 본문)에 둡니다.

해당 도메인 작업(코드·주석·테스트 제목·커밋·UI 문구) 시 관련 도메인 파일을 먼저 읽고 용어를 따릅니다. 새 도메인은 `.claude/domain/_TEMPLATE.md`를 복사해 작성합니다.

## 진행 문서

진행 중 기능의 컨텍스트는 `docs/features/{feature}/plan.md`와 `docs/features/{feature}/progress.md`에 누적합니다.

세션을 이어갈 때는 먼저 해당 feature의 `progress.md`를 확인합니다.
