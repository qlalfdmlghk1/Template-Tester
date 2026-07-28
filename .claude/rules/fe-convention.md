# Frontend Convention

> 이 문서는 FE 컨벤션 변경 시 함께 업데이트합니다.

이 파일은 프로젝트의 프론트엔드 개발 컨벤션을 정의합니다.

---

## FSD (Feature-Sliced Design) 아키텍처

프로젝트는 FSD 아키텍처를 따릅니다.

### 레이어 구조

```
src/
├── app/                    # 앱 초기화 (진입점)
│   ├── providers/          # Provider 래퍼 (QueryClient, Router 등)
│   ├── router/             # 라우터 설정
│   ├── layouts/            # 레이아웃 컴포넌트
│   └── styles/             # 전역 스타일 (Tailwind base)
├── pages/                  # 페이지 컴포넌트
├── widgets/                # 복합 UI 블록 (여러 features 조합)
├── features/               # 기능 단위 (사용자 행동)
├── entities/               # 비즈니스 엔티티
│   └── {entity}/
│       ├── api/            # API 함수
│       ├── model/          # hooks, types, store
│       └── ui/             # 엔티티 관련 UI
└── shared/                 # 공유 자원
    ├── api/                # API 클라이언트, 공통 타입
    ├── lib/                # 유틸리티 함수
    └── ui/                 # 공통 UI 컴포넌트 (Atomic Design)
        ├── atoms/          # 최소 단위 (Button, Input, Icon 등)
        ├── molecules/      # atoms 조합 (FormField, SearchInput 등)
        ├── organisms/      # 복잡한 UI 블록 (필요시에만)
        └── theme/          # 디자인 토큰
```

### Import 방향 규칙 (강제)

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

---

## 상태 관리

### Zustand (클라이언트 상태)

- UI 상태, 사용자 설정, 앱 전역 상태에 사용
- 파일 위치: `entities/{entity}/model/*.store.ts` 또는 `shared/model/*.store.ts`

```typescript
// entities/user/model/user.store.ts
import { create } from 'zustand'
import type { User } from './user.type'

interface UserState {
  currentUser: User | null
  setUser: (user: User) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  setUser: (user) => set({ currentUser: user }),
  clearUser: () => set({ currentUser: null }),
}))
```

#### Zustand 미들웨어 활용 (권장)

```typescript
// persist 미들웨어로 localStorage 자동 동기화
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'settings-storage' }
  )
)
```

#### Selector 패턴 (강제)

불필요한 리렌더링을 방지하기 위해 반드시 selector를 사용합니다.

```typescript
// ✅ 필요한 상태만 구독
const currentUser = useUserStore((state) => state.currentUser)
const setUser = useUserStore((state) => state.setUser)

// ❌ 전체 store 구독 금지
const store = useUserStore()
```

### TanStack Query (서버 상태)

- API 데이터 캐싱, 자동 리페치, 낙관적 업데이트에 사용
- 파일 위치: `entities/{entity}/model/use{Entity}Query.ts`

#### Query Key Factory 패턴 (강제)

Query 키는 Factory 패턴으로 관리합니다.

```typescript
// entities/report/model/useReportQuery.ts
export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (params: GetReportsParams) => [...reportKeys.lists(), params] as const,
  summaries: () => [...reportKeys.all, 'summary'] as const,
  summary: (params: GetSummaryParams) => [...reportKeys.summaries(), params] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: number) => [...reportKeys.details(), id] as const,
}
```

#### Query Hook 패턴 (권장)

파라미터가 변경되면 자동으로 재조회됩니다.

```typescript
// entities/report/model/useReportQuery.ts
import { useQuery } from '@tanstack/react-query'
import { reportApi } from '../api/report.api'

export function useReportListQuery(params: GetReportsParams) {
  return useQuery({
    queryKey: reportKeys.list(params),
    queryFn: () => reportApi.getReportList(params),
    select: (response) => ({
      data: response.data as ReportListItem[],
      total: response.pageInfo?.total ?? 0,
    }),
  })
}
```

#### Query와 필터 Hook 조합 패턴 (권장)

페이지 로직은 필터 상태 관리와 Query를 조합한 커스텀 Hook으로 분리합니다.

```typescript
// entities/report/model/useReportList.ts
import { useState, useMemo, useEffect } from 'react'
import { useDebounce } from '@/shared/lib/useDebounce'
import { useReportListQuery, useReportSummaryQuery, useTeamsQuery } from './useReportQuery'

export function useReportList() {
  // ===== 필터 상태 =====
  const [dateRange, setDateRange] = useState<DateRange>({ start: defaultStart, end: defaultEnd })
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // 디바운스 처리
  const debouncedSearchKeyword = useDebounce(searchKeyword, 300)

  // ===== Query 파라미터 (memo) =====
  const listParams = useMemo<GetReportsParams>(() => ({
    startDate: formatDateParam(dateRange.start),
    endDate: formatDateParam(dateRange.end),
    teamIds: selectedTeams.length > 0 ? selectedTeams : undefined,
    q: debouncedSearchKeyword || undefined,
    page: currentPage,
    pageSize,
  }), [dateRange, selectedTeams, debouncedSearchKeyword, currentPage, pageSize])

  // ===== TanStack Query Hooks =====
  const { data: listData, isLoading, isFetching } = useReportListQuery(listParams)
  const { data: summaryData } = useReportSummaryQuery(summaryParams)
  const { data: teamsData } = useTeamsQuery()

  // ===== 파생 데이터 =====
  const reportData = listData?.data ?? []
  const totalCount = listData?.total ?? 0

  // 필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [dateRange, selectedTeams, debouncedSearchKeyword])

  return { dateRange, setDateRange, selectedTeams, setSelectedTeams, searchKeyword, setSearchKeyword, reportData, totalCount, isLoading, ... }
}
```

#### staleTime 설정 (권장)

자주 변하지 않는 데이터는 `staleTime`을 설정하여 불필요한 재요청을 방지합니다.

```typescript
export function useTeamsQuery() {
  return useQuery({
    queryKey: reportKeys.teams(),
    queryFn: () => reportApi.getTeams(),
    select: (response) => response.data as Team[],
    staleTime: 5 * 60 * 1000, // 5분간 신선하게 유지
  })
}
```

#### Mutation 예시

```typescript
// 생성 mutation
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    }
  })
}
```

### Zustand vs TanStack Query 사용 기준

| 상황                      | 사용 라이브러리           |
| ------------------------- | ------------------------- |
| API 응답 데이터 캐싱      | TanStack Query            |
| 서버 데이터 실시간 동기화 | TanStack Query            |
| 낙관적 업데이트           | TanStack Query            |
| 폼 상태 관리              | Zustand 또는 로컬 useState |
| 모달/사이드바 열림 상태   | Zustand 또는 로컬 useState |
| 사용자 인증 정보          | Zustand                   |
| 테마/언어 설정            | Zustand                   |

---

## 컴포넌트 개발

1. 적절한 FSD 레이어에 컴포넌트 생성
2. `shared/ui/`의 공통 컴포넌트는 Atomic Design 원칙 준수
3. 문서화를 위한 Storybook stories 추가
4. 일관된 스타일링을 위해 design tokens 사용

### 공통 컴포넌트 수정 시 필수 작업 (강제)

`shared/ui/` 컴포넌트 수정 시 반드시 함께 수정:

1. **Storybook 스토리 파일** (`*.stories.tsx`)
   - 새로운 prop 추가 시 → argTypes에 추가, 해당 prop 사용하는 스토리 추가
   - prop 삭제/변경 시 → 기존 스토리 업데이트
2. **테스트 파일** (`*.spec.ts`, `*.test.tsx`)
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

---

## 스타일링

- Tailwind CSS를 사용한 유틸리티 퍼스트 스타일링
- 디자인 토큰은 `tailwind.config.ts`에서 theme으로 관리
- **중요**: `tailwind.config.ts`에 정의된 커스텀 토큰만 사용

### Tailwind 설정 (Design Tokens)

디자인 토큰은 `tailwind.config.ts`의 `theme.extend`에서 관리합니다.

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'primary-blue': {
          100: '#E8F0FE', /* ... */ 900: '#0D2B6B',
        },
        'primary-purple': {
          100: '#F3E8FF', /* ... */ 900: '#3B0764',
        },
        // secondary, gray, neutral, green, yellow, error, info ...
      },
      fontFamily: {
        pretendard: ['Pretendard', 'sans-serif'],
      },
      fontSize: {
        12: ['12px', { lineHeight: '140%' }],
        14: ['14px', { lineHeight: '140%' }],
        16: ['16px', { lineHeight: '140%' }],
        18: ['18px', { lineHeight: '140%' }],
        20: ['20px', { lineHeight: '140%' }],
        24: ['24px', { lineHeight: '140%' }],
        28: ['28px', { lineHeight: '140%' }],
        32: ['32px', { lineHeight: '140%' }],
      },
      fontWeight: {
        regular: '400',
        semibold: '600',
        bold: '700',
      },
    },
  },
} satisfies Config
```

### Tailwind 사용 규칙 (강제)

```tsx
// ✅ 디자인 토큰 기반 클래스 사용
<button className="bg-primary-blue-500 text-white font-semibold text-14 px-4 py-2 rounded">
  확인
</button>

// ✅ 조건부 스타일링은 clsx/cn 유틸리티 사용
import { cn } from '@/shared/lib/cn'

<button className={cn(
  'px-4 py-2 rounded font-semibold text-14',
  variant === 'primary' && 'bg-primary-blue-500 text-white',
  variant === 'secondary' && 'bg-gray-100 text-gray-900',
  disabled && 'opacity-50 cursor-not-allowed'
)}>
  {children}
</button>

// ❌ 인라인 스타일 사용 금지 (예외: 동적 값만 허용)
<div style={{ color: 'red' }}>금지</div>

// ❌ 임의 값(arbitrary values) 남용 금지
<div className="w-[137px]">최소화</div>
```

### cn 유틸리티 (강제)

조건부 클래스 조합을 위해 `clsx` + `tailwind-merge` 기반 `cn` 유틸리티를 사용합니다.

```typescript
// shared/lib/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Design Token 빌드 프로세스

- `tailwind.config.ts`의 `theme.extend`에서 디자인 토큰 정의
- 필요 시 `src/shared/ui/theme/tokens/` 하위에 JSON 형식으로 원본 토큰 관리
- Style Dictionary로 빌드 후 Tailwind config에 반영

---

## 파일 네이밍 컨벤션

- **Components**: PascalCase 디렉토리와 PascalCase.tsx 파일
- **Atoms**: `shared/ui/atoms/{ComponentName}/{ComponentName}.tsx`
- **Molecules**: `shared/ui/molecules/{ComponentName}/{ComponentName}.tsx`
- **Hooks**: `use*.ts` (커스텀 Hook)
- **Stores**: `*.store.ts`
- **Types**: TypeScript 정의용 `*.type.ts`
- **APIs**: API 레이어 정의용 `*.api.ts`
- **Queries**: TanStack Query hooks용 `use*Query.ts`

---

## Import 전략

- src root에서 absolute imports를 위해 `@/` alias 사용
- barrel export (`index.ts`)를 통한 public API 노출
- 프로젝트 코드는 명시적 import 사용 (FSD 레이어 경계 명확화)

### Import 규칙 (강제)

React에서는 auto-import를 사용하지 않습니다. 모든 의존성을 명시적으로 import합니다.

```typescript
// ✅ React hooks
import { useState, useMemo, useEffect, useCallback } from 'react'

// ✅ React Router
import { useNavigate, useParams, useLocation } from 'react-router-dom'

// ✅ 외부 라이브러리
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { create } from 'zustand'

// ✅ 프로젝트 내부 (절대 경로)
import { AppButton } from '@/shared/ui/atoms/AppButton'
import { cn } from '@/shared/lib/cn'
import type { User } from '@/entities/user/model/user.type'
import { useUserStore } from '@/entities/user/model/user.store'
```

### Import 정렬 순서 (권장)

```typescript
// 1. React
import { useState, useEffect } from 'react'

// 2. 외부 라이브러리
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

// 3. 프로젝트 내부 (shared → entities → features → widgets)
import { cn } from '@/shared/lib/cn'
import { AppButton } from '@/shared/ui/atoms/AppButton'
import type { User } from '@/entities/user/model/user.type'

// 4. 상대 경로 (같은 슬라이스 내부)
import { useUserForm } from '../model/useUserForm'
```

---

## React 컨벤션

### 컴포넌트 작성 패턴 (강제)

```tsx
// entities/user/ui/UserCard/UserCard.tsx

// 1. Props 인터페이스 정의
interface UserCardProps {
  user: User
  onSelect?: (userId: number) => void
}

// 2. 함수 선언식 컴포넌트 (export는 named export)
export function UserCard({ user, onSelect }: UserCardProps) {
  // 3. 이벤트 핸들러
  const handleClick = () => {
    onSelect?.(user.id)
  }

  // 4. JSX 반환
  return (
    <div className="p-4 border rounded-lg" onClick={handleClick}>
      <h3 className="font-semibold text-16">{user.name}</h3>
      <p className="text-gray-500 text-14">{user.email}</p>
    </div>
  )
}
```

### 비즈니스 로직 분리 (강제)

- `pages/*` 또는 단일 컴포넌트 파일에 로직 집중 금지
- 컴포넌트에는 UI 렌더링과 이벤트 핸들러 연결만

| 유형                                | 위치                                                        |
| ----------------------------------- | ----------------------------------------------------------- |
| React hooks (상태/사이드이펙트 결합) | `entities/{entity}/model/` 또는 `features/{feature}/model/` |
| 순수 로직 (계산, 포맷, 매핑)        | `shared/lib/`                                               |
| 전역 상태                           | `*.store.ts` (Zustand)                                      |
| 서버 상태                           | `use*Query.ts` (TanStack Query)                             |

### 컴포넌트 책임 제한 (강제)

컴포넌트 파일은 다음 역할만 담당:

- Props 인터페이스 정의
- UI 렌더링 (JSX)
- 이벤트 핸들러 연결

**금지 사항:**

- 50줄 이상의 컴포넌트 로직
- API 호출 직접 작성
- 복잡한 데이터 변환/계산
- 여러 store 조합 로직

**분리 기준:**

- 로직이 길어지면 → `model/` 커스텀 Hook으로 추출
- 재사용 가능한 계산 → `shared/lib/`로 추출
- 상태 공유 필요 → `*.store.ts`로 이동
- 서버 데이터 → `use*Query.ts`로 이동

### Hook 네이밍 (강제)

- `use` prefix 필수
- 예: `useUsers`, `useUserDetail`, `useUsersQuery`

### React 성능 최적화 규칙 (권장)

```tsx
// ✅ 무거운 계산은 useMemo
const filteredUsers = useMemo(
  () => users.filter((u) => u.name.includes(keyword)),
  [users, keyword]
)

// ✅ 자식에게 전달하는 콜백은 useCallback
const handleSelect = useCallback((id: number) => {
  setSelectedId(id)
}, [])

// ✅ 리스트 렌더링 시 key prop 필수 (index 사용 금지)
{users.map((user) => (
  <UserCard key={user.id} user={user} />
))}

// ❌ 불필요한 useMemo/useCallback 남용 금지
// 단순한 값이나 컴포넌트 내부에서만 쓰는 함수는 그대로 사용
```

---

## TypeScript 컨벤션

### 함수 선언 방식 (강제)

| 위치                       | 권장                 |
| -------------------------- | -------------------- |
| `shared/lib/`, `**/model/` | function declaration |
| 컴포넌트                   | function declaration |
| 이벤트 핸들러, 콜백        | arrow function       |

### interface vs type (강제)

- 객체 구조 / 확장 목적 / Props → `interface`
- 유니온 / 튜플 / 조합 타입 → `type`

```typescript
// ✅ Props는 interface
interface AppButtonProps {
  variant: 'primary' | 'secondary' | 'outline'
  disabled?: boolean
  children: React.ReactNode
}

// ✅ 유니온은 type
type ButtonVariant = 'primary' | 'secondary' | 'outline'
```

### any 사용 금지 (강제)

- `any` 타입 사용 금지
- 예외 시: 사유 + TODO 주석 명시

---

## API 개발 가이드라인

- **Response Types**: `src/shared/api/api.type.ts`의 `SuccessResponse<T>`와 `ErrorResponse` 항상 사용
- **Type Safety**: API 응답용 specific data types 정의하고 `SuccessResponse<T>`와 함께 사용
- **일관된 구조**: 모든 API 함수는 `ApiResponse<T>` 타입 반환
- **Error Handling**: 적절한 error codes와 messages를 포함한 표준화된 error response 형식 사용

### API 구현 예시

```typescript
// entities/user/api/user.api.ts
import { $api } from '@/shared/api'
import type { ApiResponse } from '@/shared/api'
import type { User } from '../model/user.type'

export interface GetUsersParams {
  searchKeyword?: string
  searchType?: string
}

export async function getUsers(params?: GetUsersParams): Promise<ApiResponse<User[]>> {
  return $api<ApiResponse<User[]>>('/api/users', { params })
}

export async function getUserById(userId: number): Promise<ApiResponse<User>> {
  return $api<ApiResponse<User>>(`/api/users/${userId}`)
}
```

---

## Storybook

공통 컴포넌트와 디자인 토큰 문서화를 위해 Storybook을 사용합니다.

### 스토리 파일 위치 (FSD 구조)

스토리 파일은 해당 컴포넌트와 같은 디렉토리에 위치합니다.

```
src/
├── shared/ui/
│   └── AppButton/
│       ├── AppButton.tsx
│       └── AppButton.stories.tsx    # ✅ 컴포넌트 옆에 배치
├── entities/user/ui/
│   └── UserCard/
│       ├── UserCard.tsx
│       └── UserCard.stories.tsx
├── features/auth/ui/
│   └── LoginForm/
│       ├── LoginForm.tsx
│       └── LoginForm.stories.tsx
└── widgets/
    └── Header/
        ├── Header.tsx
        └── Header.stories.tsx
```

### 스토리 네이밍 컨벤션

```typescript
// shared/ui atoms
title: 'shared/ui/atoms/AppButton'

// shared/ui molecules
title: 'shared/ui/molecules/FormField'

// entities, features, widgets는 기존 FSD 규칙 유지
title: 'entities/user/ui/UserCard'
title: 'features/auth/ui/LoginForm'
title: 'widgets/Header'
```

### 스토리 작성 원칙

1. **autodocs 태그 필수**: 자동 문서화 활성화
2. **주요 상태 커버**: Default, Disabled, Loading, Error 등
3. **argTypes 정의**: props 설명 및 controls 설정
4. **예시 코드 명시**: `parameters.docs.source.code`로 사용 예시 제공

### 예시 코드 작성 (강제)

각 스토리에 `parameters.docs.source.code`를 사용하여 실제 사용 예시를 명시합니다.

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { AppButton } from './AppButton'

const meta: Meta<typeof AppButton> = {
  title: 'shared/ui/atoms/AppButton',
  component: AppButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline'],
      description: '버튼 스타일 변형'
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태'
    }
  }
}

export default meta
type Story = StoryObj<typeof AppButton>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: '확인'
  },
  parameters: {
    docs: {
      source: {
        code: `<AppButton variant="primary">확인</AppButton>`
      }
    }
  }
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '취소'
  },
  parameters: {
    docs: {
      source: {
        code: `<AppButton variant="secondary">취소</AppButton>`
      }
    }
  }
}

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: '비활성화'
  },
  parameters: {
    docs: {
      source: {
        code: `<AppButton variant="primary" disabled>비활성화</AppButton>`
      }
    }
  }
}

// 복잡한 사용 예시
export const WithIcon: Story = {
  args: {
    variant: 'primary'
  },
  render: (args) => (
    <AppButton {...args}>
      <span>🔍</span>
      검색
    </AppButton>
  ),
  parameters: {
    docs: {
      source: {
        code: `
<AppButton variant="primary">
  <span>🔍</span>
  검색
</AppButton>
        `.trim()
      }
    }
  }
}
```

### 실행 명령어

```bash
npm run storybook        # 개발 서버 (포트 6006)
npm run build-storybook  # 정적 빌드
npm run test:storybook   # 스토리 테스트
```

---

## 테스트 작성 가이드

### 테스트 작성 워크플로우 (강제)

테스트 코드 작성 요청 시 다음 순서를 반드시 따릅니다:

**1단계: 기능 분석**
- 테스트 대상 파일을 읽고 기능 파악
- 의존성 (import, store, API 등) 확인
- 핵심 로직과 분기 조건 식별

**2단계: 이해 확인 (질문)**
- 분석한 기능의 의도가 맞는지 사용자에게 확인
- 불명확한 비즈니스 로직에 대해 질문
- 테스트 범위 (어떤 케이스를 커버할지) 합의

**3단계: 테스트 작성**
- 합의된 범위에 맞춰 테스트 코드 작성
- Mock 전략, 테스트 구조 설명

**4단계: 검증 (필수)**
- 테스트 실행: `npx vitest run [파일경로]`
- 타입 체크: `npx tsc --noEmit --project tsconfig.app.json 2>&1 | grep "[파일명]"`
- IDE에서 타입 에러 없는지 확인 안내

### 테스트 작성 원칙 (강제)

**테스트 코드 작성 전 반드시:**

1. 해당 기능을 완전히 이해한 상태에서 작성
2. 명확하지 않은 부분이 있으면 사용자에게 질문하여 확인
3. 추측으로 테스트 작성 금지

### 단위 테스트 (Vitest)

**파일 위치**: 테스트 대상과 같은 디렉토리에 `*.spec.ts` 또는 `*.test.ts`

```
src/entities/user/model/
├── useUsers.ts
└── useUsers.spec.ts    # ✅ 같은 디렉토리
```

**테스트 대상 우선순위**:

1. 커스텀 Hooks (비즈니스 로직)
2. store (상태 관리)
3. utils (유틸리티 함수)
4. API 함수

**실행 명령어**:

```bash
npm run test           # 단위 테스트 실행
npm run test:watch     # watch 모드
npm run test:coverage  # 커버리지 리포트
```

**예시**:

```typescript
// entities/user/model/useUsers.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useUsers } from './useUsers'

describe('useUsers', () => {
  it('초기 상태에서 users는 빈 배열이어야 한다', () => {
    const { result } = renderHook(() => useUsers())
    expect(result.current.users).toEqual([])
  })

  it('fetchUsers 호출 시 loading이 true가 되어야 한다', async () => {
    const { result } = renderHook(() => useUsers())

    act(() => {
      result.current.fetchUsers()
    })
    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })
})
```

### E2E 테스트 (Playwright)

**파일 위치**: `e2e/` 디렉토리

```
e2e/
├── auth/
│   └── login.spec.ts
├── users/
│   └── user-list.spec.ts
└── fixtures/
    └── users.json
```

**테스트 작성 원칙**:

1. 사용자 시나리오 기반 작성
2. 핵심 플로우 우선 커버
3. 테스트 데이터는 fixtures로 관리
4. Page Object Model 패턴 권장

**실행 명령어**:

```bash
npm run test:e2e       # E2E 테스트 실행
npm run test:e2e:ui    # UI 모드로 실행
```

**예시**:

```typescript
// e2e/users/user-list.spec.ts
import { test, expect } from '@playwright/test'

test.describe('사용자 목록', () => {
  test('사용자 목록 페이지 접속 시 목록이 표시되어야 한다', async ({ page }) => {
    await page.goto('/users')

    await expect(page.getByRole('heading', { name: 'User List' })).toBeVisible()
    await expect(page.locator('.user-item')).toHaveCount.greaterThan(0)
  })

  test('사용자 클릭 시 상세 페이지로 이동해야 한다', async ({ page }) => {
    await page.goto('/users')

    await page.locator('.user-item').first().click()

    await expect(page).toHaveURL(/\/users\/\d+/)
    await expect(page.getByRole('heading', { name: /User Details/ })).toBeVisible()
  })
})
```

### 테스트 우선순위

| 우선순위 | 대상                                    | 도구               |
| -------- | --------------------------------------- | ------------------ |
| 1        | 비즈니스 로직 (커스텀 Hooks, stores)    | Vitest             |
| 2        | 유틸리티 함수                           | Vitest             |
| 3        | 핵심 사용자 플로우                      | Playwright         |
| 4        | 컴포넌트 렌더링/인터랙션                | Storybook + Vitest |
