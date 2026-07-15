# project-ux-improvement — 진행 상황

## 📌 현재 작업

- 이슈: #61 (Refactor)
- 브랜치: refactor/61-project-ux-improvement
- 단계: Phase 1 시작
- 마지막 업데이트: 2026-07-16

---

## [Issue #61] project-ux-improvement

**Type**: Refactor | **Jira**: 미사용 | **시작**: 2026-07-16

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행)

### 🚧 진행 중

- [ ] 헤더 영역 UX 개선

### 📝 결정 로그

- [2026-07-16] /start 실행, 작업 환경 셋업 완료 (Jira 미사용)

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

### ⏭️ 남은 작업

- 없음

### Commit — 2026-07-16 00:44

- Message: `Refactor:#61 헤더 UX 개선 및 친구 탭 위치 이동`
- Issue: `#61`
- Jira: 미사용

**변경 요약**

- 로고 영역에 `public/template-tester.svg` 로고 이미지를 "템플릿 테스터" 텍스트 왼쪽에 추가 (다크 모드 시 invert)
- 모바일에서 "템플릿 테스터"를 두 줄(템플릿 / 테스터)로 표시
- 헤더 상단 메뉴가 줄바꿈되지 않도록 `flex-nowrap` + 버튼 `whitespace-nowrap` 적용
- '친구' 탭을 상단 메뉴에서 유저 dropdown 하위로 이동, 미확인 친구 요청 배지도 아바타/드롭다운으로 이동
- 유저 dropdown이 화면 오른쪽으로 넘치던 문제 수정 (`left-0` 제거, `right-0` 기준 정렬)

**결정 로그**

- 로고 SVG가 단색(`#000000`)이라 다크 모드 대응은 `isDark` 기반 `filter: invert(1)` 인라인 스타일로 처리 (동적 값이라 인라인 허용)
- 친구 알림 배지는 dropdown이 닫혀 있을 때는 아바타에, 열려 있을 때는 '친구' 항목에 표시해 알림 누락 방지

**다음 작업**

- 없음
