import type { AggregatedProfile } from "../../../entities/user/model/types.ts";

export interface ConnectionAggregatedProfile extends AggregatedProfile {
  connectionId?: number;
}

export interface ConnectionCardProps {
  onProfileUpdate?: () => void;
}

