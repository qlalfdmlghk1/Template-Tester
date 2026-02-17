import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  query,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "@/shared/api/firebase";
import type { UserProfile } from "../model/user.type";

export async function syncUserProfile(): Promise<void> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      await updateDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        updatedAt: new Date(),
      });
    } else {
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

export async function searchUserByDisplayName(
  searchQuery: string,
): Promise<UserProfile[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    const q = query(collection(db, "users"));
    const querySnapshot = await getDocs(q);

    const searchLower = searchQuery.toLowerCase();
    const users: UserProfile[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      if (data.uid === user.uid) return;

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
