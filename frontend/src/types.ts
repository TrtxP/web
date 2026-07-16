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

export interface MyPrivateUserDTO {
  id: number;
  name: string;
  email: string;
  profilePictureUrl: string;
}

export interface UserProfileDTO {
  aboutMe: string;
  isOnline: boolean;
  city: string;
  age: number;
  gender: string;
  latitude: number;
  longitude: number;
  preferredDistance: number;
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

export interface AggregatedProfile
  extends UserDTO, UserProfileDTO, UserBioDTO {}

export interface PrivateAggregatedProfile
  extends MyPrivateUserDTO, UserProfileDTO, UserBioDTO {}

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

export interface LayoutProps {
  children: React.ReactNode;
  profileComplete?: boolean; 
}

export interface ProfileProps {
  onProfileUpdate?: () => void;
}

export interface EditProfileModalProps {
  currentProfile: Partial<PrivateAggregatedProfile>;
  onSave: (profile: Partial<PrivateAggregatedProfile>) => void;
  onClose: () => void;
};

export const isProfileComplete = (profile: PrivateAggregatedProfile | null): boolean => {
  if (!profile) return false;
  return !!(
    profile.name?.trim() &&
    profile.city?.trim() &&
    profile.gender?.trim() &&
    profile.age &&
    profile.lookingFor?.trim()
  );
};