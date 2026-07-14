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
  city: string;
  age: number;
  gender: string;
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

export interface AggregatedProfile extends UserDTO, UserProfileDTO, UserBioDTO {
  preferredDistance: number;
}

export interface FullUserInformation {
  id: number;
  info: UserDTO;
  profile: UserProfileDTO;
  bio: UserBioDTO;
}

export interface RecommendationCardProps {
  user: FullUserInformation;
}

export interface CitySuggestion {
  display_name: string;
  lat: string;
  lon: string;
}
