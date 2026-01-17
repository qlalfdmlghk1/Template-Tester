// Firebase 데이터베이스 작업 함수들
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  GithubAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { db, auth } from "./config";
import type { GradingResult, Template, TemplateType, Category } from "../types";

// 제출 기록 타입
export interface Submission {
  id?: string; // Firestore에서 자동 생성
  userId: string; // 사용자 ID
  userEmail: string | null; // 사용자 이메일
  templateId: string;
  templateTitle: string;
  category: string;
  userCode: string;
  score: number; // 정확도 (0-100)
  totalLines: number;
  correctLines: number;
  createdAt: Date;
}

/**
 * 사용자의 코드 제출 기록을 Firestore에 저장
 */
export async function saveSubmission(
  templateId: string,
  templateTitle: string,
  category: string,
  userCode: string,
  gradingResult: GradingResult,
): Promise<string> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const submission: Omit<Submission, "id"> = {
      userId: user.uid,
      userEmail: user.email,
      templateId,
      templateTitle,
      category,
      userCode,
      score: gradingResult.accuracy,
      totalLines: gradingResult.totalLines,
      correctLines: gradingResult.correctLines,
      createdAt: new Date(),
    };

    // Firestore에 문서 추가
    const docRef = await addDoc(collection(db, "submissions"), submission);

    console.log("제출 기록 저장 완료:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("제출 기록 저장 실패:", error);
    throw error;
  }
}

/**
 * 최근 제출 기록 가져오기 (현재 로그인한 사용자의 기록만)
 */
export async function getRecentSubmissions(limitCount: number = 10): Promise<Submission[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    const q = query(
      collection(db, "submissions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    );

    const querySnapshot = await getDocs(q);

    const submissions: Submission[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      submissions.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        templateId: data.templateId,
        templateTitle: data.templateTitle,
        category: data.category,
        userCode: data.userCode,
        score: data.score,
        totalLines: data.totalLines,
        correctLines: data.correctLines,
        createdAt: data.createdAt.toDate(), // Timestamp를 Date로 변환
      });
    });

    return submissions;
  } catch (error) {
    console.error("제출 기록 조회 실패:", error);
    throw error;
  }
}

/**
 * 특정 카테고리의 제출 기록 가져오기 (현재 로그인한 사용자의 기록만)
 */
export async function getSubmissionsByCategory(category: string): Promise<Submission[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    const q = query(
      collection(db, "submissions"),
      where("userId", "==", user.uid),
      where("category", "==", category),
      orderBy("createdAt", "desc"),
    );

    const querySnapshot = await getDocs(q);

    const submissions: Submission[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      submissions.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        templateId: data.templateId,
        templateTitle: data.templateTitle,
        category: data.category,
        userCode: data.userCode,
        score: data.score,
        totalLines: data.totalLines,
        correctLines: data.correctLines,
        createdAt: data.createdAt.toDate(),
      });
    });

    return submissions;
  } catch (error) {
    console.error("카테고리별 제출 기록 조회 실패:", error);
    throw error;
  }
}

/**
 * 통계 데이터 계산
 */
export async function getStatistics() {
  try {
    const submissions = await getRecentSubmissions(100);

    if (submissions.length === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
      };
    }

    const scores = submissions.map((s) => s.score);
    const totalSubmissions = submissions.length;
    const averageScore = scores.reduce((a, b) => a + b, 0) / totalSubmissions;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);

    return {
      totalSubmissions,
      averageScore: Math.round(averageScore * 10) / 10, // 소수점 1자리
      bestScore,
      worstScore,
    };
  } catch (error) {
    console.error("통계 계산 실패:", error);
    throw error;
  }
}

// ==================== 인증 관련 함수 ====================

/**
 * Google 로그인
 */
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

/**
 * GitHub 로그인
 */
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

/**
 * 로그아웃
 */
export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("로그아웃 실패:", error);
    throw error;
  }
}

// ==================== 아이디/비밀번호 인증 ====================

const EMAIL_DOMAIN = "@template-tester.local";

/**
 * 아이디를 이메일 형식으로 변환
 */
function usernameToEmail(username: string): string {
  // 이미 이메일 형식이면 그대로 반환
  if (username.includes("@")) {
    return username;
  }
  // 아이디만 입력한 경우 도메인 추가
  return `${username}${EMAIL_DOMAIN}`;
}

/**
 * 아이디/비밀번호로 회원가입
 */
export async function signUpWithUsername(username: string, password: string, displayName?: string) {
  try {
    const email = usernameToEmail(username);
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // 사용자 프로필에 표시 이름 설정
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

/**
 * 아이디/비밀번호로 로그인
 */
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

// ==================== 사용자 템플릿 관리 ====================

/**
 * 사용자 템플릿 저장
 */
export async function saveUserTemplate(
  category: Category,
  title: string,
  description: string,
  answer: string,
  type: TemplateType,
): Promise<string> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const templateData = {
      userId: user.uid,
      userEmail: user.email,
      category,
      title,
      description,
      answer,
      type,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "userTemplates"), templateData);
    console.log("템플릿 저장 완료:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("템플릿 저장 실패:", error);
    throw error;
  }
}

/**
 * 현재 사용자의 템플릿 가져오기
 */
export async function getUserTemplates(): Promise<Template[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    const q = query(collection(db, "userTemplates"), where("userId", "==", user.uid));

    const querySnapshot = await getDocs(q);

    const templates: Template[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      templates.push({
        id: doc.id,
        category: data.category,
        title: data.title,
        description: data.description,
        answer: data.answer,
        type: data.type,
        userId: data.userId,
        createdAt: data.createdAt?.toDate(),
      });
    });

    // 클라이언트에서 정렬
    return templates.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error("사용자 템플릿 조회 실패:", error);
    throw error;
  }
}

/**
 * 특정 카테고리의 사용자 템플릿 가져오기
 */
export async function getUserTemplatesByCategory(category: Category): Promise<Template[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    const q = query(
      collection(db, "userTemplates"),
      where("userId", "==", user.uid),
      where("category", "==", category),
    );

    const querySnapshot = await getDocs(q);

    const templates: Template[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      templates.push({
        id: doc.id,
        category: data.category,
        title: data.title,
        description: data.description,
        answer: data.answer,
        type: data.type,
        userId: data.userId,
        createdAt: data.createdAt?.toDate(),
      });
    });

    // 클라이언트에서 정렬
    return templates.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error("카테고리별 사용자 템플릿 조회 실패:", error);
    throw error;
  }
}

/**
 * 사용자 템플릿 수정
 */
export async function updateUserTemplate(
  templateId: string,
  category: Category,
  title: string,
  description: string,
  answer: string,
  type: TemplateType,
): Promise<void> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const templateRef = doc(db, "userTemplates", templateId);
    await updateDoc(templateRef, {
      category,
      title,
      description,
      answer,
      type,
      updatedAt: new Date(),
    });

    console.log("템플릿 수정 완료:", templateId);
  } catch (error) {
    console.error("템플릿 수정 실패:", error);
    throw error;
  }
}

/**
 * 사용자 템플릿 삭제
 */
export async function deleteUserTemplate(templateId: string): Promise<void> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const templateRef = doc(db, "userTemplates", templateId);
    await deleteDoc(templateRef);

    console.log("템플릿 삭제 완료:", templateId);
  } catch (error) {
    console.error("템플릿 삭제 실패:", error);
    throw error;
  }
}

// ==================== 오답노트 관리 ====================

export interface WrongNote {
  id?: string;
  userId: string;
  userEmail: string | null;
  link: string;
  date: string;
  platform: string;
  grade: string;
  myCode: string;
  solution: string;
  comment: string;
  share: boolean;
  tags: string[];
  result: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 오답노트 저장
 */
export async function saveWrongNote(
  data: Omit<WrongNote, "id" | "userId" | "userEmail" | "createdAt">,
): Promise<string> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const wrongNoteData: Omit<WrongNote, "id"> = {
      ...data,
      userId: user.uid,
      userEmail: user.email,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "wrongNotes"), wrongNoteData);
    console.log("오답노트 저장 완료:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("오답노트 저장 실패:", error);
    throw error;
  }
}

/**
 * 현재 사용자의 오답노트 목록 가져오기
 */
export async function getWrongNotes(): Promise<WrongNote[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    const q = query(collection(db, "wrongNotes"), where("userId", "==", user.uid));

    const querySnapshot = await getDocs(q);

    const wrongNotes: WrongNote[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      wrongNotes.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        link: data.link,
        date: data.date,
        platform: data.platform,
        grade: data.grade,
        myCode: data.myCode,
        solution: data.solution,
        comment: data.comment,
        share: data.share,
        tags: data.tags,
        result: data.result,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      });
    });

    // 클라이언트에서 정렬 (복합 인덱스 없이 작동)
    return wrongNotes.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error("오답노트 조회 실패:", error);
    throw error;
  }
}

/**
 * 오답노트 수정
 */
export async function updateWrongNote(
  noteId: string,
  data: Omit<WrongNote, "id" | "userId" | "userEmail" | "createdAt">,
): Promise<void> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const noteRef = doc(db, "wrongNotes", noteId);
    await updateDoc(noteRef, {
      ...data,
      updatedAt: new Date(),
    });

    console.log("오답노트 수정 완료:", noteId);
  } catch (error) {
    console.error("오답노트 수정 실패:", error);
    throw error;
  }
}

/**
 * 오답노트 삭제
 */
export async function deleteWrongNote(noteId: string): Promise<void> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const noteRef = doc(db, "wrongNotes", noteId);
    await deleteDoc(noteRef);

    console.log("오답노트 삭제 완료:", noteId);
  } catch (error) {
    console.error("오답노트 삭제 실패:", error);
    throw error;
  }
}
