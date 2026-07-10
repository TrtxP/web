import axios from 'axios';

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

export interface UserResponseDTO {
  id: string;
  name: string;
  profilePicture: string | null;
  isOnline?: boolean;
}

export interface UserProfileResponseDTO {
  aboutMe: string;
}

export interface UserBioResponseDTO {
  interests: string[];
  hobbies: string[];
  favoriteFood: string;
  favoriteMusic: string;
  prefersLongWalks: boolean;
  latitude?: number;
  longitude?: number;
  maxRadiusKm?: number;
}

export interface IdResponseDTO {
  id: string;
}

export interface AggregatedProfile extends UserResponseDTO, UserProfileResponseDTO, UserBioResponseDTO {}

// Compiles split endpoint data models securely into a single interface
export const resolveProfileData = async (id: string): Promise<AggregatedProfile> => {
  const [userRes, profileRes, bioRes] = await Promise.all([
    api.get<UserResponseDTO>(`/users/${id}`),
    api.get<UserProfileResponseDTO>(`/users/${id}/profile`),
    api.get<UserBioResponseDTO>(`/users/${id}/bio`)
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
  connectWithUser: async (targetId: string) => {
    return (await api.post('/connections', { targetId })).data;
  },
  dismissRecommendation: async (targetId: string) => {
    return (await api.post('/recommendations/dismiss', { targetId })).data;
  },
  updateProfile: async (name: string, profile: UserProfileResponseDTO, bio: UserBioResponseDTO) => {
    await Promise.all([
      api.put('/me', { name }),
      api.put('/me/profile', profile),
      api.put('/me/bio', bio)
    ]);
  }
};