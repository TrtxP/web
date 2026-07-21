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
  lastSeenAt?: string;
  city: string;
  age: number;
  gender: string;
  latitude: number;
  longitude: number;
  preferredDistance: number;
  recommendByCityOnly: boolean;
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

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  profilePictureUrl?: string | null;
}

export interface ChatMessage {
  id?: number;
  chatId?: number;
  senderId?: number;
  sender?: UserSummary;
  receiverId?: number;
  content: string;
  sentAt: string;
}

export interface TypingIndicatorDTO {
  chatId: number;
  userId: number;
  typing: boolean;
}

interface ConnectionUserDTO {
  connectionId: number;
  name: string;
  profilePictureUrl: string;
}

export interface AggregatedProfile
  extends UserDTO, UserProfileDTO, UserBioDTO {}

export interface PrivateAggregatedProfile
  extends MyPrivateUserDTO, UserProfileDTO, UserBioDTO {}

export interface ConnectionAggregatedProfile
  extends ConnectionUserDTO, UserProfileDTO, UserBioDTO {}

export interface FullUserInformation {
  id: number;
  info: UserDTO;
  profile: UserProfileDTO;
  bio: UserBioDTO;
}

export interface CitySuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export interface LayoutProps {
  children: React.ReactNode;
  currentUserProfile: UserProfileDTO | null;
}

export interface ProfileProps {
  onProfileUpdate?: () => void;
}

export interface ConnectionCardProps {
  user: UserProfileDTO & { id: string; name: string };
}

export interface EditProfileModalProps {
  currentProfile: Partial<PrivateAggregatedProfile>;
  onSave: (profile: Partial<PrivateAggregatedProfile>) => void;
  onClose: () => void;
}

export interface FullProfileModalProps {
  profile: AggregatedProfile;
  onClose: () => void;
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

export interface ChatSummary {
  id: number;
  partnerId: number;
  partnerName: string;
  lastMessageAt: string;
  unreadCount?: number;
}

export const isProfileComplete = (
  profile: PrivateAggregatedProfile | null,
): boolean => {
  if (!profile) return false;
  return !!(
    profile.name?.trim() &&
    profile.city?.trim() &&
    profile.gender?.trim() &&
    profile.age &&
    profile.lookingFor?.trim()
  );
};

export const isProfileEmpty = (
  profile: UserProfileDTO | null | undefined,
): boolean => {
  if (!profile) return true;
  // Якщо немає міста або віку — профіль вважається незаповненим
  return !profile.city || !profile.age;
};

export const AVAILABLE_INTERESTS = [
  "Music",
  "Cinema",
  "Books",
  "Sports",
  "Coding",
  "Gaming",
  "Cooking",
  "Travel",
  "Art",
  "Photography",
];
