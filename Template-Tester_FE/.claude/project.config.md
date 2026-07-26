# Project Config — Template-Tester (FE)

팀 표준 스킬(`/start`·`/commit`·`/pr`·`/review`·`/e2e` 등)이 읽는 프로젝트 설정입니다.
빈 값은 아직 미정 — 해당 스킬을 쓰기 전에 채웁니다.

## Project

- PROJECT_NAME: Template-Tester
- PROJECT_DESCRIPTION: 코딩테스트 템플릿·오답노트와 이론 개념 학습·데일리 적응형 출제를 제공하는 취업 준비 학습 웹 서비스
- PROJECT_STACK: React 19, Vite, TypeScript, Tailwind CSS, Storybook, Vitest, Playwright, Firebase
- BASE_BRANCH: dev # 작업 분기 기준 브랜치 (/start Stage 4) — 보통 GitHub의 DEFAULT_TARGET_BRANCH와 동일 값으로 유지 (다르면 분기 base와 PR/리뷰 base가 어긋남)

## Jira

**이 프로젝트는 Jira를 사용하지 않습니다.** 이슈는 GitHub Issue로만 관리하므로 아래 키는 모두 비워 둡니다.
`/start`는 Jira 단계를 건너뛰고 GitHub Issue만 생성합니다 — 값이 비어 있다고 다시 묻지 마세요.

- JIRA_PROJECT_KEY: # 미사용
- JIRA_DEFAULT_ISSUE_TYPE: # 미사용
- JIRA_DEFAULT_ASSIGNEE_EMAIL: # 미사용
- JIRA_SITE_URL: # 미사용 (팀 기본값이던 incross-platform.atlassian.net 은 이 프로젝트와 무관하여 제거)
- JIRA_LABELS: # 쉼표 구분, 각 라벨은 공백 불가(하이픈·언더스코어 사용). /start가 이슈 생성 시 적용. 라벨 트리거로 하위 업무를 자동 생성하는 Jira 자동화를 쓰면 그 라벨을 반드시 등록 (누락 시 하위 업무 수동 생성 필요)
- JIRA_REVIEW_TRANSITION: # 미사용. (원 설명) /pr 6단계에서 리뷰 후 전이할 목표 상태 이름 (예: 진행 중, In Review). 미설정 시 가능한 전이를 조회해 사용자에게 확인

## GitHub

- GITHUB_REPO_URL: https://github.com/qlalfdmlghk1/Template-Tester
- GITHUB_HOST: # github.com이므로 비워둠
- GITHUB_USERNAME: qlalfdmlghk1 # remote owner 기준 — gh 인증 후 실제 계정과 다르면 수정
- DEFAULT_REVIEWER: # 의도적으로 비움 — /pr 이 리뷰어를 자동 지정하지 않음 (collaborator: qlalfdmlghk1, shhyunn)
- DEFAULT_TARGET_BRANCH: dev # PR 대상·리뷰 비교 브랜치 (/pr·/review) — 보통 BASE_BRANCH와 동일 값으로 유지
- STAGING_BRANCH: staging
- PRODUCTION_BRANCH: product

## Confluence

**이 프로젝트는 Confluence를 사용하지 않습니다.** `/tech-doc`은 발행 대상이 없으므로
Confluence 발행 단계를 건너뛰고 `docs/` 하위 초안까지만 생성합니다 — 값이 비어 있다고 다시 묻지 마세요.

- CONFLUENCE_SPACE: # 미사용
- TECH_DOC_PARENT_PAGE_ID: # 미사용
- TEAM_GUIDE_PAGE_URL: # 미사용

## API / Design References

- API_GUIDE_PATH:
- SWAGGER_URL:
- FIGMA_LIBRARY_URL:

## Project-specific Hooks

필요한 프로젝트에서만 활성화합니다.

- READONLY_EXTERNAL_PATHS:
- SENSITIVE_PATH_PATTERNS:
- TYPECHECK_COMMAND: npx tsc --noEmit --project tsconfig.app.json # package.json에 type-check 스크립트 없음
- COMMIT_GATE_COMMAND: # 커밋 직전 게이트 명령(check-commit-typecheck 훅). 미설정 시 → Node+type-check 스크립트면 `npm run type-check` 자동, 그 외 앱 스택(Gradle·Xcode 등) 감지 시엔 "게이트 미설정" 경고(침묵 통과 방지), 문서/스크립트 레포면 조용히 skip. 스택 예시 → Android `./gradlew ktlintCheck`, iOS `swiftlint lint --strict`, NestJS `npm run typecheck`. Node type-check는 이 키가 아니라 TYPECHECK_COMMAND에 넣으면 커밋 게이트·review-converge 양쪽에 반영됨(이 키는 미설정 시 TYPECHECK_COMMAND를 폴백으로 사용). ⚠️ 값에 공백 뒤 `#`는 주석으로 잘리니 명령에 `#`을 쓰지 말 것
- FORMAT_COMMAND: # 편집 후 포맷 명령(format-edited 훅). 파일 경로가 마지막 인자로 붙는다. 미설정 시 web 확장자는 prettier 자동, 네이티브 확장자는 skip. 스택 예시 → Android `ktlint --format`, iOS `swiftformat`. ⚠️ 값은 공백으로 분해되어 실행되므로 인용/공백 포함 인자는 미지원 — 단순 `bin arg` 형태만 쓸 것

## Planning Review (`/plan-review` skill 사용 시)

- PLANNING_SOURCE_URLS: # 쉼표 구분, 기본 기획 소스(Confluence 등) URL. 있으면 /plan-review 기본 입력으로 사용
- PROTOTYPE_WORKSPACE_URL: # 화면 지도·디스크립션·시안 소스가 되는 프로토타입 워크스페이스 URL
- PLANNING_REVIEW_MAX_ROUNDS: # 자가 재검토 최대 회차 (미설정 시 기본 3)

## Validation / Review Converge (`/review-converge` skill 사용 시)

검증 명령은 config 우선, 없으면 `package.json` scripts 감지, 그래도 없으면 "건너뜀".

- LINT_COMMAND: npm run lint
- TEST_COMMAND: npm run test
- BUILD_COMMAND: npm run build
- REVIEW_CONVERGE_MAX_ROUNDS: # 리뷰 자가수렴 최대 회차 (미설정 시 기본 3)
- # TYPECHECK_COMMAND 는 위 "Project-specific Hooks" 항목을 공용으로 사용

## E2E (`/e2e` skill 사용 시)

Playwright는 설치돼 있으나 아직 E2E 스펙 디렉터리가 없습니다. `/e2e` 사용 전 채웁니다.

- E2E_DIR: e2e # fe-convention.md 기준 (현재 미생성)
- E2E_SELECTORS_SSOT: # 미정
- E2E_VIEWPORTS: # 미정
- E2E_MOCK_MODE: # 미정
- E2E_LEDGER_DIR: docs/e2e
- VISUAL_REGRESSION_TOOL: # 미정 (Storybook 사용 중)
- BREAKPOINTS: # 미정
