# ds-migration-2 — 진행 상황

## 📌 현재 작업

- 이슈: #104 (Refactor)
- 브랜치: refactor/104-ds-migration-2
- 단계: 3단계 완료 → PR·리뷰
- 마지막 업데이트: 2026-11-22

---

## [Issue #104] ds-migration-2

**Type**: Refactor | **Jira**: 미사용 | **시작**: 2026-11-22

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행)

### 🚧 진행 중

- [x] 기존 어댑터 DS import 원래 이름으로 (별칭 제거)
- [x] `AppTextarea`·`AppCheckbox`·`AppRadioGroup` 어댑터 + 교체 (1단계)
- [x] 토글(ToggleButtonGroup → AppChip)·탭 (2단계)
- [x] 모달 5개 (3단계, 화면 확인 완료)
- [ ] PR·리뷰

### 📝 결정 로그

- [2026-11-22] /start 실행, 작업 환경 셋업 완료. 기획 검수는 건너뜀(기획서 없는 리팩터링)
- [2026-11-22] 모달은 포함하되 마지막 단계·화면 확인 후 커밋, 파일 첨부는 제외 (사용자 결정)
- [2026-11-22] DS import는 `Ds*` 별칭 없이 원래 이름(`AppButton` 등) 그대로 (사용자 결정 — #100의 `Ds*` 별칭 결정을 대체). 앱 어댑터와 이름이 겹치는 곳(Button·Select·Switch·TextInput·Pagination·Toast)은 어댑터 함수를 `*Adapter`로 두고 `displayName`을 원래 이름으로, default export라 사용처 import는 그대로. 겹치지 않는 곳(AppBadge·AppDatepicker·AppConfirmModal·AppToastProvider·AppBrandStyle)은 별칭만 제거. 새 어댑터도 같은 규칙
- [2026-11-22] AppTextarea: DS가 ref를 받지 않아 공고 붙여넣기 본문 포커스는 id(`posting-paste-text`)로. 기존 resize-none 사용처는 `resize="none"`, 나머지는 DS 기본(세로 조절). 사용처별 스타일 상수(inputClass·INPUT_CLASS)는 쓰이지 않아 제거
- [2026-11-22] AppCheckbox: 상자+문구를 label 하나로, 보조 문구는 description. 시트 가져오기 전체 선택에 일부 선택(–, indeterminate) 표시 추가
- [2026-11-22] AppRadioGroup: DS가 그룹 aria-label을 받지 않아 바깥 라벨만 있을 때 role="group" 래퍼로 이름(템플릿 등록 "템플릿 형태"). 바깥 라벨은 label → p (연결 대상이 input이 아니므로)

- [2026-11-22] ToggleButtonGroup: 이름·props 유지, 안쪽만 DS `AppChip`(selected/onClick). 켜진 칩에 체크 표시(DS 기본), aria-pressed. 묶음은 role="group" + 바깥 라벨 연결(오답노트 "제출 결과"·"작성 이유"는 label → p + id)
- [2026-11-22] AppTabs: DS 목록만 그리고 패널은 화면이 그림. 탭 줄 오른쪽 버튼(+ 작성 / + 새 주제)은 `actions` 자리 — 밑줄 선이 버튼까지 이어지도록 래퍼가 선을 그리고 DS 목록 선은 index.css `.app-tabs`로 끔. 작성·새 주제 화면처럼 탭에 없는 값이면 선택된 탭 없음. 친구 요청 수는 알림 의미라 DS 숫자 배지 대신 빨간 배지 유지. 탭 모양이 DS(높이 44, 지금 탭 글자 진하게·밑줄 브랜드색)로 바뀜

- [2026-11-22] AppModal: 바깥 클릭으로 닫기 유지(기존 동작) + Esc 닫기·포커스 가두기·닫으면 포커스 복귀(DS). 머리말 보조 줄(회사명 등)은 제목 아래 description, 머리말 버튼(캡처·본문으로 채우기 등)은 본문 첫 줄 toolbar — DS 머리말에 자리가 없음. 본문은 `formId`로 form, footer 저장 버튼은 `form={formId}`. 너비 sm 400·md 560·lg 800, 시트 가져오기만 xl 1000(index.css `.app-modal--xl`). 공고 붙여넣기는 지원 등록 모달의 형제로 유지(안에 두면 form submit이 React 트리로 번짐). 공고 붙여넣기 안의 "캡처/본문" 탭은 이미 접근성을 갖춘 자체 구현이라 유지(후속 후보)
- [2026-11-22] 브라우저 확인: 탭 목록(overflow-x:auto)이 탭의 margin-bottom:-1px만큼 밑줄을 잘라내고 세로 1px 스크롤 → `.app-tabs .cds-tabs__list`에 padding-bottom:1px
- [2026-11-22] 다크 테마 확인: DS 바탕(#131217)·테두리가 앱 남색(#1E293B·#334155)과 달라 모달·입력창이 떠 보임(#98부터 입력창에 있던 차이, 모달로 면적이 커져 드러남) → DS `--surface`·`--line`·`--ink`를 앱 변수에, `--surface-raised`·`--surface-hover`는 `color-mix`(앱 바탕 94%·88% + 글자색)로 연결 (사용자 결정: 이번 PR에 포함). 라이트는 값이 거의 같아 변화 없음 확인

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

### ⏭️ 남은 작업

- [ ] 후속 후보: 공고 붙여넣기 "캡처/본문" 탭 → AppTabs, 파일 첨부 → AppFileUpload, 남은 DS 토큰(--ink-disabled·--focus 등) 통일

### Commit — 2026-11-22 23:11

- Message: `Refactor:#104 DS 컴포넌트를 별칭 없이 원래 이름으로 사용`
- Issue: `#104`
- Jira: `미사용`

**변경 요약**

- 어댑터 11곳(Button·Chip·DatePicker·Select·Switch·TextInput·ConfirmDialog·Pagination·Toast·ToastProvider·main.tsx)의 DS import에서 `Ds*` 별칭 제거
- 이름이 겹치는 어댑터는 함수를 `*Adapter`로, `displayName`은 원래 이름, default export라 사용처 import 변경 없음
- ds-migration-2 plan.md·progress.md 신규

**결정 로그**

- DS 이름 그대로 사용 (사용자 결정, #100의 `Ds*` 별칭 결정 대체)

**다음 작업**

- 1단계 textarea·체크박스·라디오

### Commit — 2026-11-22 23:11

- Message: `Refactor:#104 여러 줄 입력·체크박스·라디오를 DS 기반으로 교체`
- Issue: `#104`
- Jira: `미사용`

**변경 요약**

- `AppTextarea`·`AppCheckbox`·`AppRadioGroup` 어댑터 신설 (테스트 14건·스토리)
- textarea 13곳(지원 등록·전형 편집·공고 붙여넣기·기업 조사 6칸·데일리·템플릿 등록·오답노트 2곳), 체크박스 6곳(AI 추출 미리보기·기업 조사 삭제·시트 가져오기 3곳·오답노트 공유 2곳), 라디오 1곳(템플릿 형태) 교체
- 전체 테스트 690건 통과, 빌드 성공

**결정 로그**

- 시트 가져오기 전체 선택 상자에 일부 선택(–) 표시 추가 — DS indeterminate 활용

**다음 작업**

- 2단계 토글(ToggleButtonGroup → DS AppChip)·탭

### Commit — 2026-11-22 23:26

- Message: `Refactor:#104 토글 묶음과 탭을 DS 기반으로 교체`
- Issue: `#104`
- Jira: `미사용`

**변경 요약**

- ToggleButtonGroup → DS `AppChip` 기반 (테스트 4건 신규, 스토리 설명·argTypes)
- `AppTabs` 어댑터 신설 (테스트 5건·스토리) + 오답노트·데일리·친구 탭 교체, index.css `.app-tabs`
- 전체 테스트 699건 통과, 빌드 성공

**결정 로그**

- 친구 요청 수 빨간 배지 유지 (알림 의미)

**다음 작업**

- 3단계 모달 5개 → 화면 확인 후 커밋

### Commit — 2026-11-23 00:15

- Message: `Refactor:#104 모달을 DS 기반으로 교체하고 다크 바탕색 맞춤`
- Issue: `#104`
- Jira: `미사용`

**변경 요약**

- `AppModal` 어댑터 신설 (테스트 6건·스토리) + AI 키·지원 등록·공고 붙여넣기·전형 편집·시트 가져오기 모달 교체
- index.css: `.app-modal--xl`, 탭 밑줄 잘림 수정, DS 바탕·테두리·글자 토큰을 앱 색 변수에 연결
- 브라우저 확인(라이트·다크): 모달 포커스·Esc·포커스 복귀, portal 달력·목록 층위, 탭·토글·입력 요소. 전체 테스트 705건 통과, 빌드 성공

**결정 로그**

- 다크 바탕색 통일은 이번 PR에 포함 (사용자 결정)

**다음 작업**

- PR(dev) + /review-converge

### Commit — 2026-11-23 00:33

- Message: `Fix:#104 탭 키보드 접근·시트 가져오기 포커스·표 머리줄 고정 회귀 수정`
- Issue: `#104`
- Jira: `미사용`

**변경 요약**

- (/review-converge Round 1 자동 반영) AppTabs: value가 items에 없으면 첫 활성 탭이 Tab을 받게 보정(DS가 모두 tabIndex=-1) — 데일리 "+ 새 주제" 화면 키보드 회귀
- 시트 가져오기: 열릴 때 DS가 숨긴 file input에 포커스를 주려다 실패해 포커스가 밖에 남던 문제 → 파일 선택 버튼 `data-autofocus`. 표는 `max-h-96` 안에서 스크롤해 머리줄 sticky 복구
- 여러 줄 입력 4곳 접근성 이름(오답노트 코멘트 2곳·템플릿 설명 label 연결, 데일리 서술형 aria-label)
- AppModal: form 기본 제출 항상 차단, toolbar 0/"" 렌더 방지
- DS AppChip·useToast 이름 겹침 주석, index.css DS 버전업 점검 목록에 새 토큰·클래스 추가
- 테스트: StageEditDialog 사용처 4건(저장 form 연결·메모 공백·취소/Esc), AppTabs 키보드 2건, AppTextarea 값 단언. ToggleButtonGroup 스토리 예시 코드 (711건 통과)

**결정 로그**

- 리뷰 Round 1: Blocker 0. 저장 중 닫힘은 사용자 결정으로 "닫히지 않게"(Round 2에서 반영). prop 표기·Atomic 분류·탭 value 타입·스토리 Controls·모달 4곳 사용처 테스트 확장은 남김

**다음 작업**

- AppModal busy (저장·분석 중 닫기 막기) → Round 2
