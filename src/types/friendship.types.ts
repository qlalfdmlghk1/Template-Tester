// 친구 관계 상태
export type FriendshipStatus = "pending" | "accepted" | "rejected";

// 친구 관계 (Firestore friendships 컬렉션용)
export interface Friendship {
  id?: string;
  requesterId: string;
  requesterEmail: string | null;
  requesterDisplayName: string | null;
  requesterPhotoURL: string | null;
  receiverId: string;
  receiverEmail: string | null;
  receiverDisplayName: string | null;
  receiverPhotoURL: string | null;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt?: Date;
}

// 친구 목록 표시용 간소화된 타입
export interface FriendInfo {
  odUserId: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
