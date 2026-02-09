🚩 Issue Template
🗂️ 목차

이슈 요약 및 개요

구현 배경

구현 내용 상세

사용자 시나리오

데이터 흐름

상태 관리

주요 컴포넌트

API 명세

화면 스크린샷

테스트 및 검증

관련 링크 및 참고 자료

📝 이슈 요약 및 개요

이슈 번호: #[이슈 번호]

이슈 제목: [기능 브랜치 명] - [기능명] 구현 및 완료

작성자: [이름]

작성일: [YYYY-MM-DD]

🚀 구현 배경

문제 정의: [해결하고자 하는 비즈니스/기술 문제]

기능 목표: [구체적인 목표와 핵심 가치]

🛠️ 구현 내용 상세

1. 아키텍처 및 시스템 변경점

[추가/변경된 모듈, 서비스, 컴포넌트 설명]

2. 핵심 비즈니스 로직

[단계별 주요 로직 흐름 설명]

3. 주요 코드 변경 사항 및 파일 구조

변경된 파일/폴더 경로:

핵심 코드 스니펫:

// [핵심 로직 예시 코드]

👤 사용자 시나리오

시나리오 1: [사용자가 특정 기능을 사용하는 단계별 플로우]

시나리오 2: [다른 케이스의 사용자 흐름]

🔄 데이터 흐름
flowchart TD
User -->|요청| Frontend
Frontend -->|API 호출| Backend
Backend -->|DB Query| Database
Database -->|응답| Backend
Backend -->|JSON 응답| Frontend
Frontend -->|UI 반영| User

[데이터 입력 → 처리 → 응답 과정 설명]

[주요 상태 변화 및 검증 포인트]

📊 상태 관리

전역 상태(Store): [Pinia/Vuex 등, 어떤 전역 상태를 관리하는지]

지역 상태(Local): [컴포넌트 단위에서 관리되는 상태]

동기화 규칙: [API 응답, 캐싱, optimistic update 등 상태 동기화 방식]

에러 및 로딩 상태 처리: [에러 핸들링, 로딩 UI 전략]

예시:

// Pinia Store 예시
export const useUserStore = defineStore('user', {
state: () => ({
user: null,
loading: false,
error: null,
}),
actions: {
async fetchUser(id: string) {
this.loading = true
try {
this.user = await api.getUser(id)
} catch (e) {
this.error = e
} finally {
this.loading = false
}
}
}
})

🧩 주요 컴포넌트
컴포넌트명 경로 역할 비고
[컴포넌트명] [/src/components/... 경로] [기능/역할] [특이사항]
🔌 API 명세
API명 Method Endpoint Request Response 비고
[API 설명] [GET/POST/PUT/DELETE] [/api/... 경로] {} {} [인증 여부 등]
📸 화면 스크린샷

예시 1: [스크린샷 설명]

예시 2: [스크린샷 설명]

✅ 테스트 및 검증

테스트 시나리오: [상세 테스트 케이스]

테스트 결과: [실제 결과 및 예상 결과 비교]

🔗 관련 링크 및 참고 자료

관련 MR: [링크]

참고 문서: [디자인 시안 / API 명세서 / 기술 문서 등]
