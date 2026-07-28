# header-menu-restructure — 진행 상황

## 📌 현재 작업

- 이슈: #64 (Refactor)
- 브랜치: `refactor/64-header-menu-restructure`
- 단계: 구현 완료, PR 대기
- 마지막 업데이트: 2026-07-27

---

## [Issue #64] header-menu-restructure

**Type**: Refactor | **Jira**: (미사용) | **시작**: 2026-07-26

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행)
- [x] 메뉴 설정·활성 판정 로직 분리 — `src/widgets/Navbar/model/navMenu.ts`
- [x] 그룹 드롭다운 컴포넌트 신규 작성 — `src/widgets/Navbar/NavMenu.tsx`
- [x] `Navbar.tsx`의 인라인 평면 메뉴 블록을 `<NavMenu />`로 교체
- [x] 데일리 학습을 이론 공부 그룹 하위로 이동
- [x] 개념 학습 준비중 페이지 추가 — `src/pages/theory/index.tsx`
- [x] 기업 조사 준비중 페이지 추가 — `src/pages/companies/index.tsx`
- [x] 활성 경로 판정에 경로 경계(`/`) 검사 적용
- [x] 타입 체크(`npx tsc --noEmit --project tsconfig.app.json`) / ESLint 통과

- [x] 그룹별 개별 드롭다운 → **화면 전체 폭 메가메뉴**로 전환 (사용자 피드백 2회 반영)
- [x] 펼침 컬럼을 각 헤더 항목 아래로 정렬 (트리거 위치·너비 측정)
- [x] 준비중 표기를 배지 텍스트 → 연한 글자색(`gray-400`)으로 변경
- [x] 선택 상태의 파란 배경 제거 → 글자색만으로 구분
- [x] 트리거 → 패널 이동 중 메뉴가 닫히는 문제 수정

### 🚧 진행 중

- [ ] 브라우저 수동 확인 (메가메뉴 개폐, 컬럼 정렬, 활성 표시, 다크 모드, 모바일 폭)

### 📝 결정 로그

- [2026-07-26] /start 실행, 작업 환경 셋업 완료 (Jira 미사용 — GitHub 이슈 #64만 생성)
- [2026-07-26] 데일리 학습을 코딩테스트가 아닌 **이론 공부** 그룹 하위로 배치
- [2026-07-26] 이론 공부·기업 조사는 메뉴 비활성 대신 **준비중 플레이스홀더 페이지**로 진입 가능하게 함
- [2026-07-26] 그룹 UI는 2단 탭이 아닌 **호버/클릭 드롭다운** — 헤더 높이 증가 회피
- [2026-07-26] "이론 공부" 그룹의 랜딩 항목명을 `개념 학습`(`/theory`)으로 임시 지정 — 실제 기능 착수 시 재검토
- [2026-07-26] 준비중 화면은 신규 컴포넌트 없이 기존 `AppFallback`(`type="empty"`, `hideButton`) 재사용

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

### ⏭️ 남은 작업

- [ ] `isPathActive` / `isEntryActive` 단위 테스트 추가 검토
- [ ] 커밋 (`/commit`) 및 PR 생성 (`/pr`) — target: `dev`

### ⚠️ 후속 확인 필요

- `개념 학습`(`/theory`) 항목명·경로는 임시값. 이론 공부 기능 기획 확정 시 `navMenu.ts` 한 곳에서 변경
- 기존 활성 판정이 `pathname.startsWith(path)`여서 `/templates-abc` 같은 경로도 활성 처리되던 문제를 함께 수정함 (요청 범위 밖이지만 그룹 활성 판정 재작성 과정에 포함)

---

### Commit — 2026-07-27 00:03

- Message: `Refactor:#64 헤더 메뉴 그룹 구조 재편`
- Issue: `#64`
- Jira: 미사용

**변경 요약**

- 평면 메뉴 3개(템플릿·오답노트·데일리 학습)를 3개 영역 그룹(코딩테스트·이론 공부·기업 조사)으로 재편
- 메뉴 데이터와 활성 경로 판정을 `widgets/Navbar/model/navMenu.ts`로 분리, 렌더링은 `NavMenu.tsx`가 담당
- 호버 시 화면 전체 폭 패널이 펼쳐지고 모든 그룹의 하위 항목이 동시에 노출
- `/theory`·`/companies` 준비중 페이지 신규 추가 (파일 라우팅으로 자동 등록)

**결정 로그**

- 펼침 UI는 그룹별 개별 드롭다운이 아니라 **화면 전체 폭 단일 패널**. 그룹마다 카드를 띄우면 폭이 겹쳐 서로 가려짐
- 패널의 `absolute` 기준을 `<nav>`(sticky)로 두기 위해 `NavMenu` 컨테이너에 `position`을 주지 않음. 헤더 안쪽 `max-w-[1400px]` 컨테이너를 벗어나야 전체 폭이 나옴
- 컬럼 정렬은 CSS로 불가 — 트리거 행이 헤더의 `justify-between` 안에 있어 좌표가 가변이라, `useLayoutEffect`에서 트리거의 left 오프셋·너비를 측정해 적용 (resize 대응 포함)
- 트리거→패널 이동 중 닫힘은 **부모의 세로 패딩**이 원인. `py/-my`로 히트 영역만 넓히고, 1px 테두리 통과 대비 120ms 닫힘 유예 추가
- 준비중 표시는 배지 대신 연한 글자색. 디자인 토큰이 CSS 변수라 `/60` 알파 수식자가 안 먹어 `gray-400` 토큰 사용
- 선택 상태에서 배경색 제거. 일관성을 위해 트리거의 호버 배경도 글자색 변화로 통일

**다음 작업**

- 브라우저 수동 확인 후 PR 생성 (target `dev`)
- `isPathActive`/`isEntryActive` 단위 테스트 추가 검토

---

### Commit — 2026-07-27 00:29

- Message: `Fix:#64 헤더 메뉴의 터치·키보드 개폐 동작 수정`
- Issue: `#64`
- Jira: 미사용

**변경 요약**

- PR #65에 `/review-converge` 3라운드 실행. 리뷰에서 나온 Blocker 1건과 그 수정이 만든 회귀 1건을 반영
- 호버 개폐를 `pointerType === "mouse"` 로 제한하고, 그룹 트리거 클릭은 입력 수단별로 분기
- 바깥 닫기 리스너를 `mousedown` → `pointerdown` 으로 교체

**결정 로그**

- **[Blocker]** 터치에서 탭 1회 시 `pointerenter` 로 열린 직후 `click` 토글이 도로 닫아 메뉴가 열리지 않았음. `/templates`·`/daily` 는 이 메뉴가 유일한 진입 경로라 모바일에서 접근 불가 상태였음. 호버 개폐를 마우스로 한정해 해결
- **[회귀]** 위 수정 직후, 키보드 Enter 는 `pointerdown` 이 없어 `pointerTypeRef` 가 기본값 `"mouse"` 로 남아 열기만 반복되고 닫히지 않았음(`aria-expanded` 도 true 고정). 키보드 유래 click 은 `detail === 0` 이라는 점을 이용해 입력 수단과 무관하게 토글하도록 수정
- `cancelScheduledClose()` 를 클릭 핸들러 진입부로 옮겨, 닫힘 타이머가 예약된 상태에서 연 메뉴가 120ms 뒤 닫히는 레이스를 제거
- iOS Safari 는 핸들러 없는 영역 탭에 호환 마우스 이벤트를 쏘지 않아 "바깥 탭으로 닫기" 가 불발됨. `pointerdown` 으로 교체

**다음 작업**

- 실기기(안드로이드 Chrome / iOS Safari) 터치 동작 확인
- 리뷰에서 남긴 항목(a11y `role="menu"`, 모바일 가로 오버플로, 다크모드 hover 대비, 단위 테스트 부재) 후속 처리 판단
