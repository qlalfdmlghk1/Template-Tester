export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  updatedAt?: Date;
}

/** JWT 인증 후 받아오는 사용자 정보 */
export interface AuthUser {
  id: number;
  username: string;
  displayName: string | null;
  photoURL: string | null;
  email: string | null;
}
