# ds-migration-2 — 진행 상황

## 📌 현재 작업

- 이슈: #104 (Refactor)
- 브랜치: refactor/104-ds-migration-2
- 단계: Phase 1 시작 — 입력 요소(textarea·체크박스·라디오)
- 마지막 업데이트: 2026-11-22

---

## [Issue #104] ds-migration-2

**Type**: Refactor | **Jira**: 미사용 | **시작**: 2026-11-22

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행)

### 🚧 진행 중

- [x] 기존 어댑터 DS import 원래 이름으로 (별칭 제거)
- [ ] `AppTextarea` 어댑터 + 여러 줄 입력 교체

### 📝 결정 로그

- [2026-11-22] /start 실행, 작업 환경 셋업 완료. 기획 검수는 건너뜀(기획서 없는 리팩터링)
- [2026-11-22] 모달은 포함하되 마지막 단계·화면 확인 후 커밋, 파일 첨부는 제외 (사용자 결정)
- [2026-11-22] DS import는 `Ds*` 별칭 없이 원래 이름(`AppButton` 등) 그대로 (사용자 결정 — #100의 `Ds*` 별칭 결정을 대체). 앱 어댑터와 이름이 겹치는 곳(Button·Select·Switch·TextInput·Pagination·Toast)은 어댑터 함수를 `*Adapter`로 두고 `displayName`을 원래 이름으로, default export라 사용처 import는 그대로. 겹치지 않는 곳(AppBadge·AppDatepicker·AppConfirmModal·AppToastProvider·AppBrandStyle)은 별칭만 제거. 새 어댑터도 같은 규칙

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

### ⏭️ 남은 작업

- [ ] 체크박스·라디오
- [ ] 토글(ToggleButtonGroup → AppChip)·탭
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
