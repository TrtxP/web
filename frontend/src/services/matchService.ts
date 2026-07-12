import axios from "axios";
import type {
  UserDTO,
  UserProfileDTO,
  UserBioDTO,
  IdResponseDTO,
} from "../types";

const API_URL = "http://localhost:8080";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AggregatedProfile
  extends UserDTO, UserProfileDTO, UserBioDTO {}

// Compiles split endpoint data models securely into a single interface
export const resolveProfileData = async (
  id: number,
): Promise<AggregatedProfile> => {
  const [userRes, profileRes, bioRes] = await Promise.all([
    api.get<UserDTO>(`/users/${id}`),
    api.get<UserProfileDTO>(`/users/${id}/profile`),
    api.get<UserBioDTO>(`/users/${id}/bio`),
  ]);

  return { ...userRes.data, ...profileRes.data, ...bioRes.data };
};

export const matchService = {
  getRecommendations: async (): Promise<number[]> => {
    const res = await api.get<IdResponseDTO[]>("/recommendations");
    return res.data.map((item) => item.id);
  },
  dismissRecommendation: async (targetId: number): Promise<void> => {
    await api.delete(`/recommendations/${targetId}`);
  },
  getFullRecommendations: async (): Promise<AggregatedProfile[]> => {
    try {
      const ids = await matchService.getRecommendations();

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
  getConnections: async (): Promise<number[]> => {
    const res = await api.get<IdResponseDTO[]>("/connections");
    return res.data.map((item) => item.id);
  },
  getIncomingRequests: async (): Promise<number[]> => {
    const res = await api.get<IdResponseDTO[]>("/connections/requests");
    return res.data.map((item) => item.id);
  },
  connectWithUser: async (targetId: number): Promise<void> => {
    await api.post(`/connections/${targetId}`);
  },
  respondToRequest: async (
    connectionId: number,
    accept: boolean,
  ): Promise<void> => {
    await api.patch(`/connections/${connectionId}/respond?accept=${accept}`);
  },
  disconnectFromUser: async (targetId: number): Promise<void> => {
    await api.delete(`/connections/${targetId}`);
  },
  getMyFullProfile: async (): Promise<AggregatedProfile> => {
    const [userRes, profileRes, bioRes] = await Promise.all([
      api.get<UserDTO>("/me"),
      api.get<UserProfileDTO>("/me/profile"),
      api.get<UserBioDTO>("/me/bio"),
    ]);
    return { ...userRes.data, ...profileRes.data, ...bioRes.data };
  },
  updateProfile: async (
    name: string,
    profile: Partial<UserProfileDTO>,
    bio: Partial<UserBioDTO>,
  ): Promise<void> => {
    await Promise.all([
      api.patch("/me", { name }),
      api.patch("/me/profile", profile),
      api.patch("/me/bio", bio),
    ]);
  },
};
