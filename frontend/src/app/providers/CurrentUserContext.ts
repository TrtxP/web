import { createContext } from "react";
import type { PrivateAggregatedProfile } from "../../entities/user/model/types.ts";

export interface CurrentUserContextType {
  profile: PrivateAggregatedProfile | null;
  token: string | null;
  loading: boolean;
  refetchProfile: () => Promise<void>;
}

export const CurrentUserContext = createContext<CurrentUserContextType>({
  profile: null,
  token: null,
  loading: false,
  refetchProfile: async () => {},
});

