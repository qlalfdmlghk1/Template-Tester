// Firebase 데이터베이스 작업 함수들
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
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
import type { UserProfile } from "../types/user.types";
import type { Friendship, FriendInfo } from "../types/friendship.types";

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
export async function getRecentSubmissions(
  limitCount: number = 10,
): Promise<Submission[]> {
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
export async function getSubmissionsByCategory(
  category: string,
): Promise<Submission[]> {
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
export async function signUpWithUsername(
  username: string,
  password: string,
  displayName?: string,
) {
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

    const q = query(
      collection(db, "userTemplates"),
      where("userId", "==", user.uid),
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
    console.error("사용자 템플릿 조회 실패:", error);
    throw error;
  }
}

/**
 * 특정 카테고리의 사용자 템플릿 가져오기
 */
export async function getUserTemplatesByCategory(
  category: Category,
): Promise<Template[]> {
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
  title: string;
  link: string;
  language: string;
  category: string;
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

    const q = query(
      collection(db, "wrongNotes"),
      where("userId", "==", user.uid),
    );

    const querySnapshot = await getDocs(q);

    const wrongNotes: WrongNote[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      wrongNotes.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        title: data.title || "",
        link: data.link,
        language: data.language || "",
        date: data.date,
        platform: data.platform,
        category: data.category,
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

// ==================== 사용자 프로필 관리 ====================

/**
 * 사용자 프로필을 Firestore에 저장/업데이트
 * 로그인 시 호출하여 검색 가능하게 함
 */
export async function syncUserProfile(): Promise<void> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // 기존 사용자: 업데이트
      await updateDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        updatedAt: new Date(),
      });
    } else {
      // 신규 사용자: 생성
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
      };
      await setDoc(userRef, userProfile);
    }

    console.log("사용자 프로필 동기화 완료:", user.uid);
  } catch (error) {
    console.error("사용자 프로필 동기화 실패:", error);
    throw error;
  }
}

/**
 * 닉네임 또는 이메일로 사용자 검색 (친구 추가용)
 */
export async function searchUserByDisplayName(
  searchQuery: string,
): Promise<UserProfile[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    // displayName 또는 이메일이 검색어를 포함하는 사용자 찾기
    // Firestore는 부분 일치 검색을 지원하지 않으므로, 전체 사용자를 가져와서 필터링
    const q = query(collection(db, "users"));
    const querySnapshot = await getDocs(q);

    const searchLower = searchQuery.toLowerCase();
    const users: UserProfile[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // 자기 자신 제외
      if (data.uid === user.uid) return;

      // displayName 또는 이메일이 검색어를 포함하는 경우
      const matchesDisplayName = data.displayName?.toLowerCase().includes(searchLower);
      const matchesEmail = data.email?.toLowerCase().includes(searchLower);

      if (matchesDisplayName || matchesEmail) {
        users.push({
          uid: data.uid,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          createdAt: data.createdAt?.toDate(),
        });
      }
    });

    return users;
  } catch (error) {
    console.error("사용자 검색 실패:", error);
    throw error;
  }
}

// ==================== 친구 관계 관리 ====================

/**
 * 두 사용자 간의 친구 관계 상태 확인
 */
export async function getFriendshipStatus(
  otherUserId: string,
): Promise<Friendship | null> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return null;
    }

    // 내가 보낸 요청 확인
    const sentQuery = query(
      collection(db, "friendships"),
      where("requesterId", "==", user.uid),
      where("receiverId", "==", otherUserId),
    );
    const sentSnapshot = await getDocs(sentQuery);

    if (!sentSnapshot.empty) {
      const doc = sentSnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Friendship;
    }

    // 내가 받은 요청 확인
    const receivedQuery = query(
      collection(db, "friendships"),
      where("requesterId", "==", otherUserId),
      where("receiverId", "==", user.uid),
    );
    const receivedSnapshot = await getDocs(receivedQuery);

    if (!receivedSnapshot.empty) {
      const doc = receivedSnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Friendship;
    }

    return null;
  } catch (error) {
    console.error("친구 관계 확인 실패:", error);
    throw error;
  }
}

/**
 * 친구 요청 보내기
 */
export async function sendFriendRequest(receiverUserId: string): Promise<string> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    if (user.uid === receiverUserId) {
      throw new Error("자기 자신에게 친구 요청을 보낼 수 없습니다.");
    }

    // 이미 친구 관계가 있는지 확인
    const existingFriendship = await getFriendshipStatus(receiverUserId);
    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        throw new Error("이미 친구입니다.");
      } else if (existingFriendship.status === "pending") {
        throw new Error("이미 친구 요청이 진행 중입니다.");
      }
    }

    // 상대방 정보 가져오기
    const receiverRef = doc(db, "users", receiverUserId);
    const receiverDoc = await getDoc(receiverRef);

    if (!receiverDoc.exists()) {
      throw new Error("존재하지 않는 사용자입니다.");
    }

    const receiverData = receiverDoc.data();

    const friendship: Omit<Friendship, "id"> = {
      requesterId: user.uid,
      requesterEmail: user.email,
      requesterDisplayName: user.displayName,
      requesterPhotoURL: user.photoURL,
      receiverId: receiverUserId,
      receiverEmail: receiverData.email,
      receiverDisplayName: receiverData.displayName,
      receiverPhotoURL: receiverData.photoURL,
      status: "pending",
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "friendships"), friendship);
    console.log("친구 요청 전송 완료:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("친구 요청 전송 실패:", error);
    throw error;
  }
}

/**
 * 친구 요청 수락
 */
export async function acceptFriendRequest(friendshipId: string): Promise<void> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const friendshipRef = doc(db, "friendships", friendshipId);
    await updateDoc(friendshipRef, {
      status: "accepted",
      updatedAt: new Date(),
    });

    console.log("친구 요청 수락 완료:", friendshipId);
  } catch (error) {
    console.error("친구 요청 수락 실패:", error);
    throw error;
  }
}

/**
 * 친구 요청 거절
 */
export async function rejectFriendRequest(friendshipId: string): Promise<void> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const friendshipRef = doc(db, "friendships", friendshipId);
    await updateDoc(friendshipRef, {
      status: "rejected",
      updatedAt: new Date(),
    });

    console.log("친구 요청 거절 완료:", friendshipId);
  } catch (error) {
    console.error("친구 요청 거절 실패:", error);
    throw error;
  }
}

/**
 * 친구 삭제 (친구 관계 삭제)
 */
export async function deleteFriendship(friendshipId: string): Promise<void> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    const friendshipRef = doc(db, "friendships", friendshipId);
    await deleteDoc(friendshipRef);

    console.log("친구 삭제 완료:", friendshipId);
  } catch (error) {
    console.error("친구 삭제 실패:", error);
    throw error;
  }
}

/**
 * 보낸 친구 요청 목록 조회
 */
export async function getSentFriendRequests(): Promise<Friendship[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    const q = query(
      collection(db, "friendships"),
      where("requesterId", "==", user.uid),
      where("status", "==", "pending"),
    );

    const querySnapshot = await getDocs(q);

    const requests: Friendship[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        requesterId: data.requesterId,
        requesterEmail: data.requesterEmail,
        requesterDisplayName: data.requesterDisplayName,
        requesterPhotoURL: data.requesterPhotoURL,
        receiverId: data.receiverId,
        receiverEmail: data.receiverEmail,
        receiverDisplayName: data.receiverDisplayName,
        receiverPhotoURL: data.receiverPhotoURL,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      });
    });

    return requests.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error("보낸 친구 요청 조회 실패:", error);
    throw error;
  }
}

/**
 * 받은 친구 요청 목록 조회 (pending 상태만)
 */
export async function getReceivedFriendRequests(): Promise<Friendship[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    const q = query(
      collection(db, "friendships"),
      where("receiverId", "==", user.uid),
      where("status", "==", "pending"),
    );

    const querySnapshot = await getDocs(q);

    const requests: Friendship[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        requesterId: data.requesterId,
        requesterEmail: data.requesterEmail,
        requesterDisplayName: data.requesterDisplayName,
        requesterPhotoURL: data.requesterPhotoURL,
        receiverId: data.receiverId,
        receiverEmail: data.receiverEmail,
        receiverDisplayName: data.receiverDisplayName,
        receiverPhotoURL: data.receiverPhotoURL,
        status: data.status,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      });
    });

    return requests.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error("받은 친구 요청 조회 실패:", error);
    throw error;
  }
}

/**
 * 친구 목록 조회 (accepted 상태만)
 */
export async function getFriendList(): Promise<FriendInfo[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    // 내가 요청을 보낸 친구 관계
    const sentQuery = query(
      collection(db, "friendships"),
      where("requesterId", "==", user.uid),
      where("status", "==", "accepted"),
    );

    // 내가 요청을 받은 친구 관계
    const receivedQuery = query(
      collection(db, "friendships"),
      where("receiverId", "==", user.uid),
      where("status", "==", "accepted"),
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentQuery),
      getDocs(receivedQuery),
    ]);

    const friends: FriendInfo[] = [];

    // 내가 요청을 보낸 경우: 상대방은 receiver
    sentSnapshot.forEach((doc) => {
      const data = doc.data();
      friends.push({
        odUserId: data.receiverId,
        email: data.receiverEmail,
        displayName: data.receiverDisplayName,
        photoURL: data.receiverPhotoURL,
      });
    });

    // 내가 요청을 받은 경우: 상대방은 requester
    receivedSnapshot.forEach((doc) => {
      const data = doc.data();
      friends.push({
        odUserId: data.requesterId,
        email: data.requesterEmail,
        displayName: data.requesterDisplayName,
        photoURL: data.requesterPhotoURL,
      });
    });

    return friends;
  } catch (error) {
    console.error("친구 목록 조회 실패:", error);
    throw error;
  }
}

// ==================== 친구의 공유 오답노트 ====================

/**
 * 모든 친구의 공유된 오답노트 조회
 */
export async function getFriendsSharedWrongNotes(): Promise<WrongNote[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    // 친구 목록 가져오기
    const friends = await getFriendList();

    if (friends.length === 0) {
      return [];
    }

    // 친구들의 userId 배열
    const friendUserIds = friends.map((f) => f.odUserId);

    // Firestore 'in' 쿼리는 최대 10개까지만 지원
    // 친구가 10명 이상인 경우 여러 쿼리로 분할
    const allNotes: WrongNote[] = [];

    for (let i = 0; i < friendUserIds.length; i += 10) {
      const chunk = friendUserIds.slice(i, i + 10);
      const q = query(
        collection(db, "wrongNotes"),
        where("userId", "in", chunk),
        where("share", "==", true),
      );

      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        allNotes.push({
          id: doc.id,
          userId: data.userId,
          userEmail: data.userEmail,
          title: data.title || "",
          link: data.link,
          language: data.language || "",
          date: data.date,
          platform: data.platform,
          category: data.category,
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
    }

    // 클라이언트에서 정렬
    return allNotes.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error("친구 오답노트 조회 실패:", error);
    throw error;
  }
}

/**
 * ID로 오답노트 조회 (본인 노트 또는 친구의 공유 노트)
 */
export async function getWrongNoteById(
  noteId: string,
): Promise<{ note: WrongNote | null; isOwner: boolean }> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return { note: null, isOwner: false };
    }

    const noteRef = doc(db, "wrongNotes", noteId);
    const noteDoc = await getDoc(noteRef);

    if (!noteDoc.exists()) {
      return { note: null, isOwner: false };
    }

    const data = noteDoc.data();
    const isOwner = data.userId === user.uid;

    // 본인 노트이거나, 공유된 노트인 경우에만 반환
    if (!isOwner && !data.share) {
      return { note: null, isOwner: false };
    }

    // 본인 노트가 아닌 경우 친구인지 확인
    if (!isOwner) {
      const friends = await getFriendList();
      const isFriend = friends.some((f) => f.odUserId === data.userId);
      if (!isFriend) {
        return { note: null, isOwner: false };
      }
    }

    const note: WrongNote = {
      id: noteDoc.id,
      userId: data.userId,
      userEmail: data.userEmail,
      title: data.title || "",
      link: data.link,
      language: data.language || "",
      date: data.date,
      platform: data.platform,
      category: data.category,
      grade: data.grade,
      myCode: data.myCode,
      solution: data.solution,
      comment: data.comment,
      share: data.share,
      tags: data.tags,
      result: data.result,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };

    return { note, isOwner };
  } catch (error) {
    console.error("오답노트 조회 실패:", error);
    throw error;
  }
}

/**
 * 특정 친구의 공유된 오답노트 조회
 */
export async function getFriendSharedWrongNotes(
  friendUserId: string,
): Promise<WrongNote[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    const q = query(
      collection(db, "wrongNotes"),
      where("userId", "==", friendUserId),
      where("share", "==", true),
    );

    const querySnapshot = await getDocs(q);

    const notes: WrongNote[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notes.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        title: data.title || "",
        link: data.link,
        language: data.language || "",
        date: data.date,
        platform: data.platform,
        category: data.category,
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

    return notes.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error("친구 오답노트 조회 실패:", error);
    throw error;
  }
}
