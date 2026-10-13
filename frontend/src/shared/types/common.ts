export interface IdResponseDTO {
  id: number;
}

export interface UserStatusUpdate {
  userId: number;
  isOnline: boolean;
}

export interface UserProfileStatusUpdate {
  userId: number;
  isOnline: boolean;
  lastSeenAt: string;
}

