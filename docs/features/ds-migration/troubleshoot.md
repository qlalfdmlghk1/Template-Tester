# ds-migration — 트러블슈팅

## [2026-11-22] DS 모달·토스트가 네비게이션·프로젝트 모달 아래로 깔림

**증상**

- DS `Modal`/`ConfirmModal`이 sticky 네비게이션 바 아래로 깔림 (#92에서 고친 것과 같은 증상)
- DS로 교체한 토스트가 프로젝트 자체 모달(AiKeyDialog 등)이 열려 있으면 그 뒤로 숨음

**원인**

- DS `styles.css`의 z-index: `.cds-modal`·`.cds-drawer` 100, `.cds-toaster` 200, `.cds-tooltip` 300
- 프로젝트 스케일(`tailwind.config.js`): dropdown 100, navbar 1000, modal 1100, toast 1200
- DS에 z-index 토큰(CSS 변수)이 없어 변수로 맞출 수 없음

**해결**

- `src/app/styles/index.css`에서 `html .cds-modal` 등으로 specificity를 올려 `theme("zIndex.*")` 값으로 덮어씀 (DS CSS가 뒤에 로드되므로 같은 specificity면 짐)
- 이 규칙은 `@layer base` **밖**에 둠 — `.cds-*`는 Tailwind content에 없는 클래스라 레이어 안에 두면 빌드에서 purge됨 (처음엔 레이어 안에 넣어 빌드 산출물에서 사라졌음)

**확인**

- `npm run build` 후 `dist/assets/*.css`에서 `html .cds-modal,html .cds-drawer{z-index:1100}` 등이 나오는지 확인

**후속**

- DS 레포에 z-index 토큰 추가 제안 → 생기면 이 오버라이드를 토큰 지정으로 교체
