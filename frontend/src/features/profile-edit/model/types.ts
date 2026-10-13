import type { PrivateAggregatedProfile } from "../../../entities/user/model/types.ts";

export interface CitySuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export interface ProfileProps {
  onProfileUpdate?: () => void;
}

export interface EditProfileModalProps {
  currentProfile: Partial<PrivateAggregatedProfile>;
  onSave: (profile: Partial<PrivateAggregatedProfile>) => void;
  onClose: () => void;
}

