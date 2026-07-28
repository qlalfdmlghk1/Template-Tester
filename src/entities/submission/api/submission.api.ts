import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, auth } from "@/shared/api/firebase";
import type { Submission, GradingResult } from "../model/submission.type";

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

    const docRef = await addDoc(collection(db, "submissions"), submission);
    console.log("제출 기록 저장 완료:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("제출 기록 저장 실패:", error);
    throw error;
  }
}

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
        createdAt: data.createdAt.toDate(),
      });
    });

    return submissions;
  } catch (error) {
    console.error("제출 기록 조회 실패:", error);
    throw error;
  }
}

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
      averageScore: Math.round(averageScore * 10) / 10,
      bestScore,
      worstScore,
    };
  } catch (error) {
    console.error("통계 계산 실패:", error);
    throw error;
  }
}
