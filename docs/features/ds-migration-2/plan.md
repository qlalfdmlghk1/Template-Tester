# ds-migration-2

| 항목         | 값                          |
| ------------ | --------------------------- |
| Jira         | 미사용                      |
| GitHub Issue | [#104](https://github.com/qlalfdmlghk1/Template-Tester/issues/104) |
| Branch       | `refactor/104-ds-migration-2` |
| 작성자       | qlalfdmlghk1                |
| 작성일       | 2026-11-22                  |
| Type         | Refactor                    |

## 🎯 작업 목적

#98·#100에서 공통 컴포넌트 9종을 `@choi/ds`로 바꾼 데 이어, 화면에 직접 만들어 둔 입력 요소·탭·토글·모달까지 DS로 옮겨 모양과 접근성(키보드·화면 낭독기)을 한 기준으로 맞추기 위해

## 📋 작업 범위

**포함 (In Scope)**

0단계: 이름 규칙
- [x] 기존 어댑터 11곳의 DS import에서 `Ds*` 별칭 제거, 원래 이름(App*)으로 (사용자 요청)

1단계: 입력 요소
- [ ] `AppTextarea` 어댑터 신설(DS `AppTextarea`) + 여러 줄 입력 8개 파일 교체 (지원 등록·전형 편집 메모, 공고 붙여넣기, 기업 조사, 데일리, 템플릿 등록, 오답노트 작성·수정)
- [ ] `AppCheckbox` 어댑터 신설(DS `AppCheckbox`) + 체크박스 교체 (오답노트 공유, AI 추출 미리보기, 기업 조사 편집, 시트 가져오기 등)
- [ ] 라디오 → DS `AppRadioGroup` 어댑터(`AppRadioGroup`) + 교체

2단계: 토글·탭
- [ ] `ToggleButtonGroup` → DS `AppChip`(선택형 칩) 기반으로 교체 — 단일(다시 누르면 해제)·다중 선택 동작 유지 (오답노트 결과·작성 이유)
- [ ] 탭 버튼 → `AppTabs` 어댑터 신설(DS `AppTabs`) + 오답노트·데일리·친구 페이지 교체

3단계: 모달 (화면 확인 후 커밋)
- [ ] `AppModal` 어댑터 신설(DS `AppModal`) + 직접 만든 모달 5개 교체 (AI 키, 지원 등록, 공고 붙여넣기, 전형 편집, 시트 가져오기)
- [ ] 폼 모달은 입력 중 바깥 클릭으로 닫히지 않게(`closeOnOverlay` 등) 기존 닫기 정책을 유지하거나 명시적으로 결정

공통
- [ ] 새 어댑터마다 스토리·테스트, 사용처 테스트 갱신

**제외 (Out of Scope)**

- 파일 첨부(`type="file"` — 공고 붙여넣기 캡처, 시트 가져오기 XLSX) → DS `AppFileUpload`: UX가 크게 바뀌어 별도 이슈 (사용자 결정)
- DS에 대응이 없는 것: AppIcon, PageHeader, MonthCalendar, CodeEditor(Monaco), AppFallback, 시각 입력(`type="time"`)
- 일반 `<button>`(아이콘 버튼·링크형 버튼 등) 일괄 교체 — 탭·토글 외에는 별도 판단
- PR #102 리뷰 후속(접근성 prop 표기 통일, clearLabel, portal·multiple 테스트, DS 쪽 제안)

## 🛠️ 접근 방식

- #98과 같은 **어댑터 방식**: `shared/ui`에 App* 어댑터를 두고 사용처는 어댑터만 import. DS는 **원래 이름 그대로** import(`import { AppTextarea } from "@choi/ds"`) — 어댑터와 이름이 겹치면 어댑터 함수를 `AppTextareaAdapter`로 두고 `displayName = "AppTextarea"` (사용자 결정, 기존 어댑터도 맞춤)
- 높이·크기 기준은 기존 입력과 같게(sm 32 · md 40 · lg 48). textarea는 기존 rows·resize 동작 유지
- 접근성 이름은 #100 결정과 같게: 바깥 라벨은 id 연결, 라벨 없는 곳은 aria-label
- 단계마다 테스트·타입 체크·빌드 확인 후 커밋. 모달은 화면 확인을 받은 뒤 커밋
- 동작이 바뀌는 지점(모달 Esc·포커스, 탭 키보드 이동, 토글 해제 동작)은 progress.md 결정 로그에 남김

## 🔗 참고 자료

| 유형       | 링크                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------ |
| Figma      | -                                                                                          |
| Storybook  | 로컬 `npm run storybook`                                                                   |
| API 명세   | `node_modules/@choi/ds/dist/index.d.ts` (v0.4.0)                                           |
| Confluence | 미사용                                                                                     |
| 기타       | 이전 작업 `docs/features/ds-migration/`·`docs/features/ds-v040/` (#98, #100)               |

## ✅ 검증 계획

- 단위/통합 테스트: 새 어댑터(Textarea·Checkbox·RadioGroup·Tabs·Modal, ToggleButtonGroup) 매핑 테스트, 기존 사용처 테스트 통과. `npx vitest run` 전체, `tsc`, 변경 파일 ESLint, `npm run build`
- 회귀 포인트: 폼 값 바인딩(textarea·체크박스 onChange 시그니처), 오답노트 결과 토글 해제 동작, 탭 전환 시 상태 유지, 모달 열고 닫기·저장 흐름, 모달 위 토스트·portal 목록 층위
- 수동 확인: 오답노트 작성·수정(텍스트·토글·공유 체크), 데일리·친구 탭, 지원 등록·전형 편집·AI 키·공고 붙여넣기·시트 가져오기 모달(저장 없이), 다크 테마

## 🤔 주요 결정 사항

- [2026-11-22] 모달 교체는 포함하되 마지막 단계, 화면 확인 후 커밋 (사용자 결정)
- [2026-11-22] 파일 첨부(`AppFileUpload`)는 이번 범위에서 제외 (사용자 결정)
- [2026-11-22] ToggleButtonGroup은 DS `AppChip`(선택형 칩)으로 — 알약 모양 토글과 의미·모양이 같음
