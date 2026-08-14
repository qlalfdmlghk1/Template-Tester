# job-posting-extract — 진행 상황

## 📌 현재 작업

- 이슈: #92 (Feat)
- 브랜치: feature/92-job-posting-extract
- 단계: Phase 1 시작
- 마지막 업데이트: 2026-08-14

---

## [Issue #92] 채용 공고 링크에서 직무 설명·자격 요건 AI 추출

**Type**: Feat | **Jira**: 미사용 | **시작**: 2026-08-14

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행)
- [x] 제공자별 서버 도구 지원 여부 확인 (문서 기준)
- [x] `JobApplication`에 공고 추출 필드 3종 + `postingSources`·`extractedAt` 추가
- [x] `ResearchSource`를 `shared/model/aiSource.ts`로 이관 (FSD 슬라이스 간 의존 회피)
- [x] `posting.shared.ts` 공유 모듈 (프롬프트·파싱·에러 종류)
- [x] Anthropic 경로 `web_fetch_20260209` + `web_search_20260209`
- [x] Gemini 경로 `url_context` + `google_search`
- [x] `posting.api.ts` 제공자 라우팅
- [x] `useJobPostingExtract` 훅 (항목별 선택 반영, 화면 이탈 시 abort)
- [x] `mergePostingDraft` 순수 함수 (선택 항목만 반영, 출처 병합)
- [x] `AiFieldPreview` 제네릭 미리보기 추출 — `AiResearchPreview`는 얇은 래퍼로 전환
- [x] `PostingSection` (상세 패널 내 실행·결과·오류 표시)
- [x] `PostingPasteDialog` 붙여넣기 폴백
- [x] 단위 테스트 39개 추가 — 전체 534개 통과
- [x] type-check / build / lint(변경 파일) 통과

### 🚧 진행 중

- [ ] fetch 성공률 실측 (아래 표) — 실제 AI 키와 공고 URL 필요

### 📝 결정 로그

- [2026-08-14] /start 실행, 작업 환경 셋업 완료
- [2026-08-14] 추출 대상을 **신규 3개 필드로 한정** (`jobDescription`/`requirements`/`preferredQualifications`). `headcount`·전형 일정은 기존 사용자 입력 필드라 AI가 덮어쓸 위험이 있어 제외.
- [2026-08-14] 공고 정보는 **기업이 아니라 지원 건에 저장**. 같은 기업 상·하반기 공고는 자격 요건이 다르므로, `postingUrl`을 지원 건으로 옮긴 것과 같은 근거.
- [2026-08-14] **붙여넣기 폴백을 v1에 포함**. 한국 채용 사이트는 SPA 렌더링·봇 차단·이미지 본문이 흔해 fetch 성공률이 사이트별로 갈리며, 폴백 없이는 기능이 통째로 안 먹히는 사용자가 생긴다.
- [2026-08-14] 제공자 대칭 유지. Gemini `url_context`가 `gemini-2.5-flash`에서 지원되고 `google_search`와 동시 사용 가능해, 제공자별 기능 차이를 UI에 노출할 필요가 없다. Anthropic은 `web_fetch_20260209`.
- [2026-08-14] 진입점은 **지원 건 상세 패널**(`ApplicationDetailPanel`) 1순위. 결과 초안을 항목별로 검토·반영하려면 폼 다이얼로그보다 넓은 지면이 필요하고, `postingUrl`을 상세에서 바로 읽을 수 있다.
- [2026-08-14] **plan 전제 오류를 구현 중 발견.** `Company`에 이미 `jobDescription`·`requirements`가 있었다(시트 "채용 정보" 탭 유래, 수기 입력, `hasResearch` 채움률·필터에 포함). 사용자 확인 후 **plan 원안대로 지원 건 단위 신규 필드**로 진행. 두 곳의 같은 이름 필드는 의미가 다르므로 타입 주석으로 구분을 못박았다 — 기업 쪽은 공고 전 **기업 단위 대략치**, 지원 건 쪽은 **이 공고에 실제로 적힌 내용**.
- [2026-08-14] `ResearchSource`를 `shared/model/aiSource.ts`로 이관. `entities/job-application` → `entities/company` import 는 같은 레이어 슬라이스 간 의존이라 FSD 위반이다. `shared/config/aiProvider`가 같은 이유로 이미 shared 에 있어 선례를 따랐다. `company.type.ts`에서 재export 해 기존 import 경로는 그대로 둔다.
- [2026-08-14] 출처의 빈 `title`은 `normalizeSources` 한 곳에서 걷어낸다. `stripUndefined`가 배열 안쪽 객체를 훑지 않아 `title: undefined`가 Firestore 저장을 깨뜨리는데, 제공자별로 따로 막으면 새 제공자를 붙일 때 또 빠뜨린다.
- [2026-08-14] **빈 결과를 성공으로 흘려보내지 않는다.** 서버 도구가 페이지를 못 가져오면 모델은 프롬프트대로 전 항목이 빈 JSON 을 준다. 그대로 두면 화면에 빈 결과만 뜨고 사용자는 이유를 모른다 — `isEmptyResult`로 걸러 `fetchBlocked`로 바꾸고 붙여넣기 폴백으로 유도한다.
- [2026-08-14] 붙여넣기 경로에서는 **도구를 아예 선언하지 않는다.** 붙여넣은 본문이 정본인데 도구를 주면 모델이 페이지를 다시 읽으러 갔다가 차단당해 빈손으로 돌아온다. 사용자 비용·시간도 는다.
- [2026-08-14] `AiResearchPreview`를 제네릭 `AiFieldPreview` + 얇은 래퍼로 분해. 100줄 가까운 JSX 를 복제하는 대신이며, 기업 조사 호출부는 한 줄도 바뀌지 않아 회귀 위험이 없다.

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

### 📊 fetch 성공률 실측 (필수 — 미완)

문서로 대체할 수 없는 항목. 구현 후 실제 공고 URL로 측정해 채운다.
성공률이 낮으면 붙여넣기 폴백을 주 경로로 승격할지 재검토한다.

`일정 개수`는 전형 일정 자동 채움(아래 보류 항목)의 판단 근거를 같이 모으기 위한 칸이다.
공고 **본문에 실제로 적혀 있는** 전형 일정의 개수를 센다 (예: 서류 접수 기간만 있으면 1).

| 사이트 | Anthropic (`web_fetch`) | Gemini (`url_context`) | 일정 개수 | 비고 |
| ------ | ----------------------- | ---------------------- | --------- | ---- |
| 사람인 | - | - | - | |
| 잡코리아 | - | - | - | |
| 원티드 | - | - | - | |
| 기업 자체 페이지 | - | - | - | |

### ⏭️ 남은 작업

- [ ] **fetch 성공률 실측** 후 위 표 기록 (실제 키·공고 URL 필요 — 코드로 대체 불가)
- [ ] 실측에서 Gemini `urlContextMetadata` 필드명 확인 (아래 미해결 참조)
- [ ] `PostingSection`·`PostingPasteDialog` 컴포넌트 테스트 (현재는 훅·순수 함수까지만 커버)

### ✅ 해소된 미정의 케이스

- **공고 링크 없는 지원 건** → "공고 불러오기" 버튼을 감추고 "본문 붙여넣기"만 남긴다. 링크 등록을 안내하는 문구를 함께 띄운다.
- **재실행 시 기존 값** → 기업 조사와 동일하게 항목별 선택 반영. 값이 있는 항목에는 "기존 내용 덮어씀" 배지가 뜬다.
- **`stripUndefined` 중첩 필드** → 실제로 배열 안쪽을 훑지 않음을 확인. `normalizeSources`에서 빈 `title`을 걷어내는 것으로 막고 테스트로 고정했다.
- **XLSX 임포트 노출** → 노출하지 않는다. 임포트는 시트 마이그레이션용이고 공고 추출 필드는 시트에 대응물이 없다.

### ✅ 전형 일정 자동 채움 — 구현함

[2026-08-14] 처음엔 실측 후 결정하기로 보류했다가, 사용자 요청으로 **같은 날 구현으로 전환**했다.
아래는 보류 당시 정리한 위험과 그에 대한 대응이다 — 설계 근거로 남긴다.

구현한 것:

- `postingSchedule.ts` — 모델 출력 정규화·검증 (연도 채우기, 없는 날짜·범위 밖 값·잘못된 `kind`/`part` 거르기, 연말을 넘기는 기간 처리, 전형 순서 정렬)
- `filterProposableSchedules` — `PENDING` 이고 일정이 빈 칸에만 제안
- `mergePostingSchedules` — 고른 단계만 반영, **`status` 는 건드리지 않음**, 단계 맵을 통째로 쓸 때 `memo: undefined` 를 남기지 않음
- `PostingSchedulePreview` — 연도를 명시해 표시하고 추론값에 `연도 추정` 배지, 텍스트와 **반영 버튼을 분리**(연도가 미심쩍으면 일정만 빼고 반영 가능)
- 테스트 24개 추가 (정규화 13 + 병합·필터 8 + 훅 3)

기술적으로는 가능하나 텍스트 3필드와 성격이 다르다:

- **출력이 구조체다.** `Schedule`은 `exact`/`range`/`rough` 유니온이라 AI 출력 검증이 필요하다. 잘못된 값이 정렬·임박 계산으로 흘러간다.
- **공고에 연도가 없다.** "3/11 마감"만 적힌다. 그런데 자소서 마감일이 **상/하반기 판정 기준**(`HALF_ANCHOR_STAGE`)이라 연도를 틀리면 지원 건이 다른 반기로 사라진다 — 사용자에겐 "없어졌다"로 보인다.
- **덮어쓰기 위험이 크다.** 전형 칸은 일정과 함께 `status`를 들고 있고 그게 합격률 집계로 들어간다. `해당 없음`으로 정리해둔 칸을 건드리면 트래커 핵심 데이터가 틀어진다.

**남은 불확실성**: 공고에 실제로 적힌 일정은 대개 서류 접수 기간 하나뿐일 가능성이 크다 (코테·면접은 "합격자 개별 안내"가 보통). 기능은 10단계를 모두 받게 만들었지만 실제로는 1~2개만 채워질 수 있다 — 위 실측 표의 `일정 개수`로 확인하고, 체감이 낮으면 안내 문구를 조정한다.

### ❓ 미해결

- **Gemini url_context 결과 메타데이터의 정확한 필드명.** 공식 문서는 `url_context_result`를 언급하고 REST camelCase 관례는 `urlContextMetadata`다. 코드는 `urlContextMetadata.urlMetadata[].urlRetrievalStatus`를 읽되, **형태가 어긋나면 조용히 false**를 주도록 했다. 페이지를 못 읽었는지에 대한 1차 판정은 `isEmptyResult`라 이 필드가 틀려도 폴백은 정상 동작한다. 실측 때 실제 응답을 찍어 확인할 것.
- **출처 정규화 로직이 세 곳에 있다** — `shared/model/aiSource.ts`(신규), `entities/company/api/company.api.ts`의 `toResearchSources`, `entities/company/api/research.shared.ts`의 `normalizeSources`. 이번 변경 범위 밖이라 건드리지 않았다. 기업 조사 쪽을 shared 로 모으는 후속 정리 필요.

---

### Commit — 2026-08-15 01:40

- Message: `Fix:#92 모달이 네비게이션 바 아래로 깔리던 문제 수정`
- Issue: `#92`

**변경 요약**

- 겹침 순서를 `tailwind.config.js` 의 `zIndex` 토큰(dropdown/navbar/modal/toast)으로 고정
- 모달 6개를 `z-modal`, Navbar 를 `z-navbar`, 토스트를 `z-toast` 로 전환

**결정 로그**

- 지원 건 추가 모달만 고치지 않고 **모달 6개 전부** 처리했다. 같은 결함이고, 하나만 고치면 나머지는 길어질 때 똑같이 덮인다.
- 토스트를 함께 올린 것은 모달을 1100으로 올리면 기존 `z-50` 토스트가 모달 뒤로 숨기 때문이다.
- 상세 원인·재현 경위는 `troubleshoot.md` 참조.

**다음 작업**

- 공고 추출 기능 본체 커밋
