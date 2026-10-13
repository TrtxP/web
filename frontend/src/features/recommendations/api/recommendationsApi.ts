import { api } from "../../../shared/api/httpClient.ts";
import { resolveProfileData } from "../../../entities/user/api/userApi.ts";
import type { AggregatedProfile } from "../../../entities/user/model/types.ts";
import type { IdResponseDTO } from "../../../shared/types/common.ts";

export const recommendationsApi = {
  getRecommendations: async (): Promise<number[]> => {
    const res = await api.get<IdResponseDTO[]>("/recommendations");
    return res.data.map((item) => item.id);
  },

  getFullRecommendations: async (): Promise<AggregatedProfile[]> => {
    try {
      const ids = await recommendationsApi.getRecommendations();
      if (!ids || ids.length === 0) return [];

      const fullProfiles = await Promise.all(
        ids.map(async (id) => {
          try {
            return await resolveProfileData(id);
          } catch (err) {
            console.error(`Error data loading for the ID ${id}: ${err}`);
            return null;
          }
        }),
      );

      return fullProfiles.filter((p): p is AggregatedProfile => p !== null);
    } catch (err) {
      console.error(`Failed to load full recommendations: ${err}`);
      throw err;
    }
  },

  dismissRecommendation: async (targetId: number): Promise<void> => {
    await api.delete(`/recommendations/${targetId}`);
  },
};

