import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "@/shared/api/firebase";
import type { Template, Category, TemplateType } from "../model/template.type";

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

    return templates.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error("사용자 템플릿 조회 실패:", error);
    throw error;
  }
}

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

    return templates.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error("카테고리별 사용자 템플릿 조회 실패:", error);
    throw error;
  }
}

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
