package codenine.template_tester.service;

import codenine.template_tester.domain.User;
import codenine.template_tester.dto.*;
import codenine.template_tester.repository.UserRepository;
import codenine.template_tester.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public AuthResponse signup(SignupRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User(
                request.getUsername(),
                passwordEncoder.encode(request.getPassword()),
                request.getDisplayName()
        );

        user = userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user.getId());

        return new AuthResponse(token, toUserDto(user));
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        String token = jwtTokenProvider.generateToken(user.getId());

        return new AuthResponse(token, toUserDto(user));
    }

    private AuthUserDto toUserDto(User user) {
        return new AuthUserDto(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getPhotoURL(),
                user.getEmail()
        );
    }
}
