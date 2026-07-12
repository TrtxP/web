export interface IdResponseDTO {
  id: number;
}

export interface LoginResponseDTO {
  userId: number;
  token: string;
}

export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface UserDTO {
  id: number;
  name: string;
  profilePictureUrl: string;
}

export interface UserProfileDTO {
  aboutMe: string;
  isOnline: boolean;
}

export interface UserBioDTO {
  id: number;
  interests: string[];
  favoriteFood: string;
  favoriteMusic: string;
  likesLongWalks: boolean;
  lookingFor: string;
}

export interface ChatMessageDTO {
  chatId: number;
  senderId: number;
  receiverId: number;
  content: string;
  sentAt: string;
}

export interface TypingIndicatorDTO {
  chatId: number;
  userId: number;
  typing: boolean;
}
