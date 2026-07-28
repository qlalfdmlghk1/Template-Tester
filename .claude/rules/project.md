# Project Rule

프로젝트별 예외와 설정은 `.claude/project.config.md`를 기준으로 합니다.

## 확인할 값

- 프로젝트명과 설명
- 기본 브랜치
- Jira 프로젝트 키와 이슈 타입
- GitHub assignee/reviewer
- Confluence 발행 위치
- API 가이드 문서 위치
- 프로젝트 특수 hook

## 원칙

- 팀 표준 skill을 수정하기 전에 `project.config.md`로 해결 가능한지 먼저 확인합니다.
- 특정 프로젝트에만 필요한 hook이나 rule은 팀 공통으로 올리기 전에 파일럿 결과를 남깁니다.
- 프로젝트별 컨벤션이 팀 표준과 충돌하면 사용자에게 확인하고 진행합니다.
