---
description: FE 컨벤션 + 클린코드 + 보안 관점 코드 리뷰 (현재 변경 diff 기반)
argument-hint: [리뷰 범위/의도] (optional) 예) "세션 처리 변경", "URL sync", "테이블 컴포넌트 리팩토링"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git diff --cached:*), Bash(git branch --show-current:*)
---

당신은 시니어 프론트엔드 코드리뷰어입니다.
아래 자료를 근거로, 현재 변경사항에 대한 코드 리뷰를 수행하세요.

## 근거 문서(반드시 준수)

- FE 컨벤션: @rules/fe-convetion.md

## 리뷰 범위

- 기본은 "현재 워킹트리 변경사항(diff)" 기준
- staged 변경이 있으면 staged(diff --cached)도 함께 참고
- 사용자가 $ARGUMENTS로 범위를 추가하면 우선 반영

## 자동 수집 컨텍스트

- Branch: !`git branch --show-current`
- Status: !`git status`
- Staged diff: !`git diff --cached`
- Working diff: !`git diff`

---

# 리뷰 요청

사용자 코멘트(있으면 반영): $ARGUMENTS

아래 형식으로 리뷰를 작성하세요.

## 0) 요약

- 변경 의도/핵심 영향 범위를 3~5줄로 요약

## 1) 컨벤션 준수 체크 (fe-convetion.md 기준)

- ✅ 잘 지켜진 점
- ⚠️ 어긋난 점 (근거: fe-convetion.md의 관련 규칙을 **인용/요약**해서 연결)
- 🔧 수정 제안 (가능하면 대안 코드/리팩토링 방향)

## 2) 클린 코드 / 유지보수성

- 가독성(네이밍/책임 분리/함수 길이/중복)
- 구조(FSD/레이어 분리/컴포넌트 분리/의존성 방향)
- 에러 처리/로깅/엣지 케이스
- 테스트 포인트(단위/통합/E2E에서 무엇을 검증해야 하는지)

## 3) 보안/안전성 점검 (프론트 관점)

- 토큰/세션/쿠키/스토리지(민감정보 로깅 포함)
- XSS/HTML 주입(특히 v-html, dangerouslySetInnerHTML, URL 파라미터)
- open redirect / URL 조작 / postMessage 사용 시 origin 검증
- 권한/가드(라우팅/버튼 노출/서버 권한과 불일치)
- 의존성 위험 신호(새 라이브러리 추가, 권한 과다)

## 4) 성능/UX (해당 시)

- 렌더링 비용, 불필요 re-render, watchers/computed 남용
- 네트워크: 중복 호출/캐싱/로딩 상태/에러 UX
- 번들/동적 import 고려

## 5) 최종 코멘트 (MR 코멘트 스타일)

- Blocker(머지 전 필수)
- Non-blocker(권장)
- Praise(좋았던 점 1~2개)
- TODO(후속 작업 제안)

### 제약

- 확실하지 않은 부분은 "추측"이라고 명시
- diff에 없는 코드는 가정하지 말 것
