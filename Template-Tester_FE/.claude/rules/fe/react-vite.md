---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.css"
  - "src/**/*.scss"
---

# Frontend Convention (Vite + React + TypeScript + FSD)

> 이 문서는 FE 컨벤션 변경 시 함께 업데이트합니다.
> **적용 대상**: Vite + React SPA(순수 클라이언트 렌더링) + TypeScript strict + FSD 아키텍처 프로젝트만 복사
> **범위 밖**: Storybook·테스트 세부 컨벤션은 본 문서에 포함하지 않습니다 (별도 룰 파일로 분리하면 여기에 링크 추가). SSR/RSC(Next.js 등)는 대상이 아닙니다.

이 파일은 프로젝트의 프론트엔드 개발 컨벤션을 정의합니다. Vue3 rule(`vue3-typescript.md`)의 React 판이며, FSD 레이어·Import 방향·Query Key Factory 등 아키텍처 규칙은 두 문서가 동일합니다.

## Quick Rules

> 대표 [MUST] 규칙만. 상세·예외·근거는 본문 참조. (Storybook·테스트 룰은 분리 파일 참조)

| 영역               | 수준     | 규칙                                                                                  |
| ------------------ | -------- | ------------------------------------------------------------------------------------- |
| Import 방향        | MUST     | 상위 → 하위 레이어만 import. 같은 레이어 슬라이스 간 import 금지. 순환 참조 금지      |
| Query Key Factory  | MUST     | TanStack Query 사용 시 `entities/{entity}/api/queryKeys.ts` 팩토리 패턴 적용           |
| 훅 규칙            | MUST     | 조건부/반복문 내 훅 호출 금지. 의존성 배열 정확히 명시. `useEffect` 남용 금지          |
| 리스트 key         | MUST NOT | 리스트 `key`에 배열 index 사용 금지 (안정적 고유 id 사용)                              |
| 공통 컴포넌트 수정 | MUST     | shared/ui 변경 시 사용처 영향도 분석 + 스토리 갱신 + 시각 회귀 검사                    |
| 파일 내 선언 순서  | MUST     | 훅 → 파생 계산 → 이벤트 핸들러 → early return → JSX 반환                               |
| 비즈니스 로직 분리 | MUST     | `pages/*` 또는 단일 `.tsx` 파일에 로직 집중 금지. 커스텀 훅/entities로 분리            |
| 컴포넌트 책임 제한 | MUST     | 컴포넌트 = 표현·렌더링. 비즈니스 로직·API 호출은 커스텀 훅                             |
| 훅 네이밍          | MUST     | `use` prefix 필수                                                                      |
| 함수 선언 방식     | MUST     | `shared/lib/`·`**/model/`은 function declaration, 컴포넌트 내부는 화살표 함수          |
| interface vs type  | MUST     | 객체 형태는 `interface`, union/intersection은 `type`                                   |
| any 사용           | MUST NOT | 명시적 `any` 사용 금지 (불가피하면 `unknown` + 좁히기)                                 |
| ESLint 검증        | MUST     | 작성/수정 완료 후 반드시 ESLint 실행 (`eslint-plugin-react-hooks` 규칙 포함)           |

## FSD (Feature-Sliced Design) 아키텍처

프로젝트는 FSD 아키텍처를 따릅니다. 레이어 구성은 Vue3 rule과 1:1 대응됩니다.

### 레이어 구조

```
src/
├── app/                    # 앱 초기화 (진입점)
│   ├── providers/          # Provider 구성 (QueryClientProvider, RouterProvider 등)
│   ├── router/             # React Router 라우트 정의
│   ├── layouts/            # 레이아웃 컴포넌트 (Outlet 기반)
│   └── styles/             # 전역 스타일 (tailwind.css, reset)
├── pages/                  # 라우트 단위 페이지 컴포넌트
├── widgets/                # 복합 UI 블록 (여러 features 조합)
├── features/               # 기능 단위 (사용자 행동)
├── entities/               # 비즈니스 엔티티
│   └── {entity}/
│       ├── api/            # API 함수 + queryKeys.ts
│       ├── model/          # 커스텀 훅, types, store
│       └── ui/             # 엔티티 관련 UI
└── shared/                 # 공유 자원
    ├── api/                # API 클라이언트, 공통 타입
    ├── config/             # 환경 변수, 상수
    ├── lib/                # 유틸리티 함수, 범용 훅
    └── ui/                 # 공통 UI 컴포넌트 (Atomic Design)
        ├── atoms/          # 최소 단위 (Button, Input, Icon 등)
        ├── molecules/      # atoms 조합 (FormField, SearchInput 등)
        ├── organisms/      # 복잡한 UI 블록 (필요시에만)
        └── theme/          # 디자인 토큰
```

### Import 방향 규칙 [MUST]

- 상위 레이어 → 하위 레이어 import만 허용
- 같은 레이어 내 슬라이스 간 import 금지
- 순환 참조 절대 금지

| From     | Import 허용                                     |
| -------- | ----------------------------------------------- |
| shared   | 어디서든 ✅                                     |
| entities | shared ✅ / features, pages, widgets, app ❌    |
| features | shared, entities ✅ / pages, widgets, app ❌    |
| widgets  | shared, entities, features ✅ / pages, app ❌   |
| pages    | shared, entities, features, widgets ✅ / app ❌ |
| app      | 모든 레이어 ✅                                  |

> 강제 수단: `eslint-plugin-boundaries` 또는 `import/no-restricted-paths`로 CI에서 검사합니다. 설정 여부는 `project.config.md` 참조.

### 라우팅 (React Router)

- 라우트 정의는 `app/router/`에 모으고, 페이지 컴포넌트는 `pages/`에만 둡니다.
- 라우트 단위 코드 스플리팅은 `lazy` + `Suspense` 또는 React Router `lazy` 옵션 사용 (권장).
- 라우트 파라미터는 페이지 컴포넌트에서 `useParams`로 읽고, 하위 컴포넌트에는 **props로 내려줍니다** (하위에서 라우터 훅 직접 호출 지양).

```typescript
// app/router/routes.tsx
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/app/layouts/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, lazy: () => import("@/pages/home/HomePage") },
      { path: "reports/:reportId", lazy: () => import("@/pages/report/ReportDetailPage") },
    ],
  },
]);
```

---

## 상태 관리

### Zustand (클라이언트 상태)

- UI 상태, 사용자 설정, 앱 전역 상태에 사용
- 파일 위치: `entities/{entity}/model/*.store.ts` 또는 `shared/model/*.store.ts`
- **셀렉터로 구독 범위를 좁혀** 불필요한 리렌더를 방지합니다 [MUST]

```typescript
// entities/user/model/user.store.ts
import { create } from "zustand";
import type { User } from "./user.type";

interface UserState {
  currentUser: User | null;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  setUser: (user) => set({ currentUser: user }),
}));
```

```typescript
// ✅ 셀렉터로 필요한 값만 구독 (currentUser 변경 시에만 리렌더)
const currentUser = useUserStore((state) => state.currentUser);

// ❌ store 전체 구독 — 어떤 필드가 바뀌어도 리렌더
const { currentUser } = useUserStore();
```

> 객체·배열을 반환하는 셀렉터는 매 렌더마다 새 참조를 만들어 무한 리렌더를 유발할 수 있습니다. 값 단위로 나눠 구독하거나 `useShallow`를 사용하세요.

### TanStack Query (서버 상태)

- API 데이터 캐싱, 자동 리페치, 낙관적 업데이트에 사용
- 파일 위치: `entities/{entity}/model/use{Entity}Query.ts`, 키는 `entities/{entity}/api/queryKeys.ts`

#### Query Key Factory 패턴 [MUST]

Query 키는 Factory 패턴으로 관리합니다. 문자열 배열을 인라인으로 직접 작성하지 않습니다.

```typescript
// entities/report/api/queryKeys.ts
import type { GetReportsParams, GetSummaryParams } from "./report.api";

export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  list: (params: GetReportsParams) => [...reportKeys.lists(), params] as const,
  summaries: () => [...reportKeys.all, "summary"] as const,
  summary: (params: GetSummaryParams) =>
    [...reportKeys.summaries(), params] as const,
  details: () => [...reportKeys.all, "detail"] as const,
  detail: (id: number) => [...reportKeys.details(), id] as const,
  teams: () => [...reportKeys.all, "teams"] as const,
};
```

#### 상태 기반 Query 파라미터 (권장)

React에서는 파라미터가 **상태(state)** 이므로, 상태가 바뀌면 queryKey가 바뀌고 자동으로 재조회됩니다. Vue의 `computed` 파라미터에 대응하는 개념입니다.

```typescript
// entities/report/model/useReportQuery.ts
import { useQuery } from "@tanstack/react-query";
import { reportApi } from "../api/report.api";
import { reportKeys } from "../api/queryKeys";
import type { GetReportsParams } from "../api/report.api";

export function useReportListQuery(params: GetReportsParams) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => reportApi.getReportList(params),
    select: (response) => ({
      data: response.data,
      total: response.pageInfo?.total ?? 0,
    }),
  });
}
```

> `params`는 객체지만 TanStack Query가 queryKey를 **구조적으로 해시**하므로 참조가 매번 바뀌어도 안전합니다. 다만 파라미터 객체는 렌더 중 안정적으로 만들기 위해 `useMemo`를 쓰는 것이 유용합니다(아래 참조).

#### Query와 필터 커스텀 훅 조합 패턴 (권장)

페이지 로직은 필터 상태 관리와 Query를 조합한 **커스텀 훅**으로 분리합니다. (Vue3 rule의 `useReportList` composable 대응)

```typescript
// entities/report/model/useReportList.ts
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "@/shared/lib/useDebounce";
import { formatDateParam } from "@/shared/lib/date";
import {
  useReportListQuery,
  useReportSummaryQuery,
  useTeamsQuery,
} from "./useReportQuery";
import { DEFAULT_PAGE_SIZE } from "../config";
import type { DateRange, GetReportsParams } from "../api/report.api";

export function useReportList() {
  // ===== 필터 상태 =====
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const debouncedKeyword = useDebounce(searchKeyword, 300);

  // ===== Query 파라미터 (useMemo — computed 대응) =====
  const listParams = useMemo<GetReportsParams>(
    () => ({
      startDate: formatDateParam(dateRange.start),
      endDate: formatDateParam(dateRange.end),
      teamIds: selectedTeams.length > 0 ? selectedTeams : undefined,
      q: debouncedKeyword || undefined,
      page: currentPage,
      pageSize,
    }),
    [dateRange, selectedTeams, debouncedKeyword, currentPage, pageSize],
  );

  // ===== TanStack Query Hooks =====
  const { data: listData, isLoading, isFetching } = useReportListQuery(listParams);
  const { data: summaryData } = useReportSummaryQuery(listParams);
  const { data: teams } = useTeamsQuery();

  // ===== 파생 데이터 (렌더 중 계산 — useEffect 금지) =====
  const reportData = listData?.data ?? [];
  const totalCount = listData?.total ?? 0;

  // 필터 변경 시 페이지 리셋 (실제 외부 동기화가 아니라 상태 파생이므로 setter에서 처리 권장)
  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, selectedTeams, debouncedKeyword]);

  return {
    dateRange,
    setDateRange,
    selectedTeams,
    setSelectedTeams,
    searchKeyword,
    setSearchKeyword,
    currentPage,
    setCurrentPage,
    reportData,
    totalCount,
    teams,
    isLoading,
    isFetching,
  };
}
```

#### staleTime 설정 (권장)

자주 변하지 않는 데이터는 `staleTime`을 설정하여 불필요한 재요청을 방지합니다.

```typescript
export function useTeamsQuery() {
  return useQuery({
    queryKey: reportKeys.teams(),
    queryFn: () => reportApi.getTeams(),
    select: (response) => response.data,
    staleTime: 5 * 60 * 1000, // 5분간 신선하게 유지
  });
}
```

#### Mutation 예시

```typescript
// entities/user/model/useUserMutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "../api/user.api";
import { userKeys } from "../api/queryKeys";

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
```

> `invalidateQueries`에는 **팩토리 함수 결과**를 넘깁니다. 리스트만 무효화하려면 `userKeys.lists()`, 엔티티 전체면 `userKeys.all`.

### Zustand vs TanStack Query 사용 기준

| 상황                      | 사용 라이브러리              |
| ------------------------- | ---------------------------- |
| API 응답 데이터 캐싱      | TanStack Query               |
| 서버 데이터 실시간 동기화 | TanStack Query               |
| 낙관적 업데이트           | TanStack Query               |
| 페이지네이션 / 무한 스크롤 | TanStack Query               |
| 폼 상태 관리              | 로컬 `useState` (또는 폼 라이브러리) |
| 모달/사이드바 열림 상태   | 로컬 `useState` 또는 Zustand |
| 사용자 인증 정보          | Zustand                      |
| 테마/언어 설정            | Zustand                      |

**금지 [MUST NOT]**: 서버에서 받은 데이터를 Zustand store에 복사해 보관하지 않습니다. 캐시 이중화로 정합성이 깨집니다. 서버 데이터는 TanStack Query 캐시가 단일 소스입니다.

---

## 컴포넌트 개발

1. 적절한 FSD 레이어에 컴포넌트 생성
2. `shared/ui/`의 공통 컴포넌트는 Atomic Design 원칙 준수
3. 문서화를 위한 Storybook stories 추가
4. 일관된 스타일링을 위해 design tokens 사용

### 공통 컴포넌트 수정 시 필수 작업 [MUST]

`shared/ui/` 컴포넌트 수정 시 반드시 함께 수정:

1. **사용처 영향도 분석** — 해당 컴포넌트를 import하는 모든 지점 확인 후 변경
2. **Storybook 스토리 파일** (`*.stories.tsx`)
   - 새로운 prop 추가 시 → argTypes에 추가, 해당 prop 사용하는 스토리 추가
   - prop 삭제/변경 시 → 기존 스토리 업데이트
3. **테스트 파일** (`*.test.tsx`)
   - 테스트가 존재하는 경우 → 영향받는 테스트 케이스 수정
   - 새로운 기능 추가 시 → 테스트 케이스 추가 권장

### Atomic Design (shared/ui/ 전용)

`shared/ui/`에만 Atomic Design을 적용합니다. `entities/`, `features/`, `widgets/`는 FSD 규칙을 따릅니다.

| 분류      | 설명                                      | 예시                                                            |
| --------- | ----------------------------------------- | --------------------------------------------------------------- |
| atoms     | 더 이상 분해할 수 없는 최소 UI 단위       | AppButton, AppInput, AppIcon, AppBadge                          |
| molecules | 2개 이상의 atoms 조합                     | FormField (Label + Input + Error), SearchInput (Input + Button) |
| organisms | molecules/atoms 조합으로 독립적 기능 수행 | (필요시에만 생성)                                               |

**분류 원칙:**

- 도메인 로직이 포함되면 `entities/` 또는 `features/`로 이동
- 재사용 가능성이 낮으면 해당 레이어에 직접 배치
- atoms 내부에서 다른 atoms import 가능 (예: AppIcon을 사용하는 AppButton)

### 컴포넌트 파일 내 선언 순서 [MUST]

Vue SFC 블록 순서에 대응하는 규칙입니다. 컴포넌트 함수 본문은 아래 순서를 지킵니다.

```tsx
// features/report-filter/ui/ReportFilter.tsx
interface ReportFilterProps {
  teams: Team[];
  onApply: (filter: ReportFilter) => void;
}

export function ReportFilter({ teams, onApply }: ReportFilterProps) {
  // 1. 훅 호출 (라우터 → store → query → 로컬 state → ref → effect)
  const { reportId } = useParams();
  const currentUser = useUserStore((s) => s.currentUser);
  const { data, isLoading } = useReportListQuery(params);
  const [keyword, setKeyword] = useState("");

  // 2. 파생 계산 (렌더 중 계산 — useEffect + setState 금지)
  const filteredTeams = teams.filter((team) => team.name.includes(keyword));

  // 3. 이벤트 핸들러 (arrow function)
  const handleApply = () => {
    onApply({ keyword, teamIds: selectedIds });
  };

  // 4. early return (loading / error / empty)
  if (isLoading) return <AppSpinner />;

  // 5. JSX 반환
  return <form onSubmit={handleApply}>{/* ... */}</form>;
}
```

파일 단위 순서: `import` → 타입/`interface` → 상수 → 컴포넌트 → (필요 시) 파일 로컬 서브컴포넌트.

---

## React 훅 규칙

### 훅 규칙 [MUST]

| 규칙                       | 내용                                                                            |
| -------------------------- | ------------------------------------------------------------------------------- |
| 조건부 호출 금지           | `if` / `for` / early return **이후**에 훅 호출 금지. 항상 컴포넌트 최상단에서 호출 |
| 호출 위치                  | 훅은 컴포넌트 또는 다른 커스텀 훅 안에서만 호출 (일반 함수·이벤트 핸들러 내부 금지) |
| 의존성 배열 정확히         | `useEffect` / `useMemo` / `useCallback`의 의존성은 빠짐없이 명시. 린트 경고 억제 금지 |
| `useEffect` 남용 금지      | 파생 상태는 **렌더 중 계산**. effect는 외부 시스템 동기화에만 사용                |

### `useEffect`를 쓰지 말아야 하는 경우

`useEffect`는 **외부 시스템(DOM 이벤트, 타이머, 구독, 애널리틱스, 브라우저 API)과 동기화할 때만** 사용합니다.

```tsx
// ❌ 파생 상태를 effect + state로 계산 — 렌더가 2번 돌고 버그 온상
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ 렌더 중 계산
const fullName = `${firstName} ${lastName}`;
```

```tsx
// ❌ 데이터 페칭을 직접 effect로 구현 (경쟁 상태·캐싱·에러 처리 누락)
useEffect(() => {
  fetch("/api/users").then((r) => r.json()).then(setUsers);
}, []);

// ✅ TanStack Query 사용
const { data: users } = useUsersQuery();
```

```tsx
// ❌ 이벤트에 대한 반응을 effect로 처리
useEffect(() => {
  if (submitted) sendAnalytics();
}, [submitted]);

// ✅ 이벤트 핸들러에서 직접 처리
const handleSubmit = () => {
  sendAnalytics();
  mutate(form);
};
```

**effect가 정당한 경우**: `window` 이벤트 구독, `IntersectionObserver`, WebSocket 연결, 외부 라이브러리 인스턴스 생성/정리, 페이지 진입 로그. 이때 **cleanup 함수 반환 [MUST]**.

### 리렌더 최적화 (권장)

**기본 원칙: 먼저 측정하고, 문제가 확인된 곳만 메모이제이션합니다.** 무분별한 `memo`/`useMemo`/`useCallback`은 코드 가독성과 메모리를 희생하면서 이득이 없습니다.

| 도구          | 써야 할 때                                                                     | 쓰지 말아야 할 때                                             |
| ------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `memo`        | 리스트의 반복 아이템 등 **자주 리렌더되는데 props가 거의 안 바뀌는** 컴포넌트   | 부모가 거의 리렌더되지 않는 컴포넌트. props에 매번 새 객체/함수가 들어가는 컴포넌트(효과 없음) |
| `useMemo`     | 실제로 **비용이 큰 계산**(대량 정렬·필터링). `memo` 자식에 넘길 객체/배열 참조 안정화. TanStack Query 파라미터 객체 | 단순 산술·문자열 조합·짧은 배열 map. 원시값 반환              |
| `useCallback` | `memo` 자식에 넘기는 콜백. 다른 훅의 **의존성 배열에 들어가는** 함수            | 일반 DOM 요소(`<button onClick>`)에 바로 넘기는 핸들러         |

```tsx
// ❌ 불필요한 메모이제이션 — 비용보다 오버헤드가 큼
const total = useMemo(() => price * quantity, [price, quantity]);
const handleClick = useCallback(() => setOpen(true), []); // <button>에 직접 전달

// ✅ 그냥 계산
const total = price * quantity;
const handleClick = () => setOpen(true);

// ✅ 정당한 useMemo — 큰 배열 정렬
const sortedRows = useMemo(
  () => [...rows].sort((a, b) => b.updatedAt - a.updatedAt),
  [rows],
);
```

**메모이제이션보다 먼저 시도할 것 (권장)**:

- 상태를 **필요한 컴포넌트 가까이로 내리기** (state colocation)
- 잦게 바뀌는 상태를 별도 컴포넌트로 분리
- Zustand 셀렉터로 구독 범위 좁히기
- `children`으로 넘겨 리렌더 대상에서 제외

> React Compiler를 도입한 프로젝트는 수동 메모이제이션을 원칙적으로 제거합니다. 도입 여부는 `project.config.md` 참조.

### 리스트 key 규칙 [MUST]

- 리스트 `key`에는 **안정적이고 고유한 id**를 사용합니다.
- **배열 index 사용 금지** — 정렬/삽입/삭제 시 상태가 잘못된 항목에 남습니다.
- id가 없으면 서버에 id 추가를 요청하거나, 생성 시점에 클라이언트에서 안정적 id를 부여합니다.

```tsx
// ❌ index를 key로 사용
{reports.map((report, i) => <ReportRow key={i} report={report} />)}

// ❌ 렌더마다 새 값 — 매번 언마운트/마운트
{reports.map((report) => <ReportRow key={crypto.randomUUID()} report={report} />)}

// ✅ 안정적 고유 id
{reports.map((report) => <ReportRow key={report.id} report={report} />)}
```

### 커스텀 훅으로 분리 [MUST]

- `pages/*` 또는 단일 `.tsx` 파일에 로직 집중 금지
- 컴포넌트에는 UI 이벤트 처리만

| 유형                             | 위치                                                       |
| -------------------------------- | ---------------------------------------------------------- |
| React 상태/라이프사이클 결합 로직 | `entities/{entity}/model/` 또는 `features/{feature}/model/` |
| 순수 로직 (계산, 포맷, 매핑)     | `shared/lib/`                                              |
| 전역 상태                        | `*.store.ts` (Zustand)                                     |
| 서버 상태                        | `use*Query.ts` (TanStack Query)                            |
| 범용 훅 (useDebounce 등)         | `shared/lib/`                                              |

### 컴포넌트 책임 제한 [MUST]

`.tsx` 컴포넌트는 다음 역할만 담당:

- props 정의
- UI 렌더링
- 이벤트 핸들러 연결

**금지 사항:**

- 50줄 이상의 훅/로직 블록 (JSX 제외)
- API 호출 직접 작성 (`fetch`/`axios` 직접 호출)
- 복잡한 데이터 변환/계산
- 여러 store 조합 로직

**분리 기준:**

- 로직이 길어지면 → `model/` 커스텀 훅으로 추출
- 재사용 가능한 계산 → `shared/lib/`로 추출
- 상태 공유 필요 → `*.store.ts`로 이동
- 서버 데이터 → `use*Query.ts`로 이동

### 훅 네이밍 [MUST]

- `use` prefix 필수
- 예: `useUsers`, `useUserDetail`, `useUsersQuery`, `useCreateUserMutation`
- 훅이 아닌 함수에 `use` prefix 사용 금지 (린트가 훅 규칙을 잘못 적용함)

---

## 스타일링

### Tailwind CSS vs CSS Modules(SCSS) 선택 기준

**Tailwind CSS를 기본**으로 하고, 아래 기준에 해당할 때만 CSS Modules(SCSS)를 사용합니다.

| 상황                                         | 선택                    | 이유                                          |
| -------------------------------------------- | ----------------------- | --------------------------------------------- |
| 레이아웃·간격·타이포 등 일반 스타일          | **Tailwind**            | 기본값. 클래스 조합으로 충분                  |
| 단순 조건부 스타일 (2~3개 분기)              | **Tailwind** + `clsx`   | 가독성 유지 가능                              |
| 복잡한 상태 기반 스타일 (variant × size × state 조합) | **CSS Modules(SCSS)** 또는 CVA | 클래스 문자열이 길어져 유지보수 불가          |
| 디자인 토큰 변수 연동이 필요한 컴포넌트      | **CSS Modules(SCSS)**   | SCSS 변수/믹스인으로 토큰 직접 참조           |
| 중첩 셀렉터·의사요소가 많은 복잡한 컴포넌트  | **CSS Modules(SCSS)**   | Tailwind arbitrary variant 남용 방지          |
| 애니메이션 keyframes                         | **CSS Modules(SCSS)**   | 선언적 정의가 명확                            |
| 전역 리셋·베이스 스타일                      | `app/styles/`           | Tailwind `@layer base`                        |

**공통 규칙:**

- 하나의 컴포넌트에서 Tailwind와 CSS Modules를 섞을 수 있으나, **같은 속성을 두 곳에서 지정하지 않습니다** (우선순위 충돌).
- 조건부 클래스 조합은 `clsx`/`cn` 유틸 사용. 템플릿 리터럴로 클래스명을 동적 생성하지 않습니다 (Tailwind가 정적 추출 실패).

```tsx
// ❌ Tailwind가 클래스를 추출하지 못함
<div className={`text-${color}-500 p-${size}`} />

// ✅ 완전한 클래스명을 맵에 정의
const colorClass = { primary: "text-blue-500", danger: "text-red-500" } as const;
<div className={cn("p-4", colorClass[color], isActive && "ring-2")} />
```

```scss
// features/report-card/ui/ReportCard.module.scss
@use "@/shared/ui/theme/tokens/build/scss/variables" as tokens;

.card {
  border-radius: tokens.$radius-md;
  background: tokens.$color-surface-default;

  &--selected {
    border-color: tokens.$color-border-emphasis;
  }
}
```

```tsx
import styles from "./ReportCard.module.scss";
<div className={cn(styles.card, isSelected && styles["card--selected"])} />;
```

### 디자인 토큰

- **프로젝트의 토큰 빌드 산출물에 실제로 존재하는 변수만 사용**합니다 (예: `src/shared/ui/theme/tokens/build/scss/_variables.scss` — 위치는 프로젝트마다 다르므로 `project.config.md` / 프로젝트 CLAUDE.md 참조). 변수명을 추측해서 쓰지 않고 파일을 먼저 확인합니다.
- Tailwind는 `tailwind.config`의 `theme.extend`에 **동일 토큰을 연결**하여 Tailwind 클래스와 SCSS 변수가 같은 값을 가리키도록 합니다.
- 구체 토큰 목록(색상·타이포 스케일 등)은 **프로젝트마다 다르므로 팀 표준 rule에 두지 않습니다.**
- 필요한 토큰이 없으면 raw 값(`#3B82F6`, `13px` 등)을 하드코딩하지 않고, 디자인 시스템 담당과 협의해 tokens JSON에 추가 후 빌드합니다.
- Tailwind arbitrary value(`w-[137px]`, `text-[#123456]`)는 원칙적으로 금지 — 토큰으로 승격시킵니다.

---

## 파일 네이밍 컨벤션

- **Components**: PascalCase 디렉토리와 PascalCase `.tsx` 파일 — `shared/ui/atoms/AppButton/AppButton.tsx`
- **Hooks**: `use*.ts` (camelCase, `use` prefix)
- **Stores**: `*.store.ts`
- **Types**: `*.type.ts`
- **APIs**: `*.api.ts`
- **Query Keys**: `queryKeys.ts`
- **Queries**: `use*Query.ts` / `use*Mutation.ts`
- **Styles**: `{ComponentName}.module.scss`
- **Barrel export**: 슬라이스 public API는 `index.ts`

---

## Import 전략

- src root에서 absolute imports를 위해 `@/` alias 사용 (`vite.config.ts` + `tsconfig.json` `paths` 동시 설정 [MUST])
- barrel export (`index.ts`)를 통한 public API 노출 — 슬라이스 내부 파일을 외부에서 직접 import하지 않습니다
- React 프로젝트에는 auto-import를 사용하지 않습니다. **모든 심볼은 명시적 import** (FSD 레이어 경계 명확화)
- 타입은 `import type { ... }`으로 분리 [MUST] — 번들에서 제거 보장
- import 정렬: 외부 라이브러리 → FSD 하위 레이어 역순(`app` → `shared`) → 상대경로 (`/organize-imports` 스킬 사용)

```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { AppButton } from "@/shared/ui/atoms/AppButton";
import type { ApiResponse } from "@/shared/api";
import { useUserStore } from "@/entities/user";

import { formatReport } from "../lib/formatReport";
import type { Report } from "./report.type";
```

---

## TypeScript 컨벤션

### 함수 선언 방식 [MUST]

| 위치                       | 권장                                      |
| -------------------------- | ----------------------------------------- |
| `shared/lib/`, `**/model/` | function declaration                      |
| 컴포넌트 정의              | function declaration (`export function X`) |
| 컴포넌트 내부 핸들러       | arrow function                            |

### interface vs type [MUST]

- 객체 구조 / 확장 목적 → `interface` (props 타입 포함)
- 유니온 / 튜플 / 조합 타입 → `type`

```typescript
interface ButtonProps {
  variant: ButtonVariant;
  onClick: () => void;
}

type ButtonVariant = "primary" | "secondary" | "ghost";
```

### any 사용 금지 [MUST NOT]

- `any` 타입 사용 금지 → `unknown` 으로 받고 좁히기
- 예외 시: 사유 + TODO 주석 명시
- `as` 단언 남용 금지. 특히 `as unknown as T` 금지

### React 타입 규칙

- props 타입은 `interface {Component}Props`로 컴포넌트 파일 상단에 정의
- `React.FC` 사용 금지 — 함수 선언 + props 타입 명시
- 이벤트 핸들러는 React 제공 타입 사용 (`React.ChangeEvent<HTMLInputElement>` 등)
- `children`은 `React.ReactNode`

---

## API 개발 가이드라인

- **Response Types**: `src/shared/api/api.type.ts`의 `SuccessResponse<T>`와 `ErrorResponse` 항상 사용
- **Type Safety**: API 응답용 specific data types 정의하고 `SuccessResponse<T>`와 함께 사용
- **일관된 구조**: 모든 API 함수는 `ApiResponse<T>` 타입 반환
- **Error Handling**: 적절한 error codes와 messages를 포함한 표준화된 error response 형식 사용
- **호출 위치 [MUST]**: API 함수는 `entities/{entity}/api/`에만 정의하고, 컴포넌트에서 직접 `fetch`/`axios`를 호출하지 않습니다
- **환경 변수**: Vite는 `import.meta.env.VITE_*`만 클라이언트에 노출됩니다. 시크릿을 `VITE_` prefix로 두지 않습니다 [MUST NOT]

### API 구현 예시

```typescript
// entities/user/api/user.api.ts
import { $api } from "@/shared/api";
import type { ApiResponse } from "@/shared/api";
import type { User } from "../model/user.type";

export interface GetUsersParams {
  searchKeyword?: string;
  searchType?: string;
}

export async function getUsers(
  params?: GetUsersParams,
): Promise<ApiResponse<User[]>> {
  return $api<ApiResponse<User[]>>("/api/users", { params });
}

export async function getUserById(userId: number): Promise<ApiResponse<User>> {
  return $api<ApiResponse<User>>(`/api/users/${userId}`);
}
```

---

## 금지 사항

| 금지                                              | 대안                                                     |
| ------------------------------------------------- | -------------------------------------------------------- |
| 조건문/반복문 내 훅 호출                          | 컴포넌트 최상단에서 무조건 호출                          |
| `useEffect`로 파생 상태 계산                      | 렌더 중 계산 (필요 시 `useMemo`)                         |
| `useEffect`로 직접 데이터 페칭                    | TanStack Query                                           |
| 의존성 배열 린트 경고 억제 (`eslint-disable`)     | 의존성 정확히 명시하거나 로직 재구성                     |
| 리스트 `key`에 index / 랜덤값 사용                | 안정적 고유 id                                           |
| 서버 데이터를 Zustand store에 복사                | TanStack Query 캐시를 단일 소스로                        |
| Zustand store 전체 구독                           | 셀렉터로 필요한 값만 구독                                |
| 컴포넌트에서 `fetch`/`axios` 직접 호출            | `entities/{entity}/api/` 함수 + `use*Query` 훅           |
| 무분별한 `memo`/`useMemo`/`useCallback`           | 측정 후 필요한 곳만                                      |
| `React.FC` 사용                                   | `export function X(props: XProps)`                       |
| Tailwind 클래스명 동적 문자열 조합                | 완전한 클래스명 맵 + `clsx`/`cn`                         |
| Tailwind arbitrary value 남용 (`text-[#123456]`)  | 디자인 토큰으로 승격                                     |
| 슬라이스 내부 파일 직접 import                    | barrel(`index.ts`) public API                            |
| 명시적 `any`                                      | `unknown` + 타입 좁히기                                  |
| 시크릿을 `VITE_` 환경 변수로 노출                 | 서버 측 처리 / BFF                                       |
| `dangerouslySetInnerHTML` 무검증 사용             | 텍스트 렌더링 또는 sanitize 후 사용                      |

---

## 보안

보안 판정 기준의 **정본**은 `.claude/rules/security-compliance.md`입니다. 충돌 시 정본을 따릅니다.

React/Vite 관점 요약:

- **개인정보 마스킹**: 마스킹은 **서버/API 책임**입니다. 권한 없는 사용자 응답에 원문이 실려오면 위반. 클라이언트에서 원문을 받아 마스킹하는 패턴은 위반 후보로 escalate합니다.
- **개인정보 원문 표시**: 렌더링 지점에 권한 가드(역할 분기)를 적용합니다. SPA 라우트 가드만으로는 불충분 — 서버 권한 검증이 전제입니다.
- **개인정보처리방침 링크**: 푸터/로그인 화면에서 다른 약관 링크 대비 시각적으로 강조(디자인 시스템 강조 토큰 우선).
- **시크릿 노출 금지**: Vite 번들은 전부 공개됩니다. `VITE_` 환경 변수·토큰·API 키를 클라이언트 코드에 두지 않습니다.
- **XSS**: `dangerouslySetInnerHTML` 사용 금지 (불가피하면 sanitize + 리뷰 필수).

---

## ESLint 검증 [MUST]

코드 작성/수정 완료 후 **반드시 ESLint를 실행**하여 오류가 없는지 확인합니다.

### 필수 플러그인/규칙

| 플러그인/규칙                            | 목적                                        |
| ---------------------------------------- | ------------------------------------------- |
| `eslint-plugin-react-hooks`              | 훅 규칙 강제 (필수)                         |
| `react-hooks/rules-of-hooks`: `error`    | 조건부 훅 호출 차단 [MUST]                  |
| `react-hooks/exhaustive-deps`: `warn` 이상 | 의존성 배열 누락 감지 [MUST]              |
| `@typescript-eslint/no-explicit-any`     | any 금지                                    |
| `eslint-plugin-boundaries` (또는 `import/no-restricted-paths`) | FSD Import 방향 강제 |

### 검증 시점

- 새 파일 생성 후
- 기존 파일 수정 완료 후
- 커밋 전

### 검증 명령어

```bash
# 특정 파일 검사
npx eslint <파일경로>

# 특정 디렉토리 검사
npx eslint "src/**/*.{ts,tsx}"

# 자동 수정 가능한 오류 수정
npx eslint --fix <파일경로>

# 타입 검사 (커밋 게이트 — 명령은 project.config.md 참조)
npx tsc --noEmit
```

### 흔한 오류 유형

| 오류                                                   | 원인                     | 해결                             |
| ------------------------------------------------------ | ------------------------ | -------------------------------- |
| `React Hook ... called conditionally`                   | 조건부 훅 호출           | 최상단으로 이동                  |
| `React Hook useEffect has a missing dependency: 'x'`    | 의존성 누락              | 의존성 추가 또는 로직 재구성     |
| `'x' is defined but never used`                         | 변수/파라미터 미사용     | 제거하거나 `_x`로 명시적 무시    |
| `Unexpected any`                                        | any 타입 사용            | 구체적 타입으로 변경             |
| `Missing "key" prop for element in iterator`            | 리스트 key 누락          | 안정적 고유 id를 key로 지정      |

### 예외 처리

의도적으로 무시해야 하는 경우 (사유 주석 필수):

```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _intentionallyUnused = value;
```

> `react-hooks/exhaustive-deps`의 `eslint-disable`은 **원칙적으로 금지**합니다 [MUST NOT]. 의존성이 문제라면 로직 구조가 잘못된 신호입니다.
