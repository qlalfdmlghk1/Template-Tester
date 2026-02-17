package codenine.template_tester.dto;

public class AuthUserDto {
    private Long id;
    private String username;
    private String displayName;
    private String photoURL;
    private String email;

    public AuthUserDto(Long id, String username, String displayName, String photoURL, String email) {
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.photoURL = photoURL;
        this.email = email;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getPhotoURL() {
        return photoURL;
    }

    public String getEmail() {
        return email;
    }
}
