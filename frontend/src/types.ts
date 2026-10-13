import type React from "react";
import type { UserProfileDTO } from "./entities/user/model/types.ts";

export type {
  IdResponseDTO,
  UserStatusUpdate,
  UserProfileStatusUpdate,
} from "./shared/types/common.ts";

export type {
  UserDTO,
  MyPrivateUserDTO,
  UserProfileDTO,
  UserBioDTO,
  AggregatedProfile,
  PrivateAggregatedProfile,
  FullProfileModalProps,
} from "./entities/user/model/types.ts";

export {
  AVAILABLE_INTERESTS,
  isProfileComplete,
  isProfileEmpty,
} from "./entities/user/model/types.ts";

export type {
  LoginRequestDTO,
  LoginResponseDTO,
} from "./features/auth/model/types.ts";

export type {
  CitySuggestion,
  ProfileProps,
  EditProfileModalProps,
} from "./features/profile-edit/model/types.ts";

export type {
  ConnectionAggregatedProfile,
  ConnectionCardProps,
} from "./features/connections/model/types.ts";

export type {
  ChatMessage,
  ChatMessageDTO,
  ChatSummary,
  TypingIndicatorDTO,
  UserSummary,
} from "./features/chat/model/types.ts";

export interface FullUserInformation {
  id: number;
  info: import("./entities/user/model/types.ts").UserDTO;
  profile: UserProfileDTO;
  bio: import("./entities/user/model/types.ts").UserBioDTO;
}

export interface LayoutProps {
  children: React.ReactNode;
  currentUserProfile: UserProfileDTO | null;
}
