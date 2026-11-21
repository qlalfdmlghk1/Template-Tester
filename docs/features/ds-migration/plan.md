# ds-migration

| 항목         | 값                          |
| ------------ | --------------------------- |
| Jira         | 미사용                      |
| GitHub Issue | [#98](https://github.com/qlalfdmlghk1/Template-Tester/issues/98) |
| Branch       | `refactor/98-ds-migration`  |
| 작성자       | qlalfdmlghk1                |
| 작성일       | 2026-11-22                  |
| Type         | Refactor                    |

## 🎯 작업 목적

shared/ui 공통 컴포넌트를 개인 디자인 시스템 `@choi/ds`(v0.2.0) 기반으로 교체해 UI 일관성·접근성·다크 모드를 DS 하나로 관리하기 위해

## 📋 작업 범위

**포함 (In Scope)**

- [ ] `@choi/ds` 의존성 추가 (`github:qlalfdmlghk1/cws-ds#v0.2.0`, 버전 고정)
- [ ] 앱 진입점(`src/app/main.tsx`)에 `@choi/ds/styles.css` import, 필요 시 `fonts.css`
- [ ] DS `styles.css`의 전역 `body` 규칙(배경·글자색·폰트)과 `src/app/styles/index.css`의 `body` 충돌 정리
- [ ] `AppButton` → DS `Button` 어댑터로 교체 (variant × color, `xs`, `width` 매핑)
- [ ] `AppChip` → DS `Badge` 어댑터로 교체 (warning·purple 톤 매핑)
- [ ] `AppSelect` → DS `Select` / `MultiSelect` 어댑터로 교체 (`multiple`, 숫자 value 변환)
- [ ] `AppSwitch` → DS `Switch` 어댑터로 교체
- [ ] `AppPagination` → DS `Pagination` 어댑터로 교체 (페이지 크기 선택 처리)
- [ ] `AppToast` → DS `ToastProvider` / `useToast` 어댑터로 교체 (`showToast(message, type)` 시그니처 유지)
- [ ] `AppConfirmDialog` → DS `ConfirmModal` 어댑터로 교체 (`onCancel`→`onClose`, `danger`→`tone`)
- [ ] 교체한 컴포넌트의 Storybook 스토리 갱신
- [ ] 영향받는 테스트 수정 (`useCompanyResearch.spec.tsx`, `useRecruitmentPage.spec.ts` 등)

**제외 (Out of Scope)**

- Tailwind 색 토큰을 DS 변수(`--brand` 등)로 통일하는 작업 (별도 이슈)
- DS에 대응 컴포넌트가 없는 `AppIcon`, `ToggleButtonGroup`, `AppFallback`, `CodeEditor`, `MonthCalendar`, `PageHeader` 교체
- 사용처의 `App*` import를 DS 직접 import로 바꾸는 작업
- `@choi/ds` 자체 수정 (부족한 기능은 DS 레포 이슈로 분리)

## 🛠️ 접근 방식

- **어댑터 유지**: `App*` 컴포넌트의 이름·파일 위치·props를 유지하고 내부 구현만 DS 컴포넌트로 바꾼다. 사용처 수정을 최소화하고 FSD의 `shared/ui` 경계를 유지한다.
- DS에 그대로 대응하지 않는 props는 어댑터 안에서 매핑한다. 매핑이 불가능하면 사용처를 DS에 맞게 고치고, 그 결정을 progress.md에 남긴다.
- 다크 모드는 프로젝트와 DS 모두 `[data-theme="dark"]`를 쓰므로 추가 연동은 필요 없다.
- 컴포넌트 단위로 하나씩 교체·검증한다 (Toast/ConfirmDialog/Switch/Chip → Pagination/Select → Button 순으로, 사용처가 적은 것부터).

### 매핑 초안 (구현 중 확정)

| App* | DS | 주요 매핑 |
| --- | --- | --- |
| AppButton | Button | solid+primary/blue→`primary`, solid+red→`danger`, outline→`secondary`, ghost→`ghost`, `xs`→`sm`(+className) |
| AppChip | Badge | primary→`brand`, secondary→`neutral`, success→`success`, error→`danger`, warning·purple→확인 필요 |
| AppSelect | Select / MultiSelect | `multiple`이면 MultiSelect, number value는 string 변환 후 복원 |
| AppSwitch | Switch | `onChange(checked)` → input change 이벤트 변환 |
| AppPagination | Pagination | `currentPage`→`page`, `totalPages`→`pageCount`, 페이지 크기 선택은 DS `Select`로 별도 구성 |
| AppToast | ToastProvider / useToast | `showToast(msg, type)` → `toast({ title: msg, tone })` |
| AppConfirmDialog | ConfirmModal | `onCancel`→`onClose`, `danger`→`tone="danger"`, `confirmText`→`confirmLabel` |

## 🔗 참고 자료

| 유형       | 링크                                                  |
| ---------- | ----------------------------------------------------- |
| Figma      | -                                                     |
| Storybook  | DS 레포 `npm run storybook`                           |
| API 명세   | `@choi/ds` 타입 정의 (`dist/index.d.ts`, JSDoc)       |
| Confluence | -                                                     |
| 기타       | https://github.com/qlalfdmlghk1/cws-ds (tag `v0.2.0`) |

## ✅ 검증 계획

- 단위/통합 테스트: `npm run test` 전체 통과, 영향받는 spec 수정
- 타입/빌드: `npx tsc -b`, `npm run build`, `npm run build-storybook`
- 회귀 포인트: 버튼 32개 사용처의 색·크기, Select 다중 선택·숫자 value, 토스트 표시, 확인 다이얼로그 취소/확인 흐름, 페이지네이션 페이지 크기 변경
- 수동 확인: 라이트/다크 모드에서 주요 화면(오답노트, 지원 현황, 기업 조사, 데일리 학습) 확인, 페이지 배경색 유지 여부

## 🤔 주요 결정 사항

- [2026-11-22] 교체 방식은 어댑터 유지로 결정 (사용처 직접 교체 X)
- [2026-11-22] AppChip은 상태 표시 용도이므로 DS `Chip`이 아니라 `Badge`로 대응
- [2026-11-22] 토큰 통일(Tailwind → DS 변수)은 이번 범위에서 제외
