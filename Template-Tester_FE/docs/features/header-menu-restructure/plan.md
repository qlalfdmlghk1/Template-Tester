# header-menu-restructure

| 항목         | 값                          |
| ------------ | --------------------------- |
| Jira         | (미사용)                                                       |
| GitHub Issue | [#64](https://github.com/qlalfdmlghk1/Template-Tester/issues/64) |
| Branch       | `refactor/64-header-menu-restructure`                          |
| 작성자       | WonSeo                      |
| 작성일       | 2026-07-26                  |
| Type         | Refactor                    |

## 🎯 작업 목적

학습 영역이 코딩테스트 외로 확장되면서 평평한 헤더 메뉴로는 정보 구조가 드러나지 않아, 영역 단위 그룹 내비게이션으로 재편한다.

## 📋 작업 범위

**포함 (In Scope)**

- [ ] 헤더 메뉴를 3개 영역(코딩테스트 / 이론 공부 / 기업 조사) 그룹 구조로 재편
- [ ] 메뉴 설정과 활성 경로 판정 로직을 `navMenu.ts`로 분리
- [ ] 그룹 드롭다운 컴포넌트 `NavMenu` 신규 작성 (호버·클릭 토글, 외부 클릭·ESC 닫기, ARIA 속성)
- [ ] 데일리 학습을 이론 공부 그룹 하위로 이동
- [ ] 개념 학습(`/theory`) 준비중 페이지 추가
- [ ] 기업 조사(`/companies`) 준비중 페이지 추가
- [ ] 활성 경로 판정에 경로 경계(`/`) 검사 적용

**제외 (Out of Scope)**

- 개념 학습·기업 조사 실제 기능 구현
- 모바일 전용 햄버거 메뉴 도입
- Navbar 우측 프로필 드롭다운 변경

<!-- 후속 이슈 섹션은 여기 아래로 추가 — v2 자동화 예정 -->

## 🖥️ 화면 단위 분해

| 화면명                | 요약                                   | 핵심 인터랙션                                            |
| --------------------- | -------------------------------------- | -------------------------------------------------------- |
| 헤더 내비게이션       | 3개 영역 그룹 메뉴 (드롭다운 2 + 링크 1) | 호버 시 드롭다운 오픈, 클릭 토글, 외부 클릭·ESC 닫기      |
| 개념 학습 (`/theory`) | 준비중 안내 화면                        | 진입만 가능, 액션 없음                                    |
| 기업 조사 (`/companies`) | 준비중 안내 화면                     | 진입만 가능, 액션 없음                                    |

## 🎨 디자인 분석

- **반응형 분기**: 기존 Navbar 브레이크포인트(`sm`/`md`) 유지. 그룹 라벨은 `text-xs sm:text-sm md:text-base`로 축소되며 3개 그룹이 한 줄에 유지됨
- **재사용 컴포넌트**: `shared/ui/molecules/PageHeader`, `shared/ui/molecules/AppFallback`, `shared/lib/cn`. 드롭다운 패널 스타일은 기존 Navbar 프로필 드롭다운과 동일 토큰 사용
- **신규 컴포넌트**: `widgets/Navbar/NavMenu.tsx` (그룹 메뉴 렌더링), `widgets/Navbar/model/navMenu.ts` (메뉴 설정 + 활성 판정)

## 🛠️ 접근 방식

메뉴 데이터를 `widgets/Navbar/model/navMenu.ts` 설정으로 분리하고 렌더링은 `NavMenu.tsx`로 위임한다. Navbar는 로고·테마 토글·프로필 드롭다운만 담당한다.
준비중 페이지는 신규 컴포넌트를 만들지 않고 기존 `AppFallback`(`type="empty"`, `hideButton`)과 `PageHeader`를 재사용한다.
라우트는 `vite-plugin-pages` 파일 라우팅이므로 `src/pages/theory/index.tsx`·`src/pages/companies/index.tsx` 생성만으로 자동 등록되며, `App.tsx`의 `processRoutes`가 `ProtectedRoute`로 감싼다.

## 🔗 참고 자료

| 유형       | 링크 |
| ---------- | ---- |
| Figma      | -    |
| Storybook  | -    |
| API 명세   | -    |
| Confluence | -    |

## ✅ 검증 계획

- 단위/통합 테스트: `isPathActive` / `isEntryActive` 대상 (미작성 — 추가 검토)
- 회귀 포인트: Navbar를 사용하는 전 페이지, 기존 `/daily` 진입 경로, 활성 하이라이트 판정 변경(`startsWith` → 경로 경계 검사)
- 수동 확인: 그룹 드롭다운 개폐(호버·클릭·ESC·외부 클릭), 활성 하이라이트, `/theory`·`/companies` 진입, 다크 모드, 모바일 폭에서 메뉴 줄바꿈 여부

## 🤔 주요 결정 사항

- [2026-07-26] 데일리 학습을 코딩테스트가 아닌 **이론 공부** 그룹 하위로 배치 (사용자 결정)
- [2026-07-26] 이론 공부·기업 조사는 메뉴 비활성 대신 **준비중 플레이스홀더 페이지**를 만들어 진입 가능하게 함 (사용자 결정)
- [2026-07-26] 그룹 UI는 2단 탭이 아닌 **호버/클릭 드롭다운**으로 결정 — 헤더 높이 증가 회피 (사용자 결정)
- [2026-07-26] "이론 공부" 그룹의 자체 랜딩 항목명을 `개념 학습`(`/theory`)으로 임시 지정 — 실제 기능 착수 시 재검토

<!-- /note 또는 수동으로 추가 -->
