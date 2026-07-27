# coding-calendar — 진행 상황

## 📌 현재 작업

- 이슈: #67 (Feat)
- 브랜치: feature/67-coding-calendar
- 단계: Phase 1 시작
- 마지막 업데이트: 2026-07-27

---

## [Issue #67] coding-calendar

**Type**: Feat | **Jira**: (미사용) | **시작**: 2026-07-27

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행)
- [x] 자동 연동 방식 사전 조사 — 프로그래머스 공개 API 부재 확인, BaekjoonHub 커밋 포맷·저장소 구조 실측

### 🚧 진행 중

- [x] 날짜 유틸 (`shared/lib/date.ts`) — KST 날짜 키, 월 매트릭스, streak (30 tests)
- [x] `solve-log` 타입 정의 (`solve-log.type.ts`)
- [x] BaekjoonHub 커밋 파서 (`baekjoonHub.ts`) — 메시지 파싱, 제목 정규화, 제목→번호 색인, 결정적 문서 ID (31 tests)
- [x] 커밋+트리 → 기록 변환 (`toSolveLogs.ts`, 10 tests)
- [x] GitHub 공개 API 클라이언트 (`github.api.ts`) — 커밋 페이지네이션, 트리 조회, rate limit 에러 처리
- [x] Firestore 저장 계층 (`solveLog.api.ts`, `calendarSettings.api.ts`, 6 tests)
- [x] 조회 훅 (`useSolveLogs.ts`), 동기화 훅 (`features/calendar-sync/model/useCalendarSync.ts`)
- [x] `MonthCalendar` 공통 컴포넌트 + Storybook 스토리 6종
- [x] `DaySolveBadge`, `DayDetailPanel`(수동 기록 CRUD), `SyncRepoSetting`
- [x] `/coding-calendar` 페이지 + 헤더 메뉴 등록
- [ ] 브라우저 실동작 확인 (연동 → 백필 → 달력 표시)

**검증 상태**: 269 tests 통과 / `tsc` 0건 / 신규 파일 eslint 0건 / `npm run build` 성공

⚠️ 기존 파일에 lint 오류가 남아 있음 (범위 밖이라 미수정): `AppSelect.stories`(20), `CodeEditor.stories`(8), `ToggleButtonGroup.stories`(5), `AppFallback.stories`(2), `auth.api.ts`(2). 대부분 스토리 `render` 안에서 훅을 호출하는 `react-hooks/rules-of-hooks` 위반 — 별도 정리 필요

### 📊 실제 데이터 검증 (2026-07-27)

`qlalfdmlghk1/Algorism_Python` 전체 히스토리로 파서를 돌린 결과:

| 항목 | 결과 |
| --- | --- |
| 전체 커밋 | 228 |
| BaekjoonHub 커밋 | 172 (프로그래머스 48 / 백준 124) |
| 제외된 커밋 | 56 (Chore·Merge·뭉치 업로드 — 전부 의도대로 제외) |
| 제목→문제번호 매칭 | **172/172 (100%)** |
| 언어 추출 | js·py·sql 정상 |
| 날짜 변환 | `2026-07-25T16:27:50Z` → KST `2026-07-26` 정상 |

- 전각 정규화(`A＋B` ↔ `A+B`)가 실제로 필요했고, 적용 후 매칭 실패 0건
- **전체 백필 API 요청 수: 4회** (커밋 3페이지 + 트리 1회). 비인증 한도 60회/시간 대비 여유 충분
- 색인 항목(159) < 매칭 건수(172) — 같은 문제를 다른 날 재제출한 기록이 있다는 뜻. 날짜별 별도 기록으로 남는 게 의도한 동작

### 📝 결정 로그

- [2026-07-27] /start 실행, 작업 환경 셋업 완료
- [2026-07-27] 프로그래머스 계정 직접 연동 배제 — 공개 API 없음 + 자격증명 위임은 보안·약관상 부적절
- [2026-07-27] BaekjoonHub 자동 커밋 저장소 읽기로 자동화 방향 확정 (사용자가 이미 사용 중)
- [2026-07-27] 대상 플랫폼 프로그래머스 + 백준, 백필 범위 전체 히스토리, GitHub 인증 없이 공개 저장소 경로 입력
- [2026-07-27] 달력 UI는 월간 그리드 자체 구현 (라이브러리 미도입)
- [2026-07-27] GitHub 호출은 Cloud Functions 경유가 아닌 클라이언트 직접 호출 (rate limit 분산, 시크릿 불필요)
- [2026-07-27] 저장소는 Firestore (기기 간 동기화, 결정적 문서 ID로 재동기화 중복 방지)

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

### ⏭️ 남은 작업

- [ ] 브라우저 실동작 확인 (연동 → 전체 백필 → 달력 표시 → 날짜 상세 → 수동 기록)
- [ ] 기존 파일 lint 오류 37건 정리 여부 결정 (범위 밖으로 미수정)
- [ ] 읽기 최적화 2단계 — 월 단위 조회 + 요약 캐시 (기록 1,000건 근처에서 전환, `tech.md` 참조)
- [ ] SWEA 커밋 처리 — BaekjoonHub는 SWEA도 지원하는데 파서가 `[level N]`이 아닌 배지를 전부 백준으로 판정한다. 현 저장소에는 SWEA 기록이 없어 미대응

### 🔒 Firestore 보안 규칙

- [2026-07-27] 콘솔의 기존 규칙 확인 결과 **`match /{document=**}` 에 `allow read, write: if request.auth != null`** — 로그인한 사용자면 누구나 모든 문서를 읽고 쓸 수 있는 상태였음 (남의 오답노트·템플릿 수정·삭제 포함)
- [2026-07-27] `firestore.rules`를 레포에 도입하고 `firebase.json`에 `firestore` 섹션 추가. 기존 5개(`users`, `submissions`, `userTemplates`, `wrongNotes`, `friendships`) + 신규 2개(`solveLogs`, `calendarSettings`) 커버, 미정의 경로는 전부 차단
- [2026-07-27] 콘솔에 게시 완료. 오답노트·친구·템플릿·제출 기록 기능에서 `permission-denied` 없음을 확인

**규칙만으로 해결 못 해 별도 이슈로 분리할 항목**

- `users` 전체 조회: `searchUserByDisplayName`이 `query(collection(db, "users"))`로 조건 없이 전체를 훑어 클라이언트에서 필터링한다. 규칙을 좁히면 친구 검색이 깨지므로 `read: if isSignedIn()`을 유지했다. 결과적으로 로그인 사용자가 전 사용자 email 목록을 받아갈 수 있어, 검색 방식을 서버 측 조회로 바꿔야 한다. (팀 rule `security-compliance.md` 2항 위반 후보)
- `wrongNotes` 친구 범위 검증: 규칙에서는 `share == true`까지만 판정 가능하다. friendships 문서 ID가 자동 생성이라 규칙 안에서 친구 관계를 조회할 수 없기 때문(규칙은 `get(경로)`만 가능, 쿼리 불가). 좁히려면 friendships 문서 ID를 결정적 키(`{uidA}_{uidB}`)로 변경해야 한다.
- `friendships` update 권한: 현재 당사자 양쪽 모두 허용. 수락·거절은 receiver만 가능해야 하나, 코드에 취소 경로가 update인지 delete인지 확정 못 해 넓게 뒀다. 확인 후 좁힐 것.

**배포 시 동작 변화 (회귀 확인 대상)**

- `getWrongNoteById`: 남의 비공개 노트를 직접 조회하면 지금은 문서를 읽은 뒤 코드에서 `{ note: null }`을 반환하지만, 규칙 적용 후에는 읽기 자체가 거부되어 **예외가 발생**한다. 호출부에서 권한 거부를 "없음"으로 처리하도록 보완이 필요할 수 있다.

---

### Commit — 2026-07-27 23:26

- Message: `Chore:#67 Firestore 보안 규칙을 레포로 도입`
- Issue: `#67`
- Jira: (미사용)

**변경 요약**

- `firestore.rules` 신규 + `firebase.json`에 `firestore` 섹션 추가
- 기존 콘솔 규칙(`allow read, write: if request.auth != null`)을 컬렉션별 소유자 기준으로 교체하고 미정의 경로 차단

**결정 로그**

- `users` 읽기는 로그인 사용자 전체로 유지 — 친구 검색이 컬렉션 전체를 훑는 구조라 좁히면 기능이 깨짐. 검색을 서버 측 조회로 바꾸는 별도 작업 필요
- `wrongNotes`는 `share == true`까지만 규칙으로 판정 — friendships 문서 ID가 자동 생성이라 규칙에서 친구 관계 조회 불가

**다음 작업**

- `users` 전체 조회 개선, `friendships` 문서 ID 결정적 키 전환 (둘 다 별도 이슈)

### Commit — 2026-07-27 23:27

- Message: `Feat:#67 코테 달력 추가`
- Issue: `#67`
- Jira: (미사용)

**변경 요약**

- `/coding-calendar` 페이지와 코딩테스트 그룹 메뉴 추가
- BaekjoonHub 자동 커밋을 읽어 프로그래머스·백준 풀이 이력을 달력에 자동 반영 (연동 → 전체 백필 → `since` 증분 동기화)
- 수동 기록 추가·삭제, 요약 지표(총 풀이·이번 달·연속 학습일)
- `MonthCalendar` 공통 컴포넌트 + Storybook 스토리 6종
- 조회 비용 절감을 위한 세션 캐시(`solveLogCache`) 및 로그아웃 시 정리

**결정 로그**

- 프로그래머스 계정 직접 연동 배제 — 공개 API 부재 + 자격증명 위임 리스크
- GitHub 호출은 Cloud Functions 경유 없이 클라이언트 직접 호출 — rate limit이 사용자 IP로 분산되고 시크릿 불필요. Spark 플랜에서 Functions 외부 호출이 막히는 제약도 함께 회피
- 저장은 Firestore + 결정적 문서 ID(`{uid}__{platform}__{번호}__{YYYYMMDD}`) — 백필·증분 구간이 겹쳐도 중복 대신 덮어쓰기
- 문제번호는 커밋 상세 API 대신 트리 1회 조회로 색인 — 전체 백필 요청 4회로 억제
- 날짜는 KST 기준으로 통일 — UTC로 끊으면 달력이 하루 밀림

**다음 작업**

- 브라우저 실동작 확인 (연동 → 백필 → 달력 표시)
- 기존 파일 lint 오류 37건 정리 여부 결정 (범위 밖으로 미수정)
