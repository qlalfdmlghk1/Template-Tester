package codenine.template_tester.dto;

public class AuthResponse {
    private String accessToken;
    private AuthUserDto user;

    public AuthResponse(String accessToken, AuthUserDto user) {
        this.accessToken = accessToken;
        this.user = user;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public AuthUserDto getUser() {
        return user;
    }
}
