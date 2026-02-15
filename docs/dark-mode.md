# 다크모드 구현 가이드

## 아키텍처 개요

CSS 변수 기반의 테마 시스템으로, `data-theme` 속성 전환만으로 사이트 전체 컬러가 변경됩니다.

```
[data-theme="light"] ──→ :root CSS 변수 (라이트 팔레트)
[data-theme="dark"]  ──→ :root CSS 변수 (다크 팔레트)
        ↓
  Tailwind 컬러 ──→ var(--color-*) 참조
        ↓
  모든 컴포넌트에 자동 적용
```

---

## 핵심 파일

| 파일 | 역할 |
|------|------|
| `src/app/styles/index.css` | Light/Dark 테마 CSS 변수 정의 |
| `tailwind.config.js` | Tailwind 컬러를 CSS 변수로 매핑 |
| `src/shared/lib/useTheme.ts` | 테마 상태 관리 훅 |
| `index.html` | FOUC 방지 인라인 스크립트 |

---

## 1. CSS 변수 시스템 (`index.css`)

모든 컬러는 `:root`와 `[data-theme="dark"]`에 CSS 변수로 정의됩니다.

### 시맨틱 컬러

| 변수 | Light | Dark | 용도 |
|------|-------|------|------|
| `--color-primary` | `#3B82F6` | `#60A5FA` | 주요 액센트 |
| `--color-background` | `#F9FAFB` | `#0F172A` | 페이지 배경 |
| `--color-surface` | `#FFFFFF` | `#1E293B` | 카드/컨테이너 배경 |
| `--color-text` | `#1F2937` | `#F1F5F9` | 기본 텍스트 |
| `--color-text-secondary` | `#6B7280` | `#94A3B8` | 보조 텍스트 |
| `--color-border` | `#E5E7EB` | `#334155` | 테두리 |
| `--color-white` | `#FFFFFF` | `#1E293B` | bg-white 대응 |

### 팔레트 컬러 (blue, green, red, gray, purple, yellow)

다크 모드에서 팔레트는 **역전**됩니다:
- Light: `50`(밝음) → `900`(어두움)
- Dark: `50`(어두움) → `900`(밝음)

이유: `bg-blue-50`이 라이트에서 "아주 연한 파란 배경"이라면, 다크에서도 "아주 연한(=어두운 톤의) 파란 배경"이어야 하므로 대응값이 역전됩니다.

---

## 2. Tailwind 설정 (`tailwind.config.js`)

```js
darkMode: ['selector', '[data-theme="dark"]'],
theme: {
  extend: {
    colors: {
      primary: 'var(--color-primary)',
      blue: {
        500: 'var(--color-blue-500)',
        // ...
      },
      // ...
    }
  }
}
```

- **모든 Tailwind 컬러가 CSS 변수를 참조**하므로, 기존 `bg-blue-500`, `text-primary` 등의 클래스가 테마 전환 시 자동으로 변경됩니다.
- `bg-white`도 `var(--color-white)`로 매핑되어 다크모드에서 `surface` 색상으로 변합니다.

---

## 3. useTheme 훅 (`src/shared/lib/useTheme.ts`)

```tsx
import { useTheme } from "@/shared/lib/useTheme";

const { theme, isDark, toggleTheme, setTheme } = useTheme();
```

### API

| 반환값 | 타입 | 설명 |
|--------|------|------|
| `theme` | `"light" \| "dark"` | 현재 테마 |
| `isDark` | `boolean` | 다크모드 여부 |
| `toggleTheme` | `() => void` | 테마 전환 |
| `setTheme` | `(theme) => void` | 테마 직접 설정 |

### 동작 방식

1. **초기값 결정**: `localStorage("theme")` → 없으면 `prefers-color-scheme` 미디어 쿼리
2. **적용**: `document.documentElement.setAttribute("data-theme", theme)`
3. **영속화**: `localStorage`에 저장
4. **시스템 감지**: OS 다크모드 변경 시 자동 반영 (사용자가 직접 설정한 적 없을 때만)

---

## 4. FOUC 방지 (`index.html`)

```html
<script>
  (function(){
    var t = localStorage.getItem('theme');
    if (!t) t = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  })();
</script>
```

React 로드 전에 `data-theme`을 설정하여 **화면 깜빡임(FOUC)을 방지**합니다.

---

## 새 컬러 추가 시

1. `index.css`의 `:root`와 `[data-theme="dark"]` 양쪽에 변수 추가
2. `tailwind.config.js`의 `colors`에 매핑 추가
3. 컴포넌트에서 Tailwind 클래스로 사용

```css
/* index.css */
:root { --color-accent: #FF6B6B; }
[data-theme="dark"] { --color-accent: #FF8E8E; }
```

```js
// tailwind.config.js
colors: { accent: 'var(--color-accent)' }
```

```tsx
// 컴포넌트에서
<div className="text-accent">...</div>
```

---

## 컴포넌트 작성 시 주의사항

### DO

```tsx
// 시맨틱 토큰 사용
className="bg-surface text-text border-border"
className="bg-blue-50 text-blue-700"
```

### DON'T

```tsx
// 하드코딩 hex 금지
className="bg-[#FFFFFF]"
style={{ color: '#1F2937' }}

// 단, 브랜드 컬러(Google, GitHub 로고)나
// 항상 고정되어야 하는 색(Monaco Editor 배경)은 예외
```

---

## 토글 버튼 위치

Navbar 우측에 해(라이트)/달(다크) 아이콘 버튼으로 배치되어 있습니다.

```
[로고] [메뉴들...]        [🌙/☀️] [사용자 프로필]
```
