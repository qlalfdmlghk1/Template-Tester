# coding-calendar

| 항목         | 값                          |
| ------------ | --------------------------- |
| Jira         | (미사용)                                                          |
| GitHub Issue | [#67](https://github.com/qlalfdmlghk1/Template-Tester/issues/67) |
| Branch       | `feature/67-coding-calendar`                                     |
| 작성자       | WonSeo                                                            |
| 작성일       | 2026-07-27                                                        |
| Type         | Feat                                                              |

## 🎯 작업 목적

매일의 코딩테스트 훈련을 날짜 단위로 남겨 학습 지속성을 눈으로 확인할 수 있게 하고, 이미 BaekjoonHub가 GitHub에 자동 기록 중인 풀이 이력을 서비스 안으로 끌어와 수기 입력 없이 훈련 일지가 채워지도록 한다.

## 📋 작업 범위

**포함 (In Scope)**

- [ ] 코딩테스트 그룹에 `코테 달력`(`/coding-calendar`) 메뉴 추가 (`navMenu.ts`)
- [ ] 범용 월간 달력 그리드 컴포넌트 신규 작성 (`shared/ui/molecules/MonthCalendar`) + Storybook 스토리
- [ ] 날짜 유틸 작성 (`shared/lib/date.ts`) — 월 매트릭스 생성, KST 기준 날짜 키 변환
- [ ] `solve-log` 엔티티 신설 — 타입·Firestore CRUD·조회 훅
- [ ] BaekjoonHub 커밋 메시지 파서 작성 (프로그래머스 `[level N]` / 백준 `[Silver III]` 양식, `Score` 변형 포함)
- [ ] GitHub 공개 API 연동 — 커밋 목록 페이지네이션 조회 + 트리 1회 조회로 제목→문제번호 매핑 구성
- [ ] 동기화 기능 (`features/calendar-sync`) — 전체 백필 / `since` 기반 증분 동기화, 진행 상태·에러 표시
- [ ] 저장소 설정 UI — `owner/repo` 입력·저장·검증 (비인증 공개 저장소 전제)
- [ ] 달력 화면 구성 — 월 이동, 날짜별 풀이 개수·플랫폼 뱃지 표시
- [ ] 날짜 상세 패널 — 그날 푼 문제 목록(제목·난이도·언어·소요시간), 문제 원문 링크
- [ ] 수동 기록 등록·수정·삭제 (BaekjoonHub가 못 잡는 오프라인 풀이용)
- [ ] 요약 지표 — 총 풀이 수, 이번 달 풀이 수, 연속 학습일(streak)
- [ ] 파서·날짜 유틸 단위 테스트 (Vitest)

**제외 (Out of Scope)**

- GitHub OAuth 연동 및 private 저장소 지원 (공개 저장소 경로 입력 방식으로 확정)
- 프로그래머스 계정 직접 연동·크롤링 (공개 API 부재 + 자격증명 위임 리스크로 배제)
- 자체 브라우저 확장 개발 (BaekjoonHub가 이미 그 역할을 수행)
- 잔디 히트맵 뷰 / 연간 통계 대시보드 (달력 뷰 안정화 후 별도 이슈)
- 오답노트·템플릿 등 기존 엔티티와의 상호 연결
- 백준 solved.ac 티어 아이콘·문제 태그 메타 보강

<!-- 후속 이슈 섹션은 여기 아래로 추가 — v2 자동화 예정 -->

## 🖥️ 화면 단위 분해

| 화면명                          | 요약                                       | 핵심 인터랙션                                                        |
| ------------------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| 코테 달력 (`/coding-calendar`)  | 월간 달력 + 요약 지표 + 날짜 상세          | 월 이동, 날짜 클릭 → 상세 패널, 동기화 실행                          |
| 날짜 상세 패널                  | 선택한 날짜의 풀이 목록                    | 문제 원문 링크 이동, 수동 기록 추가·수정·삭제                        |
| 저장소 설정                     | GitHub `owner/repo` 등록                   | 입력·검증·저장, 전체 백필 실행                                       |

## 🎨 디자인 분석

- **반응형 분기**: 기존 페이지와 동일하게 `max-w-[1400px]` 컨테이너 + `sm` 브레이크포인트 사용. 데스크톱은 `lg:grid-cols-[1fr_360px]`로 달력 + 상세 패널 2단, 모바일은 달력 아래로 상세 패널이 흐르는 1단
- **재사용 컴포넌트**: `shared/ui/molecules/PageHeader`, `shared/ui/molecules/AppFallback`, `shared/ui/atoms/AppButton`, `shared/lib/cn`. 탭·카드·입력 스타일은 `pages/daily/index.tsx`의 기존 클래스 상수 패턴을 따름
- **신규 컴포넌트**: `shared/ui/molecules/MonthCalendar`(범용 월 그리드 — 날짜 셀 렌더링을 render prop으로 위임), `entities/solve-log/ui/SolveCalendar`(달력에 풀이 기록을 얹는 조합), `entities/solve-log/ui/DayDetailPanel`, `features/calendar-sync/ui/SyncRepoSetting`

## 🛠️ 접근 방식

**데이터 소스 — BaekjoonHub 커밋 파싱**

BaekjoonHub 확장은 프로그래머스·백준에서 채점을 통과하면 지정 저장소에 자동 커밋한다. 실측한 형태는 다음과 같다.

```
커밋 메시지: [level 2] Title: 의상, Time: 0.23 ms, Memory: 44.1 MB -BaekjoonHub
             [Silver III] Title: 두 수의 합, Time: 80 ms, Memory: 42660 KB -BaekjoonHub
             [Silver I] Title: 볼 모으기, Time: 192 ms, Memory: 40880 KB, Score: 100 point -BaekjoonHub
커밋 날짜:   2026-07-25T16:27:50Z
파일 경로:   프로그래머스/2/42578. 의상/README.md, 프로그래머스/2/42578. 의상/의상.js
             백준/Silver/1000. A＋B/...
```

즉 **날짜·플랫폼·난이도·제목·언어·실행시간·메모리**가 이미 구조화되어 있어 프로그래머스를 직접 조회할 필요가 없다.

- **신뢰 대상 한정**: 메시지가 `-BaekjoonHub`로 끝나는 커밋만 사용한다. 사용자가 과거에 직접 재정리한 뭉치 커밋(`260202-260331 업로드`, `Chore: 풀이 파일 일자별 폴더 구조로 재정리`)은 커밋 날짜가 실제 푼 날짜와 무관하므로 제외한다.
- **문제번호 확보**: 커밋 메시지에는 문제번호가 없다. 커밋마다 상세 API를 부르면 요청 수가 폭발하므로, `git/trees/HEAD?recursive=1` **1회** 호출로 `프로그래머스/{레벨}/{번호}. {제목}/`·`백준/{티어}/{번호}. {제목}/` 디렉터리를 훑어 `제목 → 문제번호` 매핑을 만든 뒤 커밋 제목과 대조한다.
- **제목 정규화 필요**: BaekjoonHub는 파일 경로에서 특수문자를 전각으로 치환한다(`A＋B`, `별 찍기 － 1`, `2541년생？！`). 매핑 조회 전 전각↔반각(`＋－？！／：＊` 등) 정규화를 적용한다. 매핑에 실패해도 기록 자체는 저장하되 원문 링크만 비운다.
- **문제 링크 생성**: 프로그래머스 `https://school.programmers.co.kr/learn/courses/30/lessons/{번호}`, 백준 `https://www.acmicpc.net/problem/{번호}`.

**호출 위치 — Cloud Functions가 아닌 클라이언트 직접 호출**

`api.github.com`은 CORS를 허용하므로 브라우저에서 직접 호출할 수 있다. Functions를 경유하면 모든 사용자의 요청이 서버 IP 하나로 몰려 비인증 rate limit(60회/시간)을 공유하게 되는 반면, 클라이언트 직접 호출은 사용자 IP 기준으로 분산된다. 시크릿도 필요 없으므로 클라이언트에서 호출한다.

요청 수 추산: 전체 백필 = `commits?per_page=100` 페이지 수(현 저장소 기준 10회 미만) + 트리 1회. 증분 동기화 = `since` 파라미터로 1~2회. 비인증 한도 안에서 충분하다. 429/403(rate limit) 응답은 잔여 한도(`X-RateLimit-Reset`)를 안내하는 에러로 처리한다.

**저장 — Firestore**

로그인 사용자의 기록이고 기기 간 동기화가 필요하므로, `daily` 학습이 쓰는 IndexedDB가 아니라 기존 `submissions`와 같은 Firestore를 쓴다.

- 컬렉션 `solveLogs`: 문서 ID를 `{uid}__{platform}__{problemNo}__{YYYYMMDD}` 형태의 결정적 키로 두어, 재동기화 시 같은 기록이 중복 생성되지 않고 덮어써지도록 한다(백필과 증분 동기화의 구간이 겹쳐도 안전).
- 컬렉션 `calendarSettings`(문서 ID = uid): `repoOwner`, `repoName`, `lastSyncedAt`.
- 수동 기록은 `source: "manual"`로 구분해 저장하고, 동기화가 덮어쓰지 않도록 한다.

**시간대**

커밋 날짜는 UTC ISO 문자열이다. `2026-07-25T16:27:50Z`는 KST로 `2026-07-26 01:27`이므로, UTC 기준으로 날짜를 끊으면 달력에서 하루 밀린다. 저장·조회·그룹핑 모두 **KST 기준 `YYYY-MM-DD` 날짜 키**로 통일한다.

**레이어 배치 (FSD)**

- `shared/lib/date.ts` — 월 매트릭스·KST 날짜 키 등 순수 함수
- `shared/ui/molecules/MonthCalendar/` — 도메인 무관 월 그리드 + 스토리
- `entities/solve-log/model/` — 타입, 커밋 메시지 파서(순수 함수), 조회 훅
- `entities/solve-log/api/` — Firestore CRUD, GitHub 조회
- `entities/solve-log/ui/` — `SolveCalendar`, `DayDetailPanel`
- `features/calendar-sync/` — 동기화 실행·저장소 설정 (사용자 행동 단위)
- `src/pages/coding-calendar/index.tsx` — 조립만 담당

## 🔗 참고 자료

| 유형       | 링크                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| Figma      | -                                                                         |
| Storybook  | -                                                                         |
| API 명세   | [GitHub REST — Commits](https://docs.github.com/en/rest/commits/commits), [Git Trees](https://docs.github.com/en/rest/git/trees) |
| Confluence | (미사용)                                                                  |
| 기타       | 실측 대상 저장소 [qlalfdmlghk1/Algorism_Python](https://github.com/qlalfdmlghk1/Algorism_Python) |

## ✅ 검증 계획

- 단위/통합 테스트 (Vitest)
  - BaekjoonHub 커밋 메시지 파서: 프로그래머스 `[level N]`, 백준 `[Silver III]`, `Score` 포함 변형, `Memory: undefined` 변형, `-BaekjoonHub` 아닌 커밋 제외
  - 전각↔반각 제목 정규화 및 제목→문제번호 매핑
  - KST 날짜 키 변환 (UTC 자정 전후 경계 케이스)
  - 월 매트릭스 생성 (월 시작 요일, 말일, 윤년)
  - 연속 학습일(streak) 계산
- 회귀 포인트: `navMenu.ts` 변경에 따른 헤더 메뉴 렌더·활성 판정, Firestore 신규 컬렉션 보안 규칙(현재 레포에 `firestore.rules` 파일이 없어 콘솔 관리 — 규칙 추가 필요 여부 확인)
- 수동 확인: 저장소 등록 → 전체 백필 → 달력 표시, 재동기화 시 중복 미발생, 월 이동, 날짜 상세, 수동 기록 CRUD, rate limit 초과 시 에러 문구, 다크 모드, 모바일 폭

## 🤔 주요 결정 사항

- [2026-07-27] 프로그래머스 계정 직접 연동은 **배제** — 공개 API가 없고, 자격증명을 서비스가 보관해 대리 로그인하는 방식은 보안·약관상 부적절 (사용자 확인)
- [2026-07-27] 대신 **BaekjoonHub 자동 커밋 저장소를 읽는 방식**으로 자동화 — 이미 사용 중이라 추가 설치 없이 동작 (사용자 결정)
- [2026-07-27] 대상 플랫폼은 **프로그래머스 + 백준 모두** — 저장소에 백준 기록이 훨씬 많음 (사용자 결정)
- [2026-07-27] 백필 범위는 **전체 히스토리** (사용자 결정)
- [2026-07-27] GitHub 인증 없이 **공개 저장소 경로 입력** 방식 (사용자 결정)
- [2026-07-27] 달력 UI는 잔디 히트맵이 아닌 **월간 달력 그리드**, 라이브러리 도입 없이 자체 구현 (사용자 결정)
- [2026-07-27] GitHub 호출은 Cloud Functions 경유가 아닌 **클라이언트 직접 호출** — rate limit이 사용자 IP로 분산되고 시크릿이 불필요
- [2026-07-27] 저장소는 IndexedDB가 아닌 **Firestore** — 기기 간 동기화 필요, 결정적 문서 ID로 재동기화 중복 방지

<!-- /note 또는 수동으로 추가 -->
