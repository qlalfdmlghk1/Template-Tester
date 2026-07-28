export type FriendshipStatus = "pending" | "accepted" | "rejected";

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

export interface FriendInfo {
  odUserId: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
