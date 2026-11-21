# ds-migration — 진행 상황

## 📌 현재 작업

- 이슈: #98 (Refactor)
- 브랜치: refactor/98-ds-migration
- 단계: PR 리뷰 대기 (Toast·ConfirmDialog·Switch·Select·TextInput·DatePicker·Button 완료, Chip·Pagination 남음)
- 마지막 업데이트: 2026-11-22

---

## [Issue #98] ds-migration

**Type**: Refactor | **Jira**: 미사용 | **시작**: 2026-11-22

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행)
- [x] `@choi/ds` 의존성 추가 (`github:qlalfdmlghk1/cws-ds#v0.2.0`, 버전 고정 → v0.3.0으로 올림)
- [x] 진입점 `styles.css` import + `body` 충돌 정리 (build·test 604건 통과)
- [x] AppToast → DS `ToastProvider` / `useToast` 어댑터
- [x] DS 오버레이 z-index를 프로젝트 레이어(navbar 1000·modal 1100·toast 1200)에 맞춤
- [x] AppConfirmDialog → DS `ConfirmModal` 어댑터
- [x] AppSwitch → DS `Switch` 어댑터
- [x] AppSelect → DS `Select` / `MultiSelect` 어댑터
- [x] DS v0.3.0 업데이트 + 메인 색(`#3B82F6`)
- [x] DS 입력창 회색·테두리·hover 색을 앱에 맞춤
- [x] AppTextInput·AppDatePicker 추가 + 앱 전체 입력창 교체 (한 줄 입력 43곳·날짜 5곳)
- [x] AppButton → DS `Button` 어댑터

### 🚧 진행 중

- [ ] PR 리뷰

### 📝 결정 로그

- [2026-11-22] /start 실행, 작업 환경 셋업 완료
- [2026-11-22] 교체 방식: 어댑터 유지 (App* 이름·props 유지, 내부만 DS로 교체)
- [2026-11-22] AppChip → DS `Badge` 대응 (상태 표시 용도. DS `Chip`은 선택형 필터 칩이라 의미 불일치)
- [2026-11-22] 사전 확인: React 19 환경에서 git 설치·`prepare` 빌드 정상. CSS 변수(`--brand` vs `--color-*`)·클래스(`.cds-*`) 충돌 없음. 단 `styles.css`에 전역 `body` 규칙 포함
- [2026-11-22] CSS 로드 순서: DS `styles.css`를 `index.css` **뒤에** import. Tailwind preflight의 `[type='button']{background-color:transparent}`가 `.cds-btn--*`와 specificity(0,1,0)가 같아, DS가 앞에 오면 DS 버튼 배경이 투명해짐. 대신 DS 전역 `body` 규칙이 프로젝트 것을 덮으므로 프로젝트 쪽을 `html body`로 올리고 `word-break`/`overflow-wrap`도 `normal`로 고정해 기존 화면 유지 (DS의 `keep-all`/`anywhere` 채택은 토큰 통일 이슈에서 재검토)
- [2026-11-22] DS 오버레이 z-index(modal·drawer 100, toaster 200, tooltip 300)가 프로젝트 navbar(1000)보다 낮아 모달이 네비게이션 아래로, 토스트가 프로젝트 모달(AiKeyDialog 등, 1100) 뒤로 깔림 → `index.css`에서 `html .cds-*`로 `tailwind.config.js` zIndex 스케일에 맞춤. content에 없는 클래스라 `@layer` 밖에 둠(안에 두면 Tailwind가 purge). DS에 z-index 토큰이 생기면 그쪽으로 이전 (DS 레포 이슈 후보)
- [2026-11-22] AppConfirmDialog: DS `ConfirmModal`이 포커스(danger면 취소)·Esc·처리 중 닫기 차단을 맡으므로 자체 구현 제거. 동작 차이 — 바깥 클릭으로 닫히지 않음(DS alertdialog 정책 채택), 처리 중 Esc 무시(기존엔 닫힘). 설명의 `\n` 줄바꿈은 `whitespace-pre-wrap` span으로 유지
- [2026-11-22] AppSwitch: DS `Switch`(input checkbox 기반)로 교체. 동작 차이 — 라벨이 스위치 **왼쪽**(DS 정책), 크기 md 44×24→36×20 · sm 32×18→28×16
- [2026-11-22] AppSelect: DS `Select`/`MultiSelect`로 교체. DS는 string value만 받아 문자열 키로 넘기고 원래 값(number 포함)으로 복원. `width`/`fullWidth` 없으면 부모 너비를 채우는 기존 동작은 래퍼 div로 유지. 다중 선택은 `maxTagCount={1}`(태그 1개 + N). 대응 없고 사용처 없는 `showSelectAll`·`ariaDescribedby` 제거, `state="error"`는 `hint`가 있어야 표시. 드롭다운은 portal 없이 트리거 아래에 그림(모달 안 스크롤 영역에 갇힘 — 사용자 결정으로 DS 그대로 적용, DS 이슈 cws-ds#3). 높이 sm 36→32 · md 44→40 · lg 50→48
- [2026-11-22] DS v0.3.0(브랜드 색 기능) 적용. 메인 색은 앱 primary `#3B82F6` — DS가 흰 글자 4.5:1을 맞추려 라이트에서 `#2B72E5`로 보정, 다크 `#6CA4FF` 자동 생성. 보정된 색 채택(사용자 결정). 값은 `shared/config/brand.ts` 한 곳에 두고 앱은 `<BrandStyle>`(main.tsx), Storybook은 `applyBrandTheme`(preview.ts)으로 적용
- [2026-11-22] DS 회색이 앱보다 진해 튐: `--line-strong`→`--color-gray-400`, `--ink-muted`→`--color-gray-500`로 연결(`html:root`, 앱 gray 변수가 다크에서 바뀌어 한 규칙으로 두 테마). DS 입력창 테두리만 앱 입력창과 같은 `--color-border`(#E5E7EB) — 토큰 전체에 걸면 스위치 꺼짐 트랙까지 흐려져서 `.cds-input`에 한정. 대비는 DS 기본(3:1)보다 낮아지는 앱 선택
- [2026-11-22] DS 입력창 hover 테두리(`--ink-muted`)가 검게 보임 → gray-400. DS hover 규칙의 특정성이 높아 포커스·목록 열림(`.is-open`, 포커스가 목록에 있어 `:focus-within` 아님)·에러 테두리를 덮는 DS 버그를 프로젝트에서 보정 (cws-ds#1, DS 수정 후 제거)
- [2026-11-22] 범위 확장(사용자 결정): DS 셀렉트와 높이를 맞추려 `AppTextInput`(DS TextInput)·`AppDatePicker`(DS Datepicker 단일)를 새로 만들고 앱 전체 `<input>`(text·password·url·number·search 43곳, date 5곳) 교체. 체크박스·라디오·파일·textarea는 제외, `type="time"` 1곳은 DS에 시간 컴포넌트가 없어 기존 input 유지·높이만 맞춤
- [2026-11-22] AppTextInput·AppDatePicker는 래퍼 div가 너비 클래스를 받고 DS 필드는 항상 꽉 채움 — DS 필드 자체 너비(280px/100%)가 Tailwind보다 뒤에 로드돼 너비 클래스가 지기 때문. 날짜 값은 기존과 같은 'YYYY-MM-DD'라 저장 데이터 변경 없음. DS Datepicker가 aria-label을 받지 않아 `ariaLabel`은 래퍼 `role="group"`에 붙임 (cws-ds#4). 연봉 칸은 DS가 aria-describedby를 덮어써 "만원"·안내를 `suffix`·`helperText`로 옮김 (cws-ds#5)
- [2026-11-22] size 기준: 같은 줄 셀렉트에 맞춤. 오답노트 작성·수정 폼과 목록 필터·정렬·검색은 md(40), 채용 화면(필터·모달 폼·일정)은 sm(32)
- [2026-11-22] AppButton: DS 모양 4종으로 매핑 — solid 파랑→primary, 빨강→danger, 회색→secondary / outline→secondary / ghost→ghost. outline·ghost의 파란 글자는 DS처럼 중립색, **빨간 글자만 유지**(삭제 버튼 4곳, 사용자 결정) — `.app-btn--danger` 클래스 + index.css(`--danger-ink`, hover `--danger-soft`). 높이 lg 50→48 · md 44→40 · sm 36→32, xs는 sm(32). props 유지로 94곳 사용처 수정 없음
- [2026-11-22] `@choi/ds/fonts.css`(Pretendard)는 import하지 않음 — 프로젝트 본문이 시스템 폰트라 DS 컴포넌트만 Pretendard가 되면 혼재. DS `--font-sans` 폴백(system-ui)으로 렌더. 폰트 통일은 토큰 통일 이슈에서 함께 처리

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

- [2026-11-22] DS 모달·토스트가 네비게이션·프로젝트 모달 아래로 깔림 → `troubleshoot.md`

### ⏭️ 남은 작업

- [ ] AppChip / AppPagination 어댑터 교체
- [ ] textarea → DS Textarea (이번 범위 제외)
- [ ] 전체 테스트 실행 시 일부 테스트 5초 타임아웃 (단독 실행은 통과) — testTimeout 조정 여부 결정
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

### Commit — 2026-11-22 03:10

- Message: `Refactor:#98 AppSelect를 DS Select·MultiSelect 기반으로 교체`
- Issue: `#98`
- Jira: `미사용`

**변경 요약**

- `AppSelect`: 자체 드롭다운(포털·키보드·위치 계산 등)을 DS `Select`/`MultiSelect` 래퍼로 교체. 사용처 8개 파일 수정 없음
- 문자열 키 변환으로 숫자 value(월 선택 등) 유지, 비제어 전환을 막기 위해 빈 값은 `""`/`[]`로 전달
- 타입에서 `showSelectAll`·`ariaDescribedby` 제거, 관련 스토리 정리. 어댑터 테스트 6건 추가

**결정 로그**

- 드롭다운 portal 없음은 DS 그대로 채택 (cws-ds#3)
- 스토리 파일의 기존 eslint 에러(render 안 useState, 20→17건)는 범위 밖이라 유지

**다음 작업**

- DS v0.3.0 업데이트 + 메인 색

### Commit — 2026-11-22 03:12

- Message: `Chore:#98 DS v0.3.0으로 올리고 메인 색을 앱 primary로 적용`
- Issue: `#98`
- Jira: `미사용`

**변경 요약**

- `@choi/ds` `#v0.2.0` → `#v0.3.0` (lockfile resolved 형식은 기존과 같은 git+ssh)
- `src/shared/config/brand.ts`에 `BRAND_COLOR` 추가, `main.tsx`에 `<BrandStyle>`, Storybook `preview.ts`에 `applyBrandTheme`

**결정 로그**

- 라이트 보정색 `#2B72E5` 채택 (기존 버튼 `#3B82F6`보다 한 단계 진함 — AppButton 교체 후 통일)

**다음 작업**

- DS 입력창 색을 앱 회색에 맞춤

### Commit — 2026-11-22 03:14

- Message: `Style:#98 DS 입력창 회색·테두리·hover 색을 앱에 맞춤`
- Issue: `#98`
- Jira: `미사용`

**변경 요약**

- `index.css`: DS 회색 토큰을 앱 gray에 연결, DS 입력창 테두리를 `--color-border`로, hover 테두리를 gray-400으로
- 포커스·목록 열림·에러 상태는 hover해도 원래 테두리색 유지

**결정 로그**

- 셀렉트 선택 후·목록 연 채 hover 시 검은 테두리 → DS 버그로 판단, DS 레포 이슈 등록 (cws-ds#1~#5: hover 버그, z-index 토큰, portal 옵션, Datepicker aria-label, TextInput aria-describedby)

**다음 작업**

- AppTextInput·AppDatePicker 추가 + 입력창 교체

### Commit — 2026-11-22 03:16

- Message: `Feat:#98 DS 기반 AppTextInput·AppDatePicker 추가 및 입력창 교체`
- Issue: `#98`
- Jira: `미사용`

**변경 요약**

- `shared/ui/atoms/AppTextInput`, `AppDatePicker` 추가 (스토리·테스트 포함)
- 20개 파일의 한 줄 입력·날짜 입력 교체. 미사용 스타일 상수(`INPUT_CLASS` 등) 제거, 검색 돋보기는 `iconLeft`로
- 오답노트 작성·수정 폼과 목록 화면의 셀렉트를 md로 통일
- API 키 입력은 `[&_input]:font-mono`로 고정폭 글꼴 유지

**결정 로그**

- 시간 입력은 네이티브 유지 (DS에 없음)

**다음 작업**

- AppButton → DS Button

### Commit — 2026-11-22 03:18

- Message: `Refactor:#98 AppButton을 DS Button 기반으로 교체`
- Issue: `#98`
- Jira: `미사용`

**변경 요약**

- `AppButton`: DS `Button` 래퍼로 교체 (variant×color → DS variant, xs→sm, width는 인라인 스타일)
- 테두리·투명 버튼의 빨간 글자를 위한 `index.css` 규칙 추가 (DS ghost hover 글자색 규칙보다 우선하도록 `.cds-btn` 겹침)
- 어댑터 테스트 추가, 스토리 설명 갱신

**결정 로그**

- 같은 size면 버튼·입력창·셀렉트 높이가 같아짐

**다음 작업**

- PR 리뷰 (사용자가 다음 날 진행), AppChip·AppPagination
