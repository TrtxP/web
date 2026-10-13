export interface UserDTO {
  id: number;
  name: string;
  profilePictureUrl: string;
  isOnline?: boolean;
}

export interface MyPrivateUserDTO {
  id: number;
  name: string;
  email: string;
  profilePictureUrl: string;
}

export interface UserProfileDTO {
  aboutMe: string;
  isOnline?: boolean;
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

export interface AggregatedProfile
  extends UserDTO,
    UserProfileDTO,
    UserBioDTO {}

export interface PrivateAggregatedProfile
  extends MyPrivateUserDTO,
    UserProfileDTO,
    UserBioDTO {}

export interface FullUserInformation {
  id: number;
  info: UserDTO;
  profile: UserProfileDTO;
  bio: UserBioDTO;
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

export interface FullProfileModalProps {
  profile: AggregatedProfile;
  onClose: () => void;
}

