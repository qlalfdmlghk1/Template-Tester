# job-posting-extract

| 항목         | 값                          |
| ------------ | --------------------------- |
| Jira         | 미사용 (GitHub Issue로 관리) |
| GitHub Issue | [#92](https://github.com/qlalfdmlghk1/Template-Tester/issues/92) |
| Branch       | `feature/92-job-posting-extract` |
| 작성자       | WonSeo                      |
| 작성일       | 2026-08-14                  |
| Type         | Feat                        |

## 🎯 작업 목적

지원 건에 저장된 채용 공고 링크에서 직무 설명·자격 요건·우대사항을 AI가 읽어 채워, 사용자가 공고를 다시 열어 손으로 옮겨 적는 일을 없앤다.

## 📋 작업 범위

**포함 (In Scope)**

- [ ] `JobApplication`에 공고 추출 필드 3종 추가 (`jobDescription` / `requirements` / `preferredQualifications`) + 출처·실행 시각 필드
- [ ] 공고 파싱 프롬프트·응답 파싱 공유 모듈 작성 (`posting.shared.ts` — 제공자 무관)
- [ ] Anthropic 경로: 기존 `web_search`에 `web_fetch_20260209` 도구 추가
- [ ] Gemini 경로: 기존 `google_search`에 `{"type": "url_context"}` 도구 추가
- [ ] 공고 파싱 실행 훅 작성 (`useJobPostingExtract`) — 항목별 선택 반영, 화면 이탈 시 abort
- [ ] 지원 건 상세에서 "공고 불러오기" 실행 → 결과 초안 미리보기 → 항목별 선택 반영 UI
- [ ] **fetch 실패 폴백**: 공고 본문을 직접 붙여넣어 같은 추출 프롬프트를 태우는 경로
- [ ] 실패 원인 구분(공고 읽기 실패 / 키 오류 / 한도 초과)과 각각의 안내 문구
- [ ] 단위 테스트: 공유 파싱 모듈, 제공자별 도구 응답 처리, 실행 훅

**추가 (2026-08-14 범위 확대)**

- [ ] 전형 일정 자동 채움 — 처음엔 제외했다가 사용자 요청으로 포함. 덮어쓰기 위험은 "손대지 않은 칸(`PENDING` + 일정 없음)에만 제안"과 "`status` 불변"으로 막는다. 상세는 `progress.md` 참조

**제외 (Out of Scope)**

- 모집 인원(`headcount`) 자동 채움 — 사용자가 이미 입력한 값을 AI가 덮어쓸 위험이 있어 이번 범위에서 뺀다
- 공고 이미지(OCR) 처리 — 본문이 이미지인 공고는 붙여넣기 폴백으로 처리
- 공고 변경 감지·재파싱 자동화
- 추출 결과를 자기소개서 문항과 연결하는 기능

## 🖥️ 화면 단위 분해

| 화면명                    | 요약                              | 핵심 인터랙션                                                                 |
| ------------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| 지원 건 상세 패널         | 공고 정보 3종 표시 + 추출 실행     | "공고 불러오기" 클릭 → 진행 표시 → 결과 초안 → 항목별 체크 후 반영/취소        |
| 공고 본문 붙여넣기 다이얼로그 | fetch 실패 시 열리는 폴백 입력창 | 본문 붙여넣기 → 같은 추출 실행 → 동일한 초안 미리보기로 합류                   |

진입점은 **지원 건 상세 패널**(`ApplicationDetailPanel`)을 1순위로 둔다 — 결과 초안을 항목별로 검토·반영하려면 폼 다이얼로그보다 넓은 지면이 필요하고, `postingUrl`은 이미 지원 건에 저장돼 있어 상세에서 바로 읽을 수 있다.

## 🎨 디자인 분석

- **반응형 분기**: 상세 패널의 기존 분기를 그대로 따른다 (신규 브레이크포인트 없음)
- **재사용 컴포넌트**:
  - `AiResearchPreview` — 결과 초안 항목별 선택 UI
  - `ResearchSourceLinks` — 출처 링크 표시
  - `ResearchText` — `**` 핵심구 강조 렌더링
  - `AiKeyDialog` — 키 미등록 시 유도
- **신규 컴포넌트**: 공고 본문 붙여넣기 다이얼로그 (`features/recruitment/ui/PostingPasteDialog`)

## 🛠️ 접근 방식

기업 조사(`entities/company/api/research.*`)의 구조를 **그대로 미러링**한다. 공유 모듈에 프롬프트·파싱·에러 타입을 두고 제공자별 파일이 도구 선언과 응답 형태만 다르게 갖는 방식이다. 이미 검증된 브라우저 직접 호출 경로(Anthropic은 `anthropic-dangerous-direct-browser-access` 헤더, Gemini는 헤더 없이 통과)와 BYOK 키 보관(`useAiKey`)을 재사용한다.

핵심 제약과 대응:

- 브라우저가 공고 URL을 직접 fetch하면 CORS로 막히므로, **AI 서버 측 도구**로 가져온다. Anthropic `web_fetch`는 대화에 이미 등장한 URL만 가져오는데, 공고 링크는 사용자가 입력한 값이라 이 조건을 충족한다.
- 검색 grounding과 JSON 응답 모드를 함께 못 쓰는 Gemini 제약은 기존과 동일하므로, JSON을 프롬프트로 요구하고 텍스트에서 파싱하는 현재 방식을 유지한다.
- 서버 도구 실패는 HTTP 200 본문 안의 에러 객체로 오므로(Anthropic `web_fetch_tool_result`, Gemini `url_context_result.status`), **조용한 빈 결과가 되지 않도록 명시적으로 검사**해 폴백으로 분기시킨다.
- AI 결과는 초안으로 다루고 기존 값을 일괄 덮어쓰지 않는다 — 기업 조사에서 확립된 정책(`useCompanyAiResearch`)을 동일하게 적용한다.

## 🔗 참고 자료

| 유형       | 링크                                                              |
| ---------- | ----------------------------------------------------------------- |
| Figma      | -                                                                 |
| Storybook  | -                                                                 |
| API 명세   | https://ai.google.dev/gemini-api/docs/url-context (Gemini url_context) |
| Confluence | 미사용                                                            |

## ✅ 검증 계획

- **단위/통합 테스트 (Vitest)**
  - `posting.shared.ts` — 프롬프트 구성, JSON 파싱 폴백, 출처 정규화
  - `posting.anthropic.ts` / `posting.gemini.ts` — 도구 응답 파싱, 서버 도구 에러 객체 → 폴백 분기, `pause_turn` 재개
  - `useJobPostingExtract` — 항목별 선택 반영, abort 시 상태 미갱신
- **실측 검증 (필수 — 문서로 대체 불가)**
  - 실제 공고 URL로 fetch 성공률 측정: 사람인 · 잡코리아 · 원티드 · 기업 자체 채용 페이지 각 2건 이상
  - 두 제공자 모두에서 측정 (Anthropic `web_fetch` / Gemini `url_context`)
  - 결과를 `progress.md`에 사이트별 성공/실패로 기록 — 성공률이 낮으면 붙여넣기 폴백을 주 경로로 승격할지 재검토
- **회귀 포인트**
  - `JobApplication` 타입 변경이 XLSX 임포트(`xlsxImport.ts`)·통계(`stats.ts`)·목록 카드에 미치는 영향
  - Firestore 저장 시 `undefined` 필드 거부 — `stripUndefined`가 새 중첩 필드를 훑는지 확인
  - 기존 기업 조사 흐름에 영향 없음(별도 모듈)
- **수동 확인**
  - 키 미등록 상태에서 실행 시도 → 키 등록 유도
  - 공고 링크 없는 지원 건 → 실행 버튼 비활성 또는 붙여넣기로 유도
  - 마감된 공고 URL → 실패 안내 후 붙여넣기 폴백 진입
  - 이미 값이 있는 필드가 덮어써지지 않는지

## 🤔 주요 결정 사항

- [2026-08-14] 추출 대상을 **신규 3개 필드로 한정**. `headcount`·전형 일정은 기존 사용자 입력 필드라 AI가 덮어쓸 위험이 있어 제외.
- [2026-08-14] 공고 정보는 **기업이 아니라 지원 건에 저장**. 같은 기업 상·하반기 공고는 자격 요건이 다르므로, `postingUrl`을 지원 건으로 옮긴 것과 같은 근거.
- [2026-08-14] **붙여넣기 폴백을 v1에 포함**. 한국 채용 사이트는 SPA 렌더링·봇 차단·이미지 본문이 흔해 fetch 성공률이 사이트별로 갈리며, 폴백 없이는 기능이 통째로 안 먹히는 사용자가 생긴다.
- [2026-08-14] 제공자 대칭 유지 확인. Gemini `url_context`가 `gemini-2.5-flash`에서 지원되고 `google_search`와 동시 사용 가능해, 제공자별 기능 차이를 UI에 노출할 필요가 없다.
