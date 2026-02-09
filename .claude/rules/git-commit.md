# Git 커밋 규칙

## 이슈 번호 포함 (강제)

커밋 메시지에 관련 GitLab 이슈 번호를 포함합니다.

### 이슈 번호 추출 방법

1. 현재 브랜치명에서 추출 (예: `init/1-xxx` → `#1`, `feature/23-login` → `#23`)
2. 브랜치명에 이슈 번호가 없으면 사용자에게 확인

### 커밋 메시지 형식

```
<type>:#<이슈번호> <subject>

<body>
```

**주의**: footer에 Claude 관련 서명 (🤖 Generated with Claude Code, Co-Authored-By 등)을 포함하지 않습니다.

### 예시

```bash
# 브랜치: init/1-core-libs-and-test-env
Feat:#1 ECharts 플러그인 설정

# 브랜치: feature/23-user-auth
Fix:#23 로그인 토큰 갱신 오류 수정
```

### Type 종류

| Type | 설명 |
|------|------|
| Feat | 새로운 기능 |
| Fix | 버그 수정 |
| Docs | 문서 변경 |
| Style | 코드 포맷팅 (기능 변화 없음) |
| Refactor | 리팩토링 |
| Test | 테스트 추가/수정 |
| Chore | 빌드, 설정 등 기타 변경 |
