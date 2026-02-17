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
import type { Friendship, FriendInfo } from "../model/friend.type";

export async function getFriendshipStatus(
  otherUserId: string,
): Promise<Friendship | null> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return null;
    }

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

export async function sendFriendRequest(receiverUserId: string): Promise<string> {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    if (user.uid === receiverUserId) {
      throw new Error("자기 자신에게 친구 요청을 보낼 수 없습니다.");
    }

    const existingFriendship = await getFriendshipStatus(receiverUserId);
    if (existingFriendship) {
      if (existingFriendship.status === "accepted") {
        throw new Error("이미 친구입니다.");
      } else if (existingFriendship.status === "pending") {
        throw new Error("이미 친구 요청이 진행 중입니다.");
      }
    }

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

export async function getFriendList(): Promise<FriendInfo[]> {
  try {
    const user = auth.currentUser;

    if (!user) {
      return [];
    }

    const sentQuery = query(
      collection(db, "friendships"),
      where("requesterId", "==", user.uid),
      where("status", "==", "accepted"),
    );

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

    sentSnapshot.forEach((doc) => {
      const data = doc.data();
      friends.push({
        odUserId: data.receiverId,
        email: data.receiverEmail,
        displayName: data.receiverDisplayName,
        photoURL: data.receiverPhotoURL,
      });
    });

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
