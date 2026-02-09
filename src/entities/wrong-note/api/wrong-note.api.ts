import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "@/shared/api/firebase";
import type { WrongNote } from "../model/wrong-note.type";
import { getFriendList } from "@/entities/friend/api/friend.api";

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

    return wrongNotes.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error("오답노트 조회 실패:", error);
    throw error;
  }
}

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

export async function getFriendsSharedWrongNotes(): Promise<WrongNote[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    const friends = await getFriendList();

    if (friends.length === 0) {
      return [];
    }

    const friendUserIds = friends.map((f) => f.odUserId);
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

    return allNotes.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  } catch (error) {
    console.error("친구 오답노트 조회 실패:", error);
    throw error;
  }
}

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

    if (!isOwner && !data.share) {
      return { note: null, isOwner: false };
    }

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
