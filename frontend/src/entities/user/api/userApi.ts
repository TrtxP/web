import { api } from "../../../shared/api/httpClient.ts";
import type {
  UserDTO,
  UserProfileDTO,
  UserBioDTO,
  AggregatedProfile,
  PrivateAggregatedProfile,
  MyPrivateUserDTO,
} from "../model/types.ts";

export const resolveProfileData = async (
  id: number,
): Promise<AggregatedProfile> => {
  const [userRes, profileRes, bioRes] = await Promise.all([
    api.get<UserDTO>(`/users/${id}`),
    api.get<UserProfileDTO>(`/users/${id}/profile`),
    api.get<UserBioDTO>(`/users/${id}/bio`),
  ]);

  return {
    ...userRes.data,
    ...profileRes.data,
    ...bioRes.data,
    preferredDistance:
      (profileRes.data as AggregatedProfile)?.preferredDistance ?? 0,
  };
};

export const getMyFullProfile = async (): Promise<PrivateAggregatedProfile> => {
  const [userRes, profileRes, bioRes] = await Promise.all([
    api.get<MyPrivateUserDTO>("/me"),
    api.get<UserProfileDTO>("/me/profile"),
    api.get<UserBioDTO>("/me/bio"),
  ]);

  return {
    ...userRes.data,
    ...profileRes.data,
    ...bioRes.data,
    preferredDistance:
      (profileRes.data as PrivateAggregatedProfile)?.preferredDistance ?? 0,
  };
};

export const updateProfile = async (
  name: string,
  profile: Partial<UserProfileDTO>,
  bio: Partial<UserBioDTO>,
): Promise<void> => {
  await Promise.all([
    api.patch("/me", { name }),
    api.patch("/me/profile", profile),
    api.patch("/me/bio", bio),
  ]);
};

export const uploadProfilePicture = async (
  file: File,
): Promise<{ profilePictureUrl: string }> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<{ profilePictureUrl: string }>(
    "/me/profile-picture",
    formData,
  );
  return response.data;
};

export const deleteProfilePicture = async (): Promise<void> => {
  await api.delete("/me/profile-picture");
};

export const fetchUserOnlineStatusWithFallback = async (
  userId: number,
): Promise<boolean> => {
  try {
    const profileRes = await api.get<{ isOnline?: boolean; online?: boolean }>(
      `/users/${userId}/profile`,
    );
    const status = profileRes.data.isOnline ?? profileRes.data.online;
    if (typeof status === "boolean") {
      return status;
    }
  } catch {
    // Fallback to /users/{id}
  }

  try {
    const userRes = await api.get<{ isOnline?: boolean; online?: boolean }>(
      `/users/${userId}`,
    );
    const status = userRes.data.isOnline ?? userRes.data.online;
    return Boolean(status);
  } catch (err) {
    console.error(`Failed to fetch user online status for ${userId}:`, err);
    return false;
  }
};

