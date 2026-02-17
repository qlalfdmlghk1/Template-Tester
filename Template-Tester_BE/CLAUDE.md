# Template Tester Server

## 기술 스택
- Java 17 + Spring Boot 4.0.2
- Spring Security + JWT (jjwt 0.12.6)
- Spring Data JPA + MySQL 8 (port 3307)
- Gradle

## 프로젝트 구조

```
src/main/java/codenine/template_tester/
├── TemplateTesterApplication.java          # 메인 진입점
├── controller/
│   └── AuthController.java                 # 인증 API (signup, login, me)
├── service/
│   └── AuthService.java                    # 인증 비즈니스 로직
├── domain/
│   └── User.java                           # 유저 엔티티 (users 테이블)
├── repository/
│   └── UserRepository.java                 # 유저 DB 접근 (JPA)
├── dto/
│   ├── ApiResponse.java                    # 공통 응답 래퍼 { data: ... }
│   ├── SignupRequest.java                  # 회원가입 요청 DTO
│   ├── LoginRequest.java                   # 로그인 요청 DTO
│   ├── AuthResponse.java                   # 인증 응답 DTO (token + user)
│   └── AuthUserDto.java                    # 유저 정보 DTO (password 제외)
└── security/
    ├── SecurityConfig.java                 # Spring Security 설정 (CORS, 인증 규칙)
    ├── JwtTokenProvider.java               # JWT 생성/검증 유틸
    └── JwtAuthenticationFilter.java        # 요청마다 JWT 토큰 확인하는 필터
```

## API 엔드포인트

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/auth/signup | X | 회원가입 |
| POST | /api/auth/login | X | 로그인 |
| GET | /api/auth/me | O (Bearer) | 내 정보 조회 |

## 설정 파일
- `application.properties` - DB 접속 정보, JPA 설정
- `application-secret.properties` - DB 비밀번호, JWT secret/expiration (git 미추적)

## 실행 방법
1. Docker로 MySQL 컨테이너 실행 (port 3307)
2. `./gradlew bootRun`
3. 프론트엔드: `Template-Tester_FE/` 에서 `npm run dev` (port 5173)

## CORS
- 허용 origin: http://localhost:5173
