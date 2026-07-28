---
name: test
description: 테스트 코드 작성 워크플로우. 기능 분석 → 이해 확인 → 테스트 작성 → 검증 단계를 순차적으로 진행합니다.
---

## Context (자동 수집)

테스트 대상 파일: $ARGUMENTS

---

## 워크플로우

### 1단계: 기능 분석

테스트 대상 파일을 분석합니다:

1. **파일 읽기**: 대상 파일의 전체 코드를 읽습니다
2. **의존성 파악**: import된 모듈, store, API 등을 확인합니다
3. **핵심 로직 식별**:
   - 함수/composable이 반환하는 값
   - 주요 분기 조건 (if/switch)
   - 상태 변화 (ref, computed)
   - 사이드 이펙트 (API 호출, toast 등)

**분석 결과를 다음 형식으로 정리:**

```
## 기능 분석 결과

### 파일 개요
- 파일: [경로]
- 타입: [composable / store / util / component]
- 목적: [한 줄 설명]

### 주요 기능
1. [기능1]: [설명]
2. [기능2]: [설명]

### 의존성
- Store: [목록]
- API: [목록]
- Utils: [목록]

### 테스트 포인트
- [ ] [테스트할 동작 1]
- [ ] [테스트할 동작 2]
```

---

### 2단계: 이해 확인

분석 결과를 사용자에게 공유하고 다음을 확인합니다:

**필수 질문:**
1. "위 분석이 맞나요? 수정하거나 추가할 부분이 있나요?"
2. "테스트 범위에서 제외하거나 추가할 케이스가 있나요?"

**선택 질문 (불명확한 경우):**
- 비즈니스 로직의 의도
- 에지 케이스 처리 방법
- Mock 범위 (어떤 의존성까지 Mock할지)

---

### 3단계: 테스트 작성

사용자 확인 후 테스트 코드를 작성합니다:

**파일 위치**: 테스트 대상과 같은 디렉토리에 `*.spec.ts`

**구조:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock 설정
vi.mock('@/path/to/dependency', () => ({
  // Mock 구현
}))

describe('[테스트 대상명]', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('[기능 그룹]', () => {
    it('[동작 설명]', () => {
      // Arrange - Act - Assert
    })
  })
})
```

**Mock 전략:**
- Pinia Store: `vi.mock`으로 전체 store mock
- API: `vi.mock`으로 API 모듈 mock
- Toast/Alert: `vi.mock`으로 알림 store mock

---

### 4단계: 검증 (필수)

테스트 작성 완료 후 반드시 다음을 실행합니다:

**1. 테스트 실행:**
```bash
npx vitest run [테스트파일경로]
```

**2. 타입 체크:**
```bash
npx tsc --noEmit --project tsconfig.app.json 2>&1 | grep "[파일명].spec.ts"
```

**3. 결과 보고:**
- 테스트 통과 여부
- 타입 에러 유무
- "IDE에서도 타입 에러가 없는지 확인해주세요" 안내

---

## 체크리스트

- [ ] 기능 분석 완료
- [ ] 사용자에게 이해 확인 받음
- [ ] 테스트 코드 작성
- [ ] 테스트 실행 성공
- [ ] 타입 체크 통과
- [ ] IDE 타입 에러 확인 안내
