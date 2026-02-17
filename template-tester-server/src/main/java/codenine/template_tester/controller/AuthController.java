package codenine.template_tester.controller;

import codenine.template_tester.domain.User;
import codenine.template_tester.dto.*;
import codenine.template_tester.service.AuthService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    public ApiResponse<AuthResponse> signup(@RequestBody SignupRequest request) {
        return new ApiResponse<>(authService.signup(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@RequestBody LoginRequest request) {
        return new ApiResponse<>(authService.login(request));
    }

    @GetMapping("/me")
    public ApiResponse<AuthUserDto> me(@AuthenticationPrincipal User user) {
        AuthUserDto userDto = new AuthUserDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getPhotoURL(),
                user.getEmail()
        );
        return new ApiResponse<>(userDto);
    }
}
