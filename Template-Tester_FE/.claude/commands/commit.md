---
description: 커밋 규칙 준수 + 메시지 자동 생성 (민감파일 체크, Type 추천, 단위 가이드)
allowed-tools: Bash(git:*)
---

## Context (자동 수집)

- current_branch: !`git branch --show-current`
- git_status: !`git status --porcelain`
- git_diff_stat: !`git diff --stat`
- staged_files: !`git diff --cached --name-only`

---

당신은 Git 커밋 도우미입니다. 아래 단계를 순서대로 수행합니다.

## 참조 규칙

- @.claude/rules/git-commit.md - 커밋 메시지 형식
- @.claude/rules/team.md - Git 금지 사항 (3.1절)

---

## 1단계: 민감 파일 체크

staged_files에서 아래 패턴과 일치하는 파일이 있는지 확인합니다:

- `.env*` (단, `.env.example` 제외)
- `*credentials*`
- `*secret*`
- `*.pem`
- `*.key`
- `*password*`
- `*token*` (단, 코드 파일 제외)

**발견 시:**
```
⚠️ 민감 파일 감지
- [파일명]

이 파일을 커밋하시겠습니까? (보안 위험이 있을 수 있습니다)
```
→ 사용자 확인 후 진행

---

## 2단계: 커밋 단위 검토

git_diff_stat을 분석하여:
- 변경 파일 10개 이상
- 또는 변경 라인 500줄 이상

**해당 시:**
```
📦 변경사항이 큽니다
- 파일: N개
- 변경: +X, -Y 라인

커밋을 분리하시겠습니까? 관련된 변경끼리 묶으면 리뷰가 쉬워집니다.
```
→ 사용자 결정에 따라 진행

---

## 3단계: Type 자동 추천

변경 파일 경로/확장자를 분석하여 Type을 추천합니다:

| 파일 패턴 | 추천 Type |
|-----------|-----------|
| `*.md`, `.claude/`, `docs/` | Docs |
| `*.spec.ts`, `*.test.ts`, `e2e/` | Test |
| `*.config.*`, `package.json`, `.gitignore` | Chore |
| `*.stories.ts` | Chore |
| 새 파일 추가 위주 | Feat |
| 기존 파일 수정 위주 | Fix 또는 Refactor |

**출력:**
```
🏷️ Type 추천: [Type]
(변경 파일 분석 기반)

이 Type으로 진행할까요?
```
→ 사용자가 다른 Type 선택 가능

---

## 4단계: 이슈 번호 추출

current_branch에서 이슈 번호를 추출합니다:
- `init/1-xxx` → `#1`
- `feature/23-login` → `#23`
- `fix/456-bug` → `#456`

**추출 실패 시:**
```
브랜치명에서 이슈 번호를 찾을 수 없습니다.
이슈 번호를 입력해주세요:
```

---

## 5단계: 커밋 메시지 생성

변경 내용을 분석하여 커밋 메시지를 제안합니다.

**형식:**
```
<Type>:#<이슈번호> <subject>

<body> (선택)
```

**규칙:**
- subject: 한국어, 50자 이내, 명령형
- body: 필요시 상세 내용 (what & why)
- footer: Claude 서명 포함하지 않음

**출력:**
```
📝 커밋 메시지 제안:

Type:#N 제안된 메시지

이 메시지로 커밋할까요? (수정하려면 직접 입력)
```

---

## 6단계: 커밋 실행

사용자 확인 후 커밋을 실행합니다.

```bash
git commit -m "Type:#N 메시지"
```

**완료 후:**
```
✅ 커밋 완료
- 해시: [commit hash]
- 메시지: Type:#N 메시지
```
