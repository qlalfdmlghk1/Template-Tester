# ui-ux-polish — 진행 상황

## 📌 현재 작업

- 이슈: #78 (Refactor)
- 브랜치: refactor/78-ui-ux-polish
- 단계: Phase 1 시작
- 마지막 업데이트: 2026-08-03

---

## [Issue #78] 서비스 내 크고 작은 UI/UX 수정

**Type**: Refactor | **Jira**: 미사용 | **시작**: 2026-08-03

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행)
- [x] "채용" 탭 하위 메뉴 줄넘어감 현상 개선
- [x] 지원현황 반기 필터 `미분류` → `전체`
- [x] 단계별 합격률에 직무·기업분류 필터 반영
- [x] 모바일 페이지 헤더 레이아웃 수정

### 🚧 진행 중

- (없음)

### 📝 결정 로그

- [2026-08-03] /start 실행, 작업 환경 셋업 완료 (기획 검수는 사용자 요청으로 생략)
- [2026-08-03] 채용 탭 하위 메뉴 줄바꿈 원인은 펼침 패널 컬럼 너비를 트리거 버튼 너비로 **고정**(`width`)한 것. `채용`이 2글자라 컬럼이 `지원 현황`보다 좁아졌다. `minWidth`로 바꿔 트리거 너비를 하한으로만 쓰고, 항목 버튼에 `whitespace-nowrap`을 더했다.
- [2026-08-03] 반기 필터는 라벨 변경이 아니라 **동작 변경**으로 결정 (사용자 선택: B안). `ALL_HALF_ID`를 추가하고 `미분류` 선택지를 제거. 기본 선택 순서(현재 반기 → 최신 반기)는 유지하려고 `전체`는 폴백 최후순위로 뒀다.
- [2026-08-03] 합격률이 필터를 따라가지 않던 문제 — 원인은 `passRates`를 반기만 적용된 `halfApplications`로 계산하고, 직무·상태·기업분류 필터는 `rows`에서만 걸었기 때문. **직무·기업분류만 반영하고 상태 필터는 제외**하기로 결정(사용자 선택). 상태로 거른 뒤 합격률을 내면 "탈락만 보기 → 0%"처럼 필터가 곧 답이 되어 수치가 무의미해진다. `scopedApplications`(반기 + 직무 + 기업분류)를 합격률 모수로 두고, 상태 필터는 `rows`에서만 적용한다.
- [2026-08-03] **서비스명 수정은 보류**하고 코드 변경을 되돌렸다. `All About Developers`(축약 `AAD`)까지 정했다가 사용자가 재검토하기로 함. 재개 시 주의점은 plan.md의 주요 결정 사항 참고.

### 🐛 트러블슈팅

**[2026-08-03] 모바일에서 페이지 헤더 설명 문구가 세로 기둥으로 찌그러짐**

- 증상: 360px 폭에서 `/companies` 설명 문구가 5~6글자마다 줄바꿈되고 오른쪽 공간은 비어 있음. 제목("채용")은 아예 안 보임.
- 원인 1: 페이지가 `PageHeader`를 형제 요소와 나란히 두고(`flex ... justify-between`) 버튼 묶음에 `shrink-0`을 걸어, 버튼이 폭을 전부 가져가고 `PageHeader`만 눌렸다.
- 원인 2: 제목이 안 보인 건 `PageHeader`의 `<h2>`가 `hidden sm:block`이라 모바일에서 숨겨지기 때문. 의도된 동작이라 그대로 뒀다.
- 조치: 쓰이지 않던 `PageHeader`의 `actions` prop을 사용하도록 바꾸고, 제목 행에 `flex-wrap`을 더해 좁은 폭에서 액션이 다음 줄로 넘어가게 했다. 넓은 폭 정렬은 액션 래퍼의 `ml-auto`로 종전과 동일하게 유지.
- 같은 패턴이던 `companies/research.tsx`, `study/[id].tsx`도 함께 정리.

### ⏭️ 남은 작업

- [ ] 서비스명 확정 후 수정 (별도 이슈 또는 후속 커밋) — 노출 지점·건드리면 안 되는 식별자는 plan.md 참고

---

### Commit — 2026-08-03

세 가지 변경이 서로 독립적이라 커밋을 셋으로 나눴다. `useRecruitmentBoard.ts`는 반기 필터와
합격률 변경이 한 파일에 섞여 있어, 파일을 중간 상태로 되돌려 2번을 커밋한 뒤 다시 올려 3번을 커밋했다.

- Message: `Refactor:#78 채용 탭 하위 메뉴가 줄바꿈되던 문제 수정`
- Message: `Refactor:#78 지원 현황 반기 선택지의 미분류를 전체로 교체`
- Message: `Refactor:#78 단계별 합격률에 직무·기업분류 필터 반영`
- Issue: `#78`
- Jira: 미사용

**변경 요약**

- `NavMenu` 펼침 패널 컬럼 너비 `width` → `minWidth`, 항목에 `whitespace-nowrap`
- `half.ts`에 `ALL_HALF_ID` 추가, `collectHalfIds`가 `전체`를 맨 앞에 두고 `미분류`는 제외
- `useRecruitmentBoard`에 `scopedApplications`(반기 + 직무 + 기업분류)를 두고 합격률 모수로 사용

**결정 로그**

- 위 결정 로그 참고 (반기 필터 B안, 합격률은 상태 필터 제외)
- 커밋 footer는 `Refs #78` — 서비스명 항목이 남아 있어 이슈를 닫지 않는다

**다음 작업**

- 모바일 레이아웃 점검 (사용자 스크린샷 기준)
- 서비스명 확정 후 반영

---

### Commit — 2026-08-03

- Message: `Fix:#78 모바일에서 페이지 헤더가 찌그러지던 문제 수정`
- Issue: `#78`
- Jira: 미사용

**변경 요약**

- `PageHeader` 제목 행에 `flex-wrap` 추가 — 좁은 폭에서 액션이 다음 줄로 넘어간다
- `companies/index.tsx`·`companies/research.tsx`·`study/[id].tsx`가 형제 요소 대신 `actions` prop을 쓰도록 변경
- `PageHeader.stories.tsx`에 모바일 뷰포트 스토리(`ActionsOnMobile`) 추가

**결정 로그**

- 페이지마다 `flex-col`로 쌓는 대신 이미 있던 `actions` prop을 쓰기로 했다. 제목이 모바일에서 `hidden`이라
  액션을 제목 행에 넣으면 빈 행이 생기지 않고, 세 페이지가 같은 방식으로 정리된다.
- 넓은 폭 정렬은 액션 래퍼의 `ml-auto`로 종전 `justify-between`과 동일하게 유지 — 데스크톱 회귀 없음

**검증**

- tsc·ESLint·vitest 384건·`npm run build` 통과
- **시각 확인 미완** — 샌드박스가 포트 바인딩을 막아(`listen EFAULT`) Storybook·dev 서버를 띄우지 못했다.
  실제 모바일 렌더는 로컬에서 `npm run storybook`(`ActionsOnMobile` 스토리) 또는 `npm run dev`로 확인 필요.

**다음 작업**

- 서비스명 확정 후 반영
