# recruitment — 진행 상황

## 📌 현재 작업

- 이슈: #75 (Feat)
- 브랜치: feature/75-recruitment
- 단계: 읽기·편집 화면 완료 / 다음은 xlsx 임포트
- 마지막 업데이트: 2026-08-02 16:41

---

## [Issue #75] '채용' 페이지 구현

**Type**: Feat | **Jira**: 미사용 (GitHub Issue로 관리) | **시작**: 2026-08-02

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행)
- [x] 기획 검수 (/plan-review) — 🚫 5건 / ⚠️ 8건 / 💡 5건 도출 후 **전건 해소**

- [x] 도메인 타입·순수 로직 (`entities/company`, `entities/job-application`) + 단위 테스트 45개
- [x] Firestore API 레이어 (`companies`, `jobApplications`) 및 조회·CRUD 훅
- [x] 조합 훅 `useRecruitmentBoard` — 조인·반기·정렬·필터·합격률
- [x] 읽기 화면 — 데스크톱 그리드 / 모바일 카드 / 상세 패널 / 툴바
- [x] Navbar `채용` 라벨 적용 및 `comingSoon` 해제

- [x] Firestore 보안 규칙 추가 및 배포 (`companies`, `jobApplications`)
- [x] 공통 컴포넌트 `AppToast`(+ToastProvider) · `AppConfirmDialog` + Storybook 스토리
- [x] 지원 건 등록/수정 폼 (기업 신규 등록 포함)
- [x] 그리드 셀 편집 다이얼로그 — 상태·일정·메모, 즉시 저장 + 실패 롤백
- [x] 삭제 확인 다이얼로그 + 성공/실패 토스트

### 🚧 진행 중

- [ ] 기업 조사 노트 탭

### 📝 결정 로그

- [2026-08-02] /start 실행, 작업 환경 셋업 완료
- [2026-08-02] 작업 제목 `'기업 조사' 페이지 구현` → `'채용' 페이지 구현` 변경, 기능명 `recruitment`
- [2026-08-02] 기획 검수 결과 🚫 5건 → 사용자 답변으로 전건 확정. 상세는 [planning-review.md](./planning-review.md)
- [2026-08-02] 데이터 모델을 `companies` / `applications` 분리로 확정 — 같은 기업 재지원(현대오토에버 2건)과 기업 단위 조사 노트 때문
- [2026-08-02] CSV → xlsx 임포트로 변경 — 상태가 셀 배경색으로만 표현돼 CSV 내보내기 시 소실됨
- [2026-08-02] 합격률 `PASSED / (PASSED + FAILED)`, 전형 8단계(자소서~2차 면접)만 집계
- [2026-08-02] 반기 경계 1~6월 / 7~12월, 자소서 마감일 기준 자동 귀속
- [2026-08-02] 잔여 ⚠️ 4건 / 💡 5건도 전부 확정 — 분모 0은 `-`, 미지원 건은 집계 제외, 셀 편집 즉시 저장, 토스트+삭제 확인, 빈·로딩·에러 전부 구현, 아이콘+색상 병기, 메모는 지원 건·단계 셀 둘 다, 직무 태그 고정, 채용 인원 미정 허용, 지난 반기 편집 가능

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

### ⏭️ 남은 작업

**구현**

<!-- plan.md In Scope 미완 항목 자동 동기화 -->

- [x] 채용 페이지 라우트 및 반응형 레이아웃
- [x] Firestore 스키마 (데이터 레이어) — 보안 규칙은 미적용
- [x] 반기 자동 귀속 및 전환 UI
- [x] 지원 건 상태 자동 파생
- [x] 단계별 합격률 집계
- [x] 데스크톱 상세 패널 (읽기)
- [x] 모바일 카드 임박 일정·현재 단계
- [x] 마감일순 정렬 + 직무·상태 필터
- [x] Firestore 보안 규칙(소유권) 추가·배포
- [x] 기업 생성 (지원 건 폼 안에서 신규 등록)
- [x] 지원 건 CRUD 화면
- [x] 전형 10단계 일정 입력 UI (정확/기간/러프)
- [x] 전형 단계 상태 편집 UI
- [x] 셀 메모 입력
- [x] 토스트 + 삭제 확인 다이얼로그
- [x] 로그인 가드 — `App.tsx`의 `publicPaths`가 Login/Signup만 공개로 두므로 `/companies`는 이미 `ProtectedRoute` 적용됨 (추가 작업 없음)
- [ ] 기업 단독 수정·삭제 화면 (현재는 지원 건 폼에서 신규 등록만 가능)
- [ ] 기업 조사 노트 탭
- [ ] xlsx 임포트 (SheetJS 도입 승인됨, 미설치)

### 📌 구현 중 확인된 사실

- 라우팅은 `vite-plugin-pages` 기반 파일 라우팅이다. `app/router/` 디렉터리는 없다.
- `/companies` 페이지가 "기업 조사" 플레이스홀더로 이미 존재했고, 이를 채우는 방향으로 진행했다.
- **TanStack Query·Zustand는 미설치**다. `fe-convention.md`는 둘을 전제하지만 실제 코드는 커스텀 훅 + Firestore 직접 호출 패턴이며, 이번 작업도 기존 패턴을 따랐다.
- 색상 토큰은 CSS 변수 기반이라 다크 테마에서 변수 값이 바뀐다. `dark:` 접두사를 쓰면 안 된다.
- `AppIcon`은 iconify heroicons 이름을 받는다 (lucide 아님).

---

### Commit — 2026-08-02 16:41

- Message: `Feat:#75 채용 페이지 구현 — 지원 현황 그리드·편집·반응형 레이아웃`
- Issue: `#75`
- Jira: 미사용
- 함께 커밋된 것: `Docs:#75 기획 문서`, `Feat:#75 공통 토스트·확인 다이얼로그` (총 3개 커밋으로 분리)

**변경 요약**

- `entities/company`, `entities/job-application` 신설 — 도메인 타입, 전형 10단계·상태 정의, 일정 구조화(정확/기간/러프), 반기 자동 귀속, 합격률·지원 건 상태 파생
- `features/recruitment` 신설 — 보드 조합 훅(`useRecruitmentBoard`), 페이지 상태·액션 훅(`useRecruitmentPage`), 그리드·카드 리스트·상세 패널·툴바·폼·셀 편집 다이얼로그
- `/companies` 플레이스홀더를 실제 화면으로 교체, Navbar 라벨을 "기업 조사" → "채용"으로 변경하고 `comingSoon` 해제
- `firestore.rules`에 `companies`·`jobApplications` 소유권 규칙 추가 (배포 완료)
- 단위 테스트 45개 추가 (schedule 13 / stats 21 / half 11)

**결정 로그**

- 상태 관리는 TanStack Query·Zustand를 도입하지 않고 기존 커스텀 훅 + Firestore 직접 호출 패턴을 따랐다. 두 라이브러리가 미설치이고, 이 페이지만 다른 방식을 쓰면 일관성이 깨지기 때문.
- 그리드 셀 편집은 낙관적 업데이트 후 실패 시 편집 직전 값으로 롤백한다(`useApplications.editStage`).
- 단계 상태는 배경색과 아이콘을 함께 써서 색상 단독으로 구분되지 않게 했다(접근성).
- Firestore 규칙의 `update`에는 `isOwner() && isCreatingOwn()`을 함께 걸었다. update의 `request.resource.data`는 병합 후 문서 전체라, 검사하지 않으면 `userId`를 남의 uid로 바꿔 문서를 넘길 수 있다. 반대로 `delete`에는 `isCreatingOwn()`을 걸지 않았다 — 삭제 요청에는 `request.resource`가 없어 평가 오류로 삭제가 항상 실패한다.
- 등록 모달 폭을 태블릿(`md`) 600px, PC(`lg`) 680px로 넓혔다.

**다음 작업**

- xlsx 임포트 — SheetJS 설치 후 셀 배경색 hex → 상태 매핑. 실제 파일로 색상값 분포 확인이 선행되어야 함
- 기업 조사 노트 탭 (비채용기간용)
- 기업 단독 수정·삭제 화면
