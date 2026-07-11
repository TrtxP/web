import axios from 'axios';
import type { UserDTO, UserProfileDTO, UserBioDTO, IdResponseDTO } from '../types';

const API_URL = 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AggregatedProfile extends UserDTO, UserProfileDTO, UserBioDTO {}

// Compiles split endpoint data models securely into a single interface
export const resolveProfileData = async (id: number): Promise<AggregatedProfile> => {
  const [userRes, profileRes, bioRes] = await Promise.all([
    api.get<UserDTO>(`/users/${id}`),
    api.get<UserProfileDTO>(`/users/${id}/profile`),
    api.get<UserBioDTO>(`/users/${id}/bio`)
  ]);

  return { ...userRes.data, ...profileRes.data, ...bioRes.data };
};

export const matchService = {
  getRecommendations: async () => {
    const res = await api.get<IdResponseDTO[]>('/recommendations');
    return res.data.map(item => item.id);
  },
  getConnections: async () => {
    const res = await api.get<IdResponseDTO[]>('/connections');
    return res.data.map(item => item.id);
  },
  connectWithUser: async (targetId: number) => {
    return (await api.post(`/connections${targetId}`)).data;
  },
  dismissRecommendation: async (targetId: number) => {
    return (await api.post(`/recommendations/${targetId}`)).data;
  },
  updateProfile: async (name: string, profile: UserProfileDTO, bio: UserBioDTO) => {
    await Promise.all([
      api.put('/me', { name }),
      api.put('/me/profile', profile),
      api.put('/me/bio', bio)
    ]);
  },
  getFullRecommendations: async (): Promise<AggregatedProfile[]> => {
    try {
      const ids = await matchService.getRecommendations()

      if (!ids || ids.length === 0) return []

      const fullProfiles = await Promise.all(
        ids.map(async (id) => {
          try {
            return await resolveProfileData(id)
          } catch (err) {
            console.error(`Error data loading for the ID ${id}: ${err}`)
            return null
          }
        })
      )

      return fullProfiles.filter((p): p is AggregatedProfile => p !== null) 
    } catch (err) {
      console.error(`Failed to load full recommendations: ${err}`)
      throw err
    }
  }
};