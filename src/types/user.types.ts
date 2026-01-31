// 사용자 프로필 타입 (Firestore users 컬렉션용)
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  updatedAt?: Date;
}
