import { api } from "@/shared/api/client";
import type { ApiResponse } from "@/shared/api/api.type";
import type { AuthUser } from "@/entities/user/model/user.type";

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export async function signInWithGoogle() {
  // OAuth 로그인: 팝업 → Google 인증 → 서버에 인가코드 전달 → JWT 발급
  // TODO: Spring OAuth2 연동 시 구현
  // 1) Google OAuth 팝업 열기
  // 2) 인가코드 받기
  // 3) POST /api/auth/oauth/google { code } → JWT 반환
  throw new Error("Google OAuth는 Spring 백엔드 연동 후 구현 예정입니다.");
}

export async function signInWithGithub() {
  // TODO: Spring OAuth2 연동 시 구현
  throw new Error("GitHub OAuth는 Spring 백엔드 연동 후 구현 예정입니다.");
}

export async function signUpWithUsername(
  username: string,
  password: string,
  displayName?: string,
): Promise<AuthUser> {
  try {
    const { data } = await api.post<ApiResponse<AuthResponse>>(
      "/auth/signup",
      { username, password, displayName: displayName || username },
    );
    localStorage.setItem("accessToken", data.data.accessToken);
    return data.data.user;
  } catch (error: any) {
    const message = error.response?.data?.message;
    if (message) {
      throw new Error(message);
    }
    throw new Error("회원가입에 실패했습니다.");
  }
}

export async function signInWithUsername(
  username: string,
  password: string,
): Promise<AuthUser> {
  try {
    const { data } = await api.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      { username, password },
    );
    localStorage.setItem("accessToken", data.data.accessToken);
    return data.data.user;
  } catch (error: any) {
    const message = error.response?.data?.message;
    if (message) {
      throw new Error(message);
    }
    throw new Error("아이디 또는 비밀번호가 일치하지 않습니다.");
  }
}

export async function logout() {
  localStorage.removeItem("accessToken");
}

/** 저장된 토큰으로 현재 로그인된 사용자 정보 조회 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const { data } = await api.get<ApiResponse<AuthUser>>("/auth/me");
    return data.data;
  } catch {
    localStorage.removeItem("accessToken");
    return null;
  }
}
