# ds-migration — 진행 상황

## 📌 현재 작업

- 이슈: #98 (Refactor)
- 브랜치: refactor/98-ds-migration
- 단계: Phase 1 시작
- 마지막 업데이트: 2026-11-22

---

## [Issue #98] ds-migration

**Type**: Refactor | **Jira**: 미사용 | **시작**: 2026-11-22

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행)
- [x] `@choi/ds` 의존성 추가 (`github:qlalfdmlghk1/cws-ds#v0.2.0`, 버전 고정)
- [x] 진입점 `styles.css` import + `body` 충돌 정리 (build·test 604건 통과)

### 🚧 진행 중

- [ ] AppToast → DS `ToastProvider` / `useToast` 어댑터

### 📝 결정 로그

- [2026-11-22] /start 실행, 작업 환경 셋업 완료
- [2026-11-22] 교체 방식: 어댑터 유지 (App* 이름·props 유지, 내부만 DS로 교체)
- [2026-11-22] AppChip → DS `Badge` 대응 (상태 표시 용도. DS `Chip`은 선택형 필터 칩이라 의미 불일치)
- [2026-11-22] 사전 확인: React 19 환경에서 git 설치·`prepare` 빌드 정상. CSS 변수(`--brand` vs `--color-*`)·클래스(`.cds-*`) 충돌 없음. 단 `styles.css`에 전역 `body` 규칙 포함
- [2026-11-22] CSS 로드 순서: DS `styles.css`를 `index.css` **뒤에** import. Tailwind preflight의 `[type='button']{background-color:transparent}`가 `.cds-btn--*`와 specificity(0,1,0)가 같아, DS가 앞에 오면 DS 버튼 배경이 투명해짐. 대신 DS 전역 `body` 규칙이 프로젝트 것을 덮으므로 프로젝트 쪽을 `html body`로 올리고 `word-break`/`overflow-wrap`도 `normal`로 고정해 기존 화면 유지 (DS의 `keep-all`/`anywhere` 채택은 토큰 통일 이슈에서 재검토)
- [2026-11-22] `@choi/ds/fonts.css`(Pretendard)는 import하지 않음 — 프로젝트 본문이 시스템 폰트라 DS 컴포넌트만 Pretendard가 되면 혼재. DS `--font-sans` 폴백(system-ui)으로 렌더. 폰트 통일은 토큰 통일 이슈에서 함께 처리

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

### ⏭️ 남은 작업

- [ ] AppButton / AppChip / AppSelect / AppSwitch / AppPagination / AppToast / AppConfirmDialog 어댑터 교체
- [ ] Storybook 스토리 갱신
- [ ] 영향받는 테스트 수정

### Commit — 2026-11-22

- Message: `Chore:#98 @choi/ds 의존성 추가 및 전역 스타일 연결`
- Issue: `#98`
- Jira: `미사용`

**변경 요약**

- `@choi/ds`(v0.2.0) 의존성 추가, `main.tsx`에서 `index.css` 뒤에 `@choi/ds/styles.css` import
- `index.css`의 `body`를 `html body`로 올려 DS 전역 body 규칙(배경·색·폰트·줄바꿈) 덮어쓰기 방지
- ds-migration plan.md / progress.md 추가

**결정 로그**

- DS CSS는 Tailwind preflight 뒤에 로드 (버튼 배경 specificity 충돌 회피)
- `fonts.css`(Pretendard)는 import하지 않음

**다음 작업**

- AppToast → DS ToastProvider/useToast 어댑터
