# AD-Connect 도메인 가이드

> 이 문서는 프로젝트의 도메인 지식을 정리합니다.
> Claude와 대화 중 도메인 관련 내용이 나오면 이 문서에 반영됩니다.

---

## 1. 프로젝트 개요

**AD-Connect**는 인크로스의 내부 광고 솔루션을 통합하여 사용할 수 있는 통합 플랫폼입니다.

### 통합 방식

| 서비스 | 통합 방식 | 상태 |
|--------|----------|------|
| 리포트 자동화 | 직접 구현 | 구현 예정 |
| 애드포지션(AdPosition) | iframe → 직접 구현 | 통합 예정 |
| Buddy (캠페인 모니터링) | iframe | 연동 완료 |
| iScreen (게재 보고) | iframe | 연동 완료 |
| iReachBoard (효율 예측) | iframe | 연동 완료 |
| MediaArchive (매체자료) | iframe | 연동 완료 |
| Superset (대시보드) | iframe | 연동 완료 |

---

## 2. 도메인 용어 (Glossary)

| 용어 | 영문 | 설명 |
|------|------|------|
| 매체 | media | 광고를 게재하는 플랫폼 (예: 네이버, 구글, 메타 등) |
| 상품 | product | 매체에서 제공하는 광고 상품 (하나의 매체에 여러 상품 존재) |
| 애드포지션 | ad position | 광고가 노출되는 위치/지면 |
| 권한 그룹 | role group | 사용자 권한을 그룹 단위로 관리하는 체계 |
| 권한 레벨 | level | 권한의 계층 (1=최고 관리자, 4=제한된 사용자) |
| 2FA | two-factor auth | 2단계 인증 (OTP 기반) |
| 세션 터치 | touch session | 사용자 활동 시 세션 만료 시간 연장 |

---

## 3. 핵심 엔티티

### 3.1 사용자 (User)

| 필드 | 설명 |
|------|------|
| email | 로그인 ID (고유) |
| name | 사용자 이름 |
| org | 소속 조직 |
| department | 부서 |
| roleGroupId | 권한 그룹 ID |
| level | 권한 레벨 (1~4) |
| status | 상태 (ACTIVE/INACTIVE) |

### 3.2 권한 그룹 (Role)

| 필드 | 설명 |
|------|------|
| name | 권한 그룹명 |
| level | 권한 레벨 |
| memberCount | 소속 사용자 수 |
| menuPermissions | 메뉴별 권한 설정 |

### 3.3 매체 (Media)

| 필드 | 설명 |
|------|------|
| name | 매체명 |
| mediaTypes | 매체 유형 목록 |
| status | 상태 (ACTIVE/INACTIVE) |

### 3.4 상품 (Product)

| 필드 | 설명 |
|------|------|
| name | 상품명 |
| mediaName | 소속 매체명 |
| productTypes | 상품 유형 목록 |
| registered | 애드포지션 등록 여부 |
| status | 상태 (ACTIVE/INACTIVE) |

---

## 4. 비즈니스 규칙

### 4.1 사용자 관리

- 이메일은 고유해야 함 (등록 전 중복 확인 필수)
- 본인 계정은 삭제 불가
- 낮은 권한(높은 level) 사용자는 높은 권한(낮은 level) 사용자를 삭제 불가
- Level 4 사용자는 사용자 삭제 권한 없음

### 4.2 권한 체계

```
권한 레벨 계층:
Level 1 (최고) > Level 2 > Level 3 > Level 4 (최저)
```

- 권한은 `대메뉴 > 소메뉴 > 화면` 구조로 세분화
- 화면별로 CRUD + Download 권한 개별 설정 가능

### 4.3 인벤토리 관리

- 매체 : 상품 = 1 : N 관계
- 매체가 비활성화되면 해당 상품도 관리 불가
- 상품의 애드포지션 등록 상태 추적 필수

### 4.4 인증/세션

- 2FA 필수 (최초 로그인 시 등록)
- 비활동 시 세션 자동 만료
- iframe에서 `tokenRefresh` 메시지 수신 시 세션 연장
- 다른 기기 로그인 시 기존 세션 종료 가능

---

## 5. 상태 흐름

### 5.1 로그인 흐름

```
이메일/비밀번호 입력
    ↓
1차 인증 (POST /auth/login)
    ↓
[임시 비밀번호?] → 비밀번호 변경 화면
    ↓
[비밀번호 만료?] → 비밀번호 변경 화면
    ↓
[2FA 미등록?] → QR 코드 등록 화면
    ↓
2FA 인증 (POST /auth/2fa/authenticate)
    ↓
메인 페이지 (권한에 따른 첫 메뉴)
```

### 5.2 iframe 인증 흐름

```
Parent Window              iframe
     |                       |
     |←-- handshake ---------|
     |--- auth (token) ----->|
     |                       |
     |←-- tokenRefresh ------|  (사용자 활동 시)
     |--- touchSession() --->|
     |                       |
     |←-- authExpired -------|  (토큰 만료 시)
     |--- logout() --------->|
```

---

## 6. 외부 시스템 연동

| 시스템 | 용도 | 연동 방식 | 비고 |
|--------|------|----------|------|
| Buddy | 캠페인 상태/효율 모니터링 | iframe | `/ai-buddy/campaign-alert` |
| iScreen | 게재 현황 자동 리포트 | iframe | `/screenshot/#/screenshot` |
| iReachBoard | 효율 예측 시뮬레이션 | iframe | `/irb/#/reachSimulation` |
| AdPosition | 애드포지션 관리 | iframe | 직접 통합 예정 |
| MediaArchive | 매체 소개서 다운로드 | iframe | `/adposition/media-archive` |
| Superset | 매체 성과 대시보드 | iframe (게스트 토큰) | 별도 토큰 발급 |

### 환경별 Base URL

| 환경 | URL |
|------|-----|
| 개발 (로컬) | `http://localhost:5174` |
| 개발 (서버) | `https://dev.i-flow.kr` |
| 운영 | `https://i-flow.kr` |

---

## 7. 메뉴 구조

### 7.1 메인 메뉴

```
미디어 플래닝
  ├── 애드포지션 (/ad-position)
  ├── 매체자료 (/media-archive)
  └── 효율 예측 (/ireachboard)

캠페인 운영
  ├── 캠페인 리포트 (리포트 자동화 - 구현 예정)
  ├── 캠페인 모니터링 (/buddy)
  └── 게재 보고 (/iscreen)

관리
  ├── 사용자 관리 (/management/user)
  ├── 권한 그룹 관리 (/management/role)
  └── 매체/상품 관리 (/management/inventory)
```

### 7.2 메인 페이지 진입 우선순위

사용자가 접근 가능한 첫 번째 메뉴로 자동 리다이렉트:
1. 미디어 플래닝 > 애드포지션
2. 미디어 플래닝 > 매체자료
3. 미디어 플래닝 > 효율 예측
4. 캠페인 운영 > 캠페인 리포트
5. 캠페인 운영 > 캠페인 모니터링
6. 캠페인 운영 > 게재 보고

---

## 8. 관련 링크

- **Confluence 문서**: [AD 개발 문서](https://incross-platform.atlassian.net/wiki/spaces/AD/folder/48824376)

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-01-20 | 초기 도메인 가이드 작성 (프로젝트 개요, 용어, 엔티티, 비즈니스 규칙, 상태 흐름, 외부 연동, 메뉴 구조) |
