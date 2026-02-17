## DB

1. docker에 db 설치 (docker 없을 시 docker 설치 먼저 하고, docker 키고 cmd에 아래 내용 붙여넣기)

```jsx
docker run --name template-sql \
-e MYSQL_ROOT_PASSWORD=0228 \
-e MYSQL_DATABASE=template_test \
-e MYSQL_USER=appuser \
-e MYSQL_PASSWORD=app0228 \
-p 3306:3306 \
-d mysql:8.0
```

1. dbeaver 설치 (디비 시각화)
    1. New Connection → MySQL 선택
    2. 아래 정보 입력
        
        📌 Host: localhost
        
        📌 Port: 3306
        
        📌 Database: template_test
        
        📌 Username: appuser
        
        📌 Password: app0228
        

1. DB password 설정 

/template_tester/src/main/resources/application-secret.properties 파일 생성, 아래 내용 추가
`spring.datasource.password=app0228`

## JAVA SPRING

1. 환경 버전
    1. java 17 설치
2. git clone

## 실행 방법

1. DB 키기
2. 서버 키기
3. 동작 확인 예시
    1. dbeaver 확인
        <img width="1750" height="1404" alt="image" src="https://github.com/user-attachments/assets/6c662af8-78ae-4a46-8511-efb0d32f1bfa" />

    2. cmd에서 삭제 요청

  
          `
          curl -X DELETE http://localhost:8080/members/3
          `

    3. Refresh 눌러 삭제 확인

        <img width="2240" height="1466" alt="image" src="https://github.com/user-attachments/assets/b023231e-512d-402a-887a-9114ea149ad1" />
