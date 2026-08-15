# recruitment-bugfix — 진행 상황

## 📌 현재 작업

- 이슈: #95 (Fix)
- 브랜치: fix/95-recruitment-bugfix
- 단계: Phase 1 시작
- 마지막 업데이트: 2026-08-15

---

## [Issue #95] 채용 (지원 현황 / 기업 조사) 페이지의 버그를 픽스한다

**Type**: Fix | **Jira**: 미사용 | **시작**: 2026-08-15

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행)
- [x] 지원 현황 페이지 제목 '채용' → '지원 현황' (설명 문구도 이 화면에 맞게 정리)
- [x] 기업명 검색 — `RecruitmentFilter.keyword` 추가, 툴바에 검색 입력 (300ms 디바운스)
- [x] 상세 패널에서 모집 요강(PostingSection) 제거
- [x] 상세 패널 "기업 조사" 버튼에 `chevron-right` 아이콘 추가
- [x] 공고명 미입력 시 반기 라벨 자동 입력 (`getDraftHalfId` + `formatHalfId`)
- [x] 기업 조사 토글 "조사 완료만" → "조사 된 기업"
- [x] 기업 조사 필터 — 분류 / 지망 등급을 각각 옅은 판 위에 올려 구분

### 🚧 진행 중

- [ ] 사용자 확인 (수동 QA)

### 📝 결정 로그

- [2026-08-15] /start 실행, 작업 환경 셋업 완료
- [2026-08-15] 기획 검수(/plan-review)는 버그 항목이 모두 구체적이라 생략
- [2026-08-15] 기업명 검색은 `rows` 단계에서만 거른다 — 합격률 모수(`scopedApplications`)에 넣으면
  "이 검색어의 합격률"이라는 무의미한 수치가 된다 (상태 필터와 같은 판단)
- [2026-08-15] 상세 패널에서 모집 요강을 빼도 공고 추출 기능은 남는다 —
  등록·수정 모달(`ApplicationFormDialog`)에 같은 입력·추출 UI가 있다
- [2026-08-15] 검색어 디바운스는 board 훅 안에서 처리한다 (`useDebounce(filter.keyword)`).
  입력값 자체는 즉시 반영해야 한글 조합이 끊기지 않으므로, 거르는 쪽만 300ms 늦춘다
- [2026-08-15] 공고명 기본값의 반기는 `getApplicationHalfId`와 같은 기준(일정 → 기존 귀속 → 오늘)을
  따르는 `getDraftHalfId`로 계산한다. 목록에서 잡히는 반기와 제목이 어긋나면 안 되기 때문

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

### ⏭️ 남은 작업

- [ ] PR 리뷰 반영

### Commit — 2026-08-15 17:10

- Message: `Fix:#95 지원 현황·기업 조사 화면의 표시·입력 오류 수정`
- Issue: `#95`
- Jira: 미사용

**변경 요약**

- 지원 현황: 페이지 제목 `채용` → `지원 현황`(내비게이션 문구와 일치), 기업명 검색 추가
  (`RecruitmentFilter.keyword` + 300ms 디바운스), 상세 패널에서 모집 요강 제거,
  "기업 조사" 버튼에 `chevron-right` 아이콘
- 공고명 미입력 시 `getDraftHalfId`(신규) + `formatHalfId`로 반기 이름 자동 입력
- 기업 조사: 토글 `조사 완료만` → `조사 된 기업`, 분류 / 지망 등급 필터를 각각 옅은 판 위로 분리
- 테스트: `useRecruitmentBoard.spec.ts` 신규(검색·디바운스 9건), `half.spec.ts`·
  `useApplicationForm.spec.ts`에 반기 기본값 케이스 추가 — 전체 607건 통과

**결정 로그**

- 검색은 `rows` 단계에서만 거른다 — 합격률 모수(`scopedApplications`)에 넣으면
  "이 검색어의 합격률"이라는 무의미한 수치가 된다
- 디바운스는 board 훅에서 처리하고 입력값은 즉시 반영 — 입력창까지 늦추면 한글 조합이 끊긴다
- 상세 패널에서 모집 요강을 빼도 공고 추출 경로는 등록·수정 모달에 그대로 남는다
- 상세 패널의 위치·미지원 사유·메모는 유지 (사용자 확인 완료)

**다음 작업**

- `/pr`로 dev 대상 PR 생성

### Commit — 2026-08-15 18:05

- Message: `Fix:#95 리뷰 지적 반영 — 검색 초기화 즉시 반영·버튼/입력 정렬 정리`
- Issue: `#95`
- Jira: 미사용

**변경 요약**

- 검색어를 비우면(필터 초기화 / 직접 삭제) 디바운스를 기다리지 않고 목록을 즉시 되돌린다
  (`activeKeyword`) — 초기화를 눌러도 300ms간 옛 결과가 남아 클릭이 안 먹은 것처럼 보이던 문제
- 디바운스 시간을 `KEYWORD_DEBOUNCE_MS` 상수로 뽑아 스펙이 전제하는 값과 묶음
- "기업 조사" 버튼을 `AppButton`의 `iconRight` prop으로 교체 — 직접 span으로 감싸 아이콘 간격이
  다른 버튼(gap-2)과 어긋나 있었음
- 검색 입력 높이·좌우 여백을 옆에 서는 `AppSelect(size="sm")`(h-9 px-3)와 맞춤
- 테스트 3건 추가/수정: 초기화 즉시 복구, 직접 삭제 즉시 복구, 연속 입력 시 대기 시간 재시작

**결정 로그**

- "좁히는 동작만 늦추고 되돌리는 동작은 즉시" — 디바운스의 목적은 타이핑 중 중간 결과를
  줄이는 것이지, 사용자가 명시적으로 되돌리는 액션까지 늦추는 게 아니다

**다음 작업**

- 리뷰에서 남긴 항목(PostingSection 죽은 코드, postingSources 노출 등) 사용자 판단

### Review — 2026-08-15 18:20

- `/review-converge origin/dev...HEAD` 1라운드 — ⛔ 중단(정책·제품 판단 필요). **Blocker 0건**
- 자동 반영 3건(커밋 `0531c8b`), 남긴 항목 8건
- PR 코멘트: https://github.com/qlalfdmlghk1/Template-Tester/pull/96#issuecomment-5301522541
- GitHub 이슈 #95 작업 항목 7건 체크 완료 (종료는 머지 시 자동)

**사용자 결정 (2026-08-15)**

1. `PostingSection`·`PostingSchedulePreview` → **삭제**
2. `postingSources`(AI 출처 링크) → **필드까지 제거** (저장도 안 함)
3. 검색의 반기 스코프 → **현재 동작 유지**
4. "조사 된 기업" → **"조사된 기업"으로 맞춤법 교정** + 옆 카운터도 같은 용어로 통일

**사람 판단이 필요했던 항목 (원문)**

1. `PostingSection`·`PostingSchedulePreview` 도달 불가 — 삭제할지 남길지
2. `postingSources`(AI 출처 링크) 렌더 지점 소실 — 수정 모달에 복구할지, 접을지
3. 검색이 선택된 반기 안으로만 한정됨 — 전역 검색이 스펙인지
4. "조사 된 기업" 표기 — 맞춤법상 "조사된"이며 옆 카운터는 "조사 완료"로 용어 불일치
5. `getDraftHalfId` 호출부 중복 폴백 / 공고명 기본값 이중 구현(폼 vs 시트 임포트)
6. 테스트 보강 — 신규 등록 경로(시계 고정), `RecruitmentToolbar` 컴포넌트 스펙
7. 검색 입력 마크업 3벌 → `shared/ui/molecules/SearchInput` 승격 검토

### Commit — 2026-08-15 18:30

- Message: `Refactor:#95 미연결 공고 추출 UI와 출처 필드 제거`
- Issue: `#95`
- Jira: 미사용

**변경 요약**

- `PostingSection`(227줄)·`PostingSchedulePreview`(107줄) 삭제 — 상세 패널에서 내린 뒤 참조 0건
- `mergePostingDraft`·`PostingDraft` 삭제 — 프로덕션 호출자가 `PostingSection` 뿐이라 함께 죽음
  (spec 6건도 제거)
- `postingSources` 필드 제거 — 타입 / Firestore 읽기(`application.api.ts`) / 폼 상태·저장 값
  (`useApplicationForm`) / 저장 페이로드(`useRecruitmentPage`)
- 기업 조사 토글 "조사 된 기업" → "조사된 기업", 옆 카운터도 "조사된 기업 N건"으로 통일
- 테스트: 출처 관련 단언 제거, "출처를 지원 건에 싣지 않는다" 회귀 테스트 추가 → 604건 통과

**결정 로그**

- 출처는 **필드까지 제거**(선택지 C). 볼 화면이 없는 값을 저장만 하면 다음 사람이 쓰임새를
  되짚느라 시간을 쓴다. 근거는 `application.type.ts`의 `postingSources` 자리에 주석으로 남김
- 기업 조사(`Company.researchSources`)는 자체 화면이 있어 **그대로 둔다** — 지원 건 쪽만 제거
- 이미 저장된 문서의 `postingSources` 값은 읽지 않으므로 무해하게 남는다 (마이그레이션 없음)

**다음 작업**

- 확인 필요: `useJobPostingExtract`의 반환값 중 `result`·`selectedFields`·`toggleField`·
  `scheduleDrafts`·`selectedStages`·`toggleStage`·`dismissFields`·`dismissSchedules`가
  `PostingSection` 삭제로 사용처를 잃음. 훅 정리는 spec 11건에 영향이 있어 별도 판단
