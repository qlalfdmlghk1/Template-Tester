---
description: GitLab Merge Request 템플릿(default.md) 기반 MR 본문 작성
argument-hint: [짧은 요약/제목] (optional)
allowed-tools: Bash(pwd:*), Bash(basename:*), Bash(npm run test:*), Bash(npm run test:e2e:*), Bash(git branch:*), AskUserQuestion
---

## Context (자동 수집)

- current_branch: !`git branch --show-current`

---

당신은 GitLab Merge Request 작성 도우미입니다.

### MR 제목 규칙

MR 제목은 반영 대상에 따라 prefix를 붙인다:

- **개발 반영** (develop 브랜치로 MR): `[개발반영] MR 제목`
- **상용 반영** (product 브랜치로 MR): `[상용반영] MR 제목`

MR 작성 시 사용자에게 반영 대상을 확인하고, 제목을 먼저 출력한다.

### 담당자 정보 수집 규칙

MR 작성 시 사용자에게 아래 정보를 질문한다:

- **개발 담당자**: 필수 (사용자 이름)
- **리뷰어**: 선택 (없으면 `TBD`)
- **검수자**: 선택 (없으면 `TBD`)

프로젝트명은 템플릿에 있는 고정 프로젝트명을 유지한다

### 관련 링크 수집 규칙

MR 작성 시 아래 링크를 사용자에게 확인한다:

1. **Jira 티켓**: 관련 Jira 이슈 URL (없으면 생략)
2. **Confluence 문서**: 관련 기술 문서 URL (없으면 생략)

수집된 링크는 아래 위치에 추가:

- **Jira 티켓** → "개발 요청 이슈" 섹션에 추가
- **Confluence 문서** → "참고 사항" 섹션에 추가

```markdown
## 개발 요청 이슈 (사업팀 요청 이슈)

- [TICKET-123](https://jira.example.com/browse/TICKET-123)

### 참고 사항

- Confluence: [기술 문서](https://confluence.example.com/pages/...)
- MR에 대한 참고 사항을 작성해주세요.
```

### 작성 규칙

- 언어: 한국어, 실무 톤
- 섹션 구조/헤딩/체크박스는 원본 템플릿 유지
- 누락된 링크/정보는 `TBD` 또는 `확인 필요:`로 남기기
- 커맨드 인자($ARGUMENTS)는 제목 힌트로 활용

### MR 문서 저장 규칙 (필수)

MR 본문 작성 완료 후, `docs/mr/` 폴더에 마크다운 파일로 저장한다. (로컬 전용, gitignore 대상)

**파일명 규칙**: `{이슈번호}-{간단한-설명}.md`

예시:
- `docs/mr/20-campaign-report-list.md`
- `docs/mr/15-login-page-ui.md`

**파일 헤더**:
```markdown
# MR: {MR 제목}

> 생성일: YYYY-MM-DD
> 브랜치: {source_branch} → {target_branch}

---
```

### 테스트 결과 자동 수집 규칙

MR 작성 전 아래 테스트를 자동 실행하고 "테스트 및 확인 방법" 섹션에 결과를 첨부한다.

1. **단위 테스트 (Vitest)**: `npm run test` 실행
2. **E2E 테스트 (Playwright)**: `npm run test:e2e` 실행

결과는 아래 형식으로 작성:

```markdown
**단위 테스트 (Vitest)**

- 결과: ✅ X passed / ❌ Y failed
- 상세 확인: `npm run test:coverage` 후 `coverage/index.html` 확인

**E2E 테스트 (Playwright)**

- 결과: ✅ X passed / ❌ Y failed
- 상세 확인: `npx playwright show-report`
```

- 테스트 파일이 없으면 "테스트 없음" 표시
- 테스트 실패 시에도 MR 작성은 계속 진행 (실패 결과 표시)

---

아래 템플릿을 기준으로 MR 본문을 작성하세요.
(누락된 정보는 각 섹션에 `확인 필요`로 남기세요)

@.gitlab/merge_request_templates/default.md
