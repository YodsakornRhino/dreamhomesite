export interface UserStatus {
  state: "online" | "offline";
  lastActiveAt: string | null;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  status: UserStatus | null;
}
