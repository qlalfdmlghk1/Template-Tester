# project-bugfix — 진행 상황

## 📌 현재 작업

- 이슈: #85 (Fix)
- 브랜치: fix/85-project-bugfix
- 단계: 구현 완료 (테스트·타입 체크 통과, 커밋 전)
- 마지막 업데이트: 2026-08-12

---

## [Issue #85] project-bugfix

**Type**: Fix | **Jira**: 미사용 | **시작**: 2026-08-12

### ✅ 완료

- [x] 작업 환경 셋업 (/start 실행)
- [x] 기획 검수 (/plan-review) — 🚫 2건 도출 후 사용자 결정으로 모두 해소
- [x] 자소서 마감일이 없는 지원 건을 등록 시점 반기로 귀속 (`half.ts` — `getApplicationHalfId`)
- [x] 마감일이 생기면 그 날짜의 반기로 이동 (반기를 저장하지 않고 매번 계산)
- [x] 지원 건 저장 직후 해당 반기로 화면 선택 이동 (`useRecruitmentPage.ts` — `submitForm`)
- [x] 지원 건 상세 패널 sticky 고정 (`pages/companies/index.tsx`) — 목록 아래쪽 행 선택 시 패널이 화면 위로 밀려나던 문제
- [x] 상세 패널에서 해당 기업의 조사 노트로 바로가기 추가 (`ApplicationDetailPanel` → `/companies/research/{companyId}`)
- [x] AI 조사 결과 핵심 문구 강조 — `shared/lib/emphasis.ts` 파서 + `ResearchText` 컴포넌트 + 프롬프트 규칙 (`RESEARCH_SYSTEM_PROMPT`)
- [x] 로그아웃 시 `clearAllAiKeys()` 호출 제거 (`auth.api.ts`)
- [x] `half.spec.ts` 새 규칙에 맞게 수정 (+3 케이스)
- [x] 검증 — 전체 단위 테스트 479개 통과, `tsc --noEmit` 통과

### 🚧 진행 중

- [ ] 커밋 · PR

### 📝 결정 로그

- [2026-08-12] /start 실행, 작업 환경 셋업 완료
- [2026-08-12] 반기 귀속: 마감일 없으면 등록 시점 반기, 마감일 입력 시 그 반기로 이동(날짜 우선). 등록 반기 저장·고정 방식은 미채택
- [2026-08-12] 저장 직후 해당 건의 반기로 화면 선택 이동
- [2026-08-12] AI 키 서버 보관·Functions 프록시 전환 모두 미채택 — 브라우저별 직접 등록 유지
- [2026-08-12] 로그아웃 시 AI 키 자동 삭제 제거 (공용 PC 위험 확인 후 개인 기기 전제로 선택)
- [2026-08-12] 오답노트 AI 문제 생성은 별도 이슈로 분리
- [2026-08-12] AI 조사 강조는 "AI가 `**…**`로 핵심구를 표시 → FE가 그 구간만 색칠" 방식. 저장 스키마 변경 없이 되고 프롬프트가 한 곳(`research.shared.ts`)이라 두 제공자에 동시 적용됨. **이미 저장된 조사 결과는 마커가 없어 재조사해야 강조가 보인다**
- [2026-08-12] 상세 패널은 sticky로 처리. "선택한 행 높이에 맞춰 이동"과 "클릭 시 패널로 스크롤"은 각각 위치 계산 복잡도·화면 튐 때문에 미채택

### 🐛 트러블슈팅

<!-- /note troubleshoot 으로 추가 -->

### ⏭️ 남은 작업

- [ ] 브라우저에서 수동 확인 — 새 지원 건 등록 직후 목록에 바로 보이는지, 마감일 입력 후 반기가 옮겨가는지
- [ ] 커밋 (`/commit`) · PR (`/pr`)

### 📌 범위 밖 발견 (수정하지 않음)

- `features/auth/api/auth.api.ts:74,92` — `catch (error: any)` 2곳에서 ESLint `@typescript-eslint/no-explicit-any` 에러. 이번 변경과 무관한 기존 코드라 손대지 않음
- `clearAllAiKeys()`는 이제 앱 코드에서 호출되지 않음 (테스트에서만 사용). 공용 기기 대응이 다시 필요해질 때 붙일 수 있도록 남겨 둠

### Commit — 2026-08-12

- Message: `Fix:#85 자소서 마감일 없는 지원 건의 반기 귀속 수정`
- Issue: `#85`
- Jira: 미사용

**변경 요약**

- `getApplicationHalfId`가 자소서 일정이 없으면 `createdAt`의 반기를 쓰도록 변경. 등록 폼에 날짜 입력이 없어 모든 신규 건이 미분류로 시작했고, 미분류는 반기 선택지에서 제외돼 등록 직후 목록에서 사라졌다
- 저장 직후 `selectHalf(getCurrentHalfId())`로 방금 만든 건이 있는 반기로 화면 선택 이동
- `half.spec.ts`를 새 규칙에 맞게 수정하고 케이스 3개 추가

**결정 로그**

- 반기를 문서에 저장하지 않고 매번 계산한다 — 나중에 마감일을 채우면 그 반기로 자연히 이동(날짜 우선). 등록 반기 고정 방식은 미채택
- `createdAt`이 Invalid Date인 경우만 미분류로 남긴다. 그대로 환산하면 `NaN-HNaN` 식별자가 반기 선택지에 섞인다
- 반기 이동은 신규 등록 경로에만 건다 — 수정은 stages를 건드리지 않아 반기가 바뀌지 않는다

**다음 작업**

- 로그아웃 시 AI 키 자동 삭제 제거, 지원현황 UI 개선을 후속 커밋으로 분리

### Commit — 2026-08-12

- Message: `Fix:#85 로그아웃 시 AI 키 자동 삭제 제거`
- Issue: `#85`
- Jira: 미사용

**변경 요약**

- `logout()`에서 `clearAllAiKeys()` 호출과 import 제거. 해제는 AI 조사 설정 화면의 삭제 버튼으로 사용자가 직접 한다
- `clearAllAiKeys()` 함수 자체는 남기고, 왜 호출을 끊었는지와 공용 PC 트레이드오프를 주석에 기록

**결정 로그**

- 공용 PC에서 로그아웃 후에도 키가 남는 위험(직전 릴리스 `6eab0e5`가 막았던 시나리오)을 확인한 뒤, 개인 기기 사용을 전제로 감수하기로 결정
- 서버 보관·Functions 프록시 전환은 모두 미채택 — `useAiKey.ts`의 "키를 서버로 보내지 않는다" 전제는 유지
- 함수는 삭제하지 않고 남긴다. 공용 기기 대응이 다시 필요해지면 그 경로에 붙이면 된다

**다음 작업**

- 지원현황 UI 개선(sticky·기업 조사 바로가기·AI 결과 강조)을 다음 커밋으로

### Commit — 2026-08-12

- Message: `Feat:#85 지원 건 상세 패널 고정·기업 조사 바로가기·AI 결과 핵심구 강조`
- Issue: `#85`
- Jira: 미사용

**변경 요약**

- 지원 건 상세 패널을 sticky로 고정 (`pages/companies/index.tsx`) — 목록이 길어지면 아래쪽 행을 선택했을 때 패널이 화면 위로 밀려나 보이지 않던 문제
- 상세 패널에 해당 기업의 조사 노트 바로가기 추가 (`ApplicationDetailPanel` → `/companies/research/{companyId}`)
- AI 조사 결과의 핵심 문구를 서비스 색으로 강조 — `shared/lib/emphasis.ts` 파서 + `ResearchText` 컴포넌트 + `RESEARCH_SYSTEM_PROMPT` 규칙

**결정 로그**

- sticky는 `lg:` 에서만 건다. 모바일은 패널이 그리드 아래 세로 배치라 불필요하고, `self-start` 가 없으면 flex stretch 때문에 동작하지 않는다
- 라우팅은 페이지가 담당한다 — `ApplicationDetailPanel`은 `onOpenResearch` 콜백만 받고 `useNavigate`를 직접 쓰지 않는다. 기업 참조가 끊긴 건에는 `undefined`를 넘겨 버튼 자체를 감춘다
- 강조는 "AI가 `**…**` 표기 → FE가 그 구간만 색칠" 방식. 저장 스키마 변경이 없고 프롬프트가 한 곳이라 두 제공자에 동시 적용된다
- 짝이 맞지 않는 `**`는 강조하지 않고 글자 그대로 남긴다 — 닫는 표기를 빠뜨렸을 때 뒷부분이 통째로 물드는 것보다 원인이 드러나는 편이 낫다
- 문자열을 조각내 React 엘리먼트로 조립한다. AI가 만든 값이라 `dangerouslySetInnerHTML`은 쓰지 않는다
- `ResearchText`는 `p`가 아니라 `block span` — 미리보기에서 `label > span` 안쪽에 들어가기 때문

**다음 작업**

- PR 생성 후 브라우저에서 수동 확인
- 이미 저장된 조사 결과에는 `**` 마커가 없어 재조사해야 강조가 보임
