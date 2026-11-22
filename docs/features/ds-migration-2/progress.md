# ds-migration-2 — 진행 상황

## 📌 현재 작업

- 이슈: #104 (Refactor)
- 브랜치: refactor/104-ds-migration-2
- 단계: 2단계 완료 → 3단계 모달
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
- [ ] 모달 5개 (3단계, 화면 확인 후 커밋)

### 📝 결정 로그

- [2026-11-22] /start 실행, 작업 환경 셋업 완료. 기획 검수는 건너뜀(기획서 없는 리팩터링)
- [2026-11-22] 모달은 포함하되 마지막 단계·화면 확인 후 커밋, 파일 첨부는 제외 (사용자 결정)
- [2026-11-22] DS import는 `Ds*` 별칭 없이 원래 이름(`AppButton` 등) 그대로 (사용자 결정 — #100의 `Ds*` 별칭 결정을 대체). 앱 어댑터와 이름이 겹치는 곳(Button·Select·Switch·TextInput·Pagination·Toast)은 어댑터 함수를 `*Adapter`로 두고 `displayName`을 원래 이름으로, default export라 사용처 import는 그대로. 겹치지 않는 곳(AppBadge·AppDatepicker·AppConfirmModal·AppToastProvider·AppBrandStyle)은 별칭만 제거. 새 어댑터도 같은 규칙
- [2026-11-22] AppTextarea: DS가 ref를 받지 않아 공고 붙여넣기 본문 포커스는 id(`posting-paste-text`)로. 기존 resize-none 사용처는 `resize="none"`, 나머지는 DS 기본(세로 조절). 사용처별 스타일 상수(inputClass·INPUT_CLASS)는 쓰이지 않아 제거
- [2026-11-22] AppCheckbox: 상자+문구를 label 하나로, 보조 문구는 description. 시트 가져오기 전체 선택에 일부 선택(–, indeterminate) 표시 추가
- [2026-11-22] AppRadioGroup: DS가 그룹 aria-label을 받지 않아 바깥 라벨만 있을 때 role="group" 래퍼로 이름(템플릿 등록 "템플릿 형태"). 바깥 라벨은 label → p (연결 대상이 input이 아니므로)

- [2026-11-22] ToggleButtonGroup: 이름·props 유지, 안쪽만 DS `AppChip`(selected/onClick). 켜진 칩에 체크 표시(DS 기본), aria-pressed. 묶음은 role="group" + 바깥 라벨 연결(오답노트 "제출 결과"·"작성 이유"는 label → p + id)
- [2026-11-22] AppTabs: DS 목록만 그리고 패널은 화면이 그림. 탭 줄 오른쪽 버튼(+ 작성 / + 새 주제)은 `actions` 자리 — 밑줄 선이 버튼까지 이어지도록 래퍼가 선을 그리고 DS 목록 선은 index.css `.app-tabs`로 끔. 작성·새 주제 화면처럼 탭에 없는 값이면 선택된 탭 없음. 친구 요청 수는 알림 의미라 DS 숫자 배지 대신 빨간 배지 유지. 탭 모양이 DS(높이 44, 지금 탭 글자 진하게·밑줄 브랜드색)로 바뀜

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

### ⏭️ 남은 작업

- [ ] 모달 5개

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
