# ds-v040 — 진행 상황

## 📌 현재 작업

- 이슈: #100 (Refactor)
- 브랜치: refactor/100-ds-v040
- 단계: 구현 완료 → 화면 확인·커밋·PR
- 마지막 업데이트: 2026-11-22

---

## [Issue #100] ds-v040

**Type**: Refactor | **Jira**: 미사용 | **시작**: 2026-11-22

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행 — 이슈 #100은 PR #99 리뷰 후 미리 생성, Jira 미사용)
- [x] `@choi/ds` v0.4.0 커밋 해시(`277fb98`) 고정 + 어댑터 DS import 새 이름(`Ds*` 별칭)으로 교체
- [x] z-index 오버라이드 → DS 토큰(`--z-modal`·`--z-portal`·`--z-toast`·`--z-tooltip`), hover 버그 보정 규칙 삭제
- [x] 라벨 연결: AppSelect·AppDatePicker `ariaLabel`/`ariaLabelledby`, 앱 셀렉트 31곳 전부 이름 부여
- [x] portal: 지원 등록 모달 기업 셀렉트, ScheduleInput(지원 등록·전형 편집 모달) 셀렉트·달력
- [x] 날짜 지우기: AppDatePicker `clearable`, ScheduleInput 3곳 적용
- [x] 코드 정리: AppChip `cn`, barrel import 통일, Storybook 브랜드 색 경로 사유 주석
- [x] 테스트·스토리: ScheduleInput(5) · AppDatePicker(+5) · AppSelect(+6) · AppPagination(+2) 테스트, AppPagination 스토리 신설, AppSelect·AppDatePicker 스토리에 새 props

### 🚧 진행 중

- [ ] 화면 확인 → 커밋 → PR

### 📝 결정 로그

- [2026-11-22] /start 실행, 작업 환경 셋업 완료. 기획 검수는 건너뜀(범위가 PR #99 리뷰 결과로 확정된 리팩터링)
- [2026-11-22] v0.4.0 확인: 태그 `v0.4.0` = 커밋 `277fb98`(컴포넌트 `App*` 접두사 포함). 예전 이름(`Button` 등)은 deprecated 별칭으로 남고 v0.5에서 삭제 예정 → 이번에 새 이름으로 교체. 버튼형 입력(Select·MultiSelect·Datepicker)은 `aria-label`/`aria-labelledby`를 받아 "이름, 현재 값"으로 읽힘. 날짜 지우기는 v0.4.0에도 없어 앱 어댑터에서 구현
- [2026-11-22] DS import 별칭은 `Ds*`(`import { AppButton as DsButton } from "@choi/ds"`) — DS 이름이 앱 어댑터와 같아 그대로 import하면 충돌. 사용처는 그대로 (사용자 확인)
- [2026-11-22] 의존성은 태그 대신 커밋 해시로 고정. 이번 설치로 lockfile에 `integrity`가 생김(git 의존성이라 npm은 검사를 건너뜀 경고)
- [2026-11-22] z-index: DS 클래스 덮어쓰기 대신 DS 토큰을 `html:root`에서 지정. `tailwind.config.js` zIndex에 `portal: 1150`(모달 1100 위, 토스트 1200 아래)·`tooltip: 1300` 추가. tooltip 매직넘버 제거
- [2026-11-22] 입력창 hover: DS v0.4.0이 포커스·열림·에러 상태를 덮지 않게 고쳐(cws-ds#1) 보정 2규칙 삭제. hover 색만 앱 기준 gray-400 유지 — DS와 같은 선택자로 덮어 상태 테두리는 건드리지 않음
- [2026-11-22] 남는 오버라이드 블록 머리에 기준 버전(v0.4.0)·버전업 점검 항목, 규칙마다 `[유지: 사유]` 주석. 어댑터 전용 CSS의 shared 이동은 하지 않음(남은 규칙 4개, Out of Scope)
- [2026-11-22] 라벨: 바깥 `<label>`은 `htmlFor`(클릭하면 셀렉트 열림)는 두고 `id`를 더해 `ariaLabelledby`로 이름 연결 — 지원 등록 "기업", 오답노트 작성·수정 폼 5칸, 템플릿 등록 카테고리. 라벨 없는 필터·정렬은 값을 고르면 placeholder가 사라져 이름이 없어지므로 `ariaLabel`(플랫폼·알고리즘·반기 등). AppDatePicker의 래퍼 `role="group"` 방식은 제거
- [2026-11-22] portal은 모달 안 스크롤 영역(지원 등록·전형 편집)에만. 프로젝트 모달은 배경 클릭으로만 닫히고 Esc 처리가 없어 portal 목록과 충돌 없음
- [2026-11-22] 날짜 지우기: `clearable`이면 값이 있을 때만 오른쪽에 DS `AppIconButton`(X, 툴팁 없음). 지운 뒤 포커스는 날짜 트리거로. 오답노트 날짜(오늘 기본값·필수)에는 켜지 않음
- [2026-11-22] AppDatePicker 빈 값: DS가 `null`을 비제어로 받아 이전 날짜가 남는 문제 → 값이 있다가 비워질 때만 `key`를 바꿔 리마운트(빈 값 → 선택 때는 리마운트하지 않아 포커스 유지). 렌더 중 이전 값 비교로 처리
- [2026-11-22] ScheduleInput 정확한 일시: 날짜를 지우면 시각도 함께 비움(`at: ""`, `hasTime: false`) — 기존에도 날짜만 비우면 `"T14:30"`이 되던 문제를 지우기 버튼 도입에 맞춰 수정
- [2026-11-22] `testTimeout`은 올리지 않음 — 전체 실행 2회(655건, 673건) 모두 5초 타임아웃 재현 안 됨. 재발하면 그때 조정
- [2026-11-22] Storybook 브랜드 색은 `applyBrandTheme` 유지 — DS가 브라우저용으로 안내하는 API이고 decorator(`preview.tsx` 전환)보다 변경이 작음. 앱과 경로가 다른 이유를 주석으로

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

### ⏭️ 남은 작업

- [ ] 화면 확인: 지원 등록 모달(기업 셀렉트 portal·일정 날짜 지우기), 전형 편집 모달, 모달·토스트·툴팁 겹침, 입력창 hover·포커스 테두리, 다크 테마
- [ ] 별도 이슈 후보: E2E 신설, 로그인·회원가입 `autoComplete`, `npm audit`, `@choi/ds` import 제한 ESLint, 기존 컴포넌트 barrel 일괄 도입, DS에 `clearable`·warning 톤 제안

### Commit — 2026-11-22 21:19

- Message: `Chore:#100 @choi/ds v0.4.0 고정 및 DS 오버라이드 정리`
- Issue: `#100`
- Jira: `미사용`

**변경 요약**

- `@choi/ds`를 v0.4.0 커밋 해시(`277fb98`)로 고정 (lockfile에 integrity 생김)
- 어댑터(Button·Chip·Switch·TextInput·ConfirmDialog·Toast)와 `main.tsx`의 DS import를 새 `App*` 이름 + `Ds*` 별칭으로 교체, AppChip 클래스 조합 `cn`
- `index.css`: z-index를 DS 토큰(`--z-*`)으로, hover 버그 보정 2규칙 삭제, 블록 머리에 기준 버전·점검 항목, 규칙별 `[유지: 사유]`
- `tailwind.config.js` zIndex에 `portal`(1150)·`tooltip`(1300), Storybook 브랜드 색 경로 사유 주석

**결정 로그**

- 예전 DS 이름은 v0.5에서 삭제 예정이라 이번에 교체. 별칭은 `Ds*` (사용자 확인)

**다음 작업**

- 라벨 연결·portal·날짜 지우기·테스트 커밋

### Commit — 2026-11-22 21:20

- Message: `Feat:#100 셀렉트·날짜 칸 접근성 이름·portal·날짜 지우기 추가`
- Issue: `#100`
- Jira: `미사용`

**변경 요약**

- AppSelect·AppDatePicker에 `ariaLabel`·`ariaLabelledby`·`portal`, AppDatePicker에 `clearable`과 빈 값 리마운트
- 사용처 셀렉트 31곳 전부 이름 부여 (바깥 라벨은 id + ariaLabelledby, 필터·정렬은 ariaLabel)
- 지원 등록·전형 편집 모달 안 셀렉트·달력 portal, 채용 일정 날짜 지우기(정확한 일시는 시각도 함께 비움)
- 오답노트·템플릿 등록 import를 barrel로 통일
- 테스트: ScheduleInput 신규 5, AppDatePicker +5, AppSelect +6, AppPagination +2 / 스토리: AppPagination 신설, AppSelect·AppDatePicker 새 props

**결정 로그**

- 오답노트 날짜(오늘 기본값·필수)에는 clearable을 켜지 않음
- testTimeout은 올리지 않음 (전체 673건 통과, 타임아웃 재현 안 됨)

**다음 작업**

- PR(dev) 생성 및 리뷰
