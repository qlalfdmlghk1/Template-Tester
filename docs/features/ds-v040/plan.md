# ds-v040

| 항목         | 값                                                                       |
| ------------ | ------------------------------------------------------------------------ |
| Jira         | 미사용                                                                   |
| GitHub Issue | [#100](https://github.com/qlalfdmlghk1/Template-Tester/issues/100)       |
| Branch       | `refactor/100-ds-v040`                                                   |
| 작성자       | qlalfdmlghk1                                                             |
| 작성일       | 2026-11-22                                                               |
| Type         | Refactor                                                                 |

## 🎯 작업 목적

`@choi/ds`를 v0.4.0으로 올려 #98(PR #99)에서 앱 쪽에 덧대 둔 보정을 DS 기능으로 대체하고, 리뷰에서 나온 접근성 회귀·날짜 비우기 불가·코드 정리 항목을 마무리하기 위해

## 📋 작업 범위

**포함 (In Scope)**

DS 업그레이드
- [x] `@choi/ds`를 v0.4.0 커밋 해시(`277fb98…`)로 고정 (태그 대신 — 리뷰 보안 Medium)
- [x] 어댑터의 DS import를 새 이름(`AppButton`·`AppSelect`·`AppDatepicker`·`AppBrandStyle` …)으로 교체. 앱 어댑터와 이름이 겹치므로 `Ds*` 별칭으로 import (예전 이름은 v0.5에서 삭제 예정)

v0.4.0으로 해결
- [x] 라벨 연결: AppSelect·AppDatePicker에 `ariaLabel`/`ariaLabelledby`를 DS `aria-label`/`aria-labelledby`로 전달. 지원 등록 "기업" 셀렉트와 오답노트 날짜 칸을 바깥 label id로 연결. 접근성 이름 테스트 추가
- [x] z-index 오버라이드를 DS 토큰(`--z-modal`·`--z-toast`·`--z-tooltip` 등)으로 이전, tooltip 매직넘버 제거
- [x] 입력창 hover 테두리 보정 규칙(cws-ds#1) 삭제
- [x] 모달 안 스크롤 영역의 셀렉트·달력에 `portal` 적용 (지원 등록 모달 등)
- [x] 남는 DS 오버라이드 블록에 기준 버전·규칙별 제거 조건 주석

날짜 지우기
- [x] AppDatePicker에 `clearable` prop 추가 (값이 있을 때 지우기 버튼 → `onChange("")`), 채용 일정(ScheduleInput) 3곳에 적용
- [x] AppDatePicker 빈 값 제어 보완 (`value || null` 주석 수정, 필요 시 `key`로 리마운트) + 테스트

코드 정리
- [x] AppChip 클래스 조합을 `cn`으로
- [x] AppTextInput·AppDatePicker import를 barrel(`index.ts`)로 통일 (오답노트 2곳·템플릿 등록)
- [x] 브랜드 색 적용 경로 통일 (Storybook도 `AppBrandStyle` decorator) 또는 사유 주석

테스트·스토리
- [x] `ScheduleInput.test.tsx` (날짜+시간 결합, 기간 시작·종료 갱신, 지우기)
- [x] AppSelect 너비 래퍼 테스트, AppPagination `onPageSizeChange` 테스트
- [x] AppPagination 스토리 (Default·Ellipsis·WithPageSize)
- [x] `testTimeout` 상향 여부 결정

**제외 (Out of Scope)**

- 어댑터 전용 CSS(`.app-btn--danger`·`.app-chip--*`)의 shared 이동 — 남는 규칙이 적으면 주석으로 대신, 별도 판단
- 기존 컴포넌트(AppButton·AppChip·AppPagination 등) barrel 일괄 도입 — 별도 이슈
- E2E 디렉토리 신설, 로그인·회원가입 `autoComplete`, `npm audit` 대응, `@choi/ds` import 제한 ESLint 규칙 — 별도 이슈
- textarea → DS Textarea, Tailwind 토큰 ↔ DS 변수 통일, Pretendard 폰트 도입
- DS 레포 자체 수정 (날짜 지우기는 앱 어댑터에서 처리. DS `clearable`은 DS 이슈로 제안만)

## 🛠️ 접근 방식

- 순서: ① 의존성 고정 + import 이름 교체(동작 변화 없음, 테스트로 확인) → ② z-index·hover 오버라이드 정리 → ③ 라벨·portal → ④ 날짜 지우기 → ⑤ 코드 정리 → ⑥ 테스트·스토리. 단계마다 커밋
- 어댑터의 App* 이름·props는 유지(사용처 영향 최소). DS 컴포넌트는 `import { AppButton as DsButton } from "@choi/ds"` 형태
- 오버라이드 삭제 전후는 Storybook·dev 서버에서 모달·토스트·툴팁 겹침 순서, 입력창 hover·포커스·에러 테두리를 눈으로 확인
- 지우기 버튼은 DS `AppIconButton`(X 아이콘) 재사용 검토, 트리거 오른쪽에 배치

## 🔗 참고 자료

| 유형       | 링크                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------ |
| Figma      | -                                                                                                |
| Storybook  | 로컬 `npm run storybook`                                                                         |
| API 명세   | `node_modules/@choi/ds/dist/index.d.ts` (v0.4.0)                                                 |
| Confluence | 미사용                                                                                           |
| 기타       | [PR #99 리뷰](https://github.com/qlalfdmlghk1/Template-Tester/pull/99#issuecomment-7076171671) · [cws-ds v0.4.0](https://github.com/qlalfdmlghk1/cws-ds/releases/tag/v0.4.0) · 이전 작업 `docs/features/ds-migration/` |

## ✅ 검증 계획

- 단위/통합 테스트: 어댑터 기존 테스트 전부 통과 + 라벨 이름(`getByRole(..., { name })`)·날짜 지우기·ScheduleInput·AppSelect 너비·AppPagination 페이지 크기 테스트 추가. `npx vitest run` 전체, `tsc`, ESLint, `npm run build`
- 회귀 포인트: DS 오버라이드 삭제로 인한 겹침 순서(navbar 1000 · modal 1100 · toast 1200), 입력창 테두리 색, portal 적용 후 목록 위치·스크롤 추적, DS v0.4.0의 Esc·Tab 동작 변화(모달 안 목록 Esc는 목록만 닫힘)
- 수동 확인: 지원 등록 모달(기업 셀렉트·일정 날짜 지우기·모달 안 목록 잘림), 오답노트 작성(날짜), AI 키 다이얼로그 위 토스트, 다크 테마

## 🤔 주요 결정 사항

<!-- /note 또는 수동으로 추가 -->

- DS import 별칭은 `Ds*` (예: `AppButton as DsButton`) — DS v0.4.0 이름이 앱 어댑터와 겹침 (사용자 확인)
- 날짜를 지우면(정확한 일시) 시각도 함께 비움 — 시각만 남은 `"T14:30"` 방지
- `testTimeout`은 올리지 않음 — 전체 실행 2회(655·673건) 모두 타임아웃 재현 안 됨
- Storybook 브랜드 색은 `applyBrandTheme` 유지 + 사유 주석 (decorator 전환 대신)
