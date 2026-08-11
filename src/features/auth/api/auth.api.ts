import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/shared/api/firebase";
import { clearSolveLogCache } from "@/entities/solve-log/api/solveLog.api";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Google 로그인 실패:", error);
    throw error;
  }
}

export async function signInWithGithub() {
  const provider = new GithubAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("GitHub 로그인 실패:", error);
    throw error;
  }
}

export async function logout() {
  try {
    await signOut(auth);
    // 다음 사용자에게 이전 사용자의 기록이 세션에 남지 않게 한다
    clearSolveLogCache();
    // AI 키는 여기서 지우지 않는다 — 로그아웃할 때마다 지우면 같은 브라우저에서도
    // 매번 다시 등록해야 했다. 해제는 AI 조사 설정 화면의 삭제 버튼으로 사용자가 직접 한다.
    // (트레이드오프: 공용 PC 에서는 로그아웃 후에도 키가 남는다)
  } catch (error) {
    console.error("로그아웃 실패:", error);
    throw error;
  }
}

const EMAIL_DOMAIN = "@template-tester.local";

function usernameToEmail(username: string): string {
  if (username.includes("@")) {
    return username;
  }
  return `${username}${EMAIL_DOMAIN}`;
}

export async function signUpWithUsername(
  username: string,
  password: string,
  displayName?: string,
) {
  try {
    const email = usernameToEmail(username);
    const result = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName && result.user) {
      await updateProfile(result.user, {
        displayName: displayName,
      });
    }

    return result.user;
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      throw new Error("이미 사용 중인 아이디입니다.");
    } else if (error.code === "auth/weak-password") {
      throw new Error("비밀번호는 최소 6자 이상이어야 합니다.");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("올바르지 않은 아이디 형식입니다.");
    }
    console.error("회원가입 실패:", error);
    throw error;
  }
}

export async function signInWithUsername(username: string, password: string) {
  try {
    const email = usernameToEmail(username);
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      throw new Error("존재하지 않는 아이디입니다.");
    } else if (error.code === "auth/wrong-password") {
      throw new Error("비밀번호가 일치하지 않습니다.");
    } else if (error.code === "auth/invalid-credential") {
      throw new Error("아이디 또는 비밀번호가 일치하지 않습니다.");
    }
    console.error("로그인 실패:", error);
    throw error;
  }
}
