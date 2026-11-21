# ds-migration — 진행 상황

## 📌 현재 작업

- 이슈: #98 (Refactor)
- 브랜치: refactor/98-ds-migration
- 단계: 컴포넌트 어댑터 교체 중 (Toast·ConfirmDialog·Switch 완료)
- 마지막 업데이트: 2026-11-22

---

## [Issue #98] ds-migration

**Type**: Refactor | **Jira**: 미사용 | **시작**: 2026-11-22

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행)
- [x] `@choi/ds` 의존성 추가 (`github:qlalfdmlghk1/cws-ds#v0.2.0`, 버전 고정)
- [x] 진입점 `styles.css` import + `body` 충돌 정리 (build·test 604건 통과)
- [x] AppToast → DS `ToastProvider` / `useToast` 어댑터
- [x] DS 오버레이 z-index를 프로젝트 레이어(navbar 1000·modal 1100·toast 1200)에 맞춤
- [x] AppConfirmDialog → DS `ConfirmModal` 어댑터
- [x] AppSwitch → DS `Switch` 어댑터

### 🚧 진행 중

- [ ] AppSelect → DS `Select` / `MultiSelect` 어댑터

### 📝 결정 로그

- [2026-11-22] /start 실행, 작업 환경 셋업 완료
- [2026-11-22] 교체 방식: 어댑터 유지 (App* 이름·props 유지, 내부만 DS로 교체)
- [2026-11-22] AppChip → DS `Badge` 대응 (상태 표시 용도. DS `Chip`은 선택형 필터 칩이라 의미 불일치)
- [2026-11-22] 사전 확인: React 19 환경에서 git 설치·`prepare` 빌드 정상. CSS 변수(`--brand` vs `--color-*`)·클래스(`.cds-*`) 충돌 없음. 단 `styles.css`에 전역 `body` 규칙 포함
- [2026-11-22] CSS 로드 순서: DS `styles.css`를 `index.css` **뒤에** import. Tailwind preflight의 `[type='button']{background-color:transparent}`가 `.cds-btn--*`와 specificity(0,1,0)가 같아, DS가 앞에 오면 DS 버튼 배경이 투명해짐. 대신 DS 전역 `body` 규칙이 프로젝트 것을 덮으므로 프로젝트 쪽을 `html body`로 올리고 `word-break`/`overflow-wrap`도 `normal`로 고정해 기존 화면 유지 (DS의 `keep-all`/`anywhere` 채택은 토큰 통일 이슈에서 재검토)
- [2026-11-22] DS 오버레이 z-index(modal·drawer 100, toaster 200, tooltip 300)가 프로젝트 navbar(1000)보다 낮아 모달이 네비게이션 아래로, 토스트가 프로젝트 모달(AiKeyDialog 등, 1100) 뒤로 깔림 → `index.css`에서 `html .cds-*`로 `tailwind.config.js` zIndex 스케일에 맞춤. content에 없는 클래스라 `@layer` 밖에 둠(안에 두면 Tailwind가 purge). DS에 z-index 토큰이 생기면 그쪽으로 이전 (DS 레포 이슈 후보)
- [2026-11-22] AppConfirmDialog: DS `ConfirmModal`이 포커스(danger면 취소)·Esc·처리 중 닫기 차단을 맡으므로 자체 구현 제거. 동작 차이 — 바깥 클릭으로 닫히지 않음(DS alertdialog 정책 채택), 처리 중 Esc 무시(기존엔 닫힘). 설명의 `\n` 줄바꿈은 `whitespace-pre-wrap` span으로 유지
- [2026-11-22] AppSwitch: DS `Switch`(input checkbox 기반)로 교체. 동작 차이 — 라벨이 스위치 **왼쪽**(DS 정책), 크기 md 44×24→36×20 · sm 32×18→28×16
- [2026-11-22] `@choi/ds/fonts.css`(Pretendard)는 import하지 않음 — 프로젝트 본문이 시스템 폰트라 DS 컴포넌트만 Pretendard가 되면 혼재. DS `--font-sans` 폴백(system-ui)으로 렌더. 폰트 통일은 토큰 통일 이슈에서 함께 처리

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

- [2026-11-22] DS 모달·토스트가 네비게이션·프로젝트 모달 아래로 깔림 → `troubleshoot.md`

### ⏭️ 남은 작업

- [ ] AppChip / AppPagination / AppButton 어댑터 교체
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

### Commit — 2026-11-22

- Message: `Refactor:#98 AppToast를 DS ToastProvider 기반으로 교체`
- Issue: `#98`
- Jira: `미사용`

**변경 요약**

- `ToastProvider`: DS `ToastProvider`(position `bottom-right`) + 브리지 컴포넌트로 기존 `showToast(message, type)` 컨텍스트 유지 → 사용처 수정 없음
- `AppToast`: DS `Toast` 래퍼로 교체 (success→`success`, error→`danger` 톤)
- 자체 타이머·목록 관리 코드 제거, `ToastItem` 타입 export 제거 (사용처 없음)
- Storybook `preview.ts`에 `@choi/ds/styles.css` 추가 (앱과 같은 로드 순서)
- 어댑터 동작 테스트 `ToastProvider.test.tsx` 추가

**결정 로그**

- 표시 시간·최대 개수는 DS 기본값 채택 (기존 3초 고정 → 성공 4초 / 에러 6초, 최대 3개). 에러는 `role="alert"`로 즉시 읽힘

**다음 작업**

- AppConfirmDialog → DS ConfirmModal

### Commit — 2026-11-22 00:40

- Message: `Fix:#98 DS 오버레이가 네비게이션·프로젝트 모달 아래로 깔리던 문제 수정`
- Issue: `#98`
- Jira: `미사용`

**변경 요약**

- `index.css`에 `html .cds-modal`·`.cds-drawer`(1100)·`.cds-toaster`(1200)·`.cds-tooltip`(1300) z-index 오버라이드 추가
- 이미 교체한 토스트가 프로젝트 모달 뒤로 깔리던 회귀도 함께 해소
- `troubleshoot.md` 신설

**결정 로그**

- DS에 z-index 토큰이 없어 프로젝트 CSS에서 덮어씀. 규칙은 `@layer` 밖 (purge 회피)

**다음 작업**

- AppConfirmDialog → DS ConfirmModal

### Commit — 2026-11-22 00:45

- Message: `Refactor:#98 AppConfirmDialog를 DS ConfirmModal 기반으로 교체`
- Issue: `#98`
- Jira: `미사용`

**변경 요약**

- `AppConfirmDialog`: DS `ConfirmModal` 래퍼로 교체 (`confirmText`→`confirmLabel`, `cancelText`→`cancelLabel`, `danger`→`tone`, `onCancel`→`onClose`). props 유지로 사용처(기업 조사 편집·지원 현황) 수정 없음
- 자체 포커스·Esc 처리 코드 제거, 어댑터 테스트 `AppConfirmDialog.test.tsx` 6건 추가
- 스토리 `description` argType 설명 갱신

**결정 로그**

- 바깥 클릭으로 닫히지 않음(DS alertdialog 정책 채택), 처리 중 Esc 무시
- 설명의 `\n` 줄바꿈은 `whitespace-pre-wrap` span으로 유지

**다음 작업**

- AppSwitch → DS Switch

### Commit — 2026-11-22 01:00

- Message: `Refactor:#98 AppSwitch를 DS Switch 기반으로 교체`
- Issue: `#98`
- Jira: `미사용`

**변경 요약**

- `AppSwitch`: DS `Switch` 래퍼로 교체. `onChange(checked)` 시그니처 유지(이벤트 → boolean 변환) → 사용처(기업 조사 "조사된 기업" 필터) 수정 없음
- 어댑터 테스트 `AppSwitch.test.tsx` 4건 추가, 스토리 라벨 설명 갱신
- progress 결정 로그의 깨진 줄바꿈(`
`) 표기 수정

**결정 로그**

- 라벨 위치(왼쪽)·크기는 DS 기본값 채택

**다음 작업**

- AppSelect → DS Select / MultiSelect
