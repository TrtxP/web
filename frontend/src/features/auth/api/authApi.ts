import { api } from "../../../shared/api/httpClient.ts";
import type { LoginRequestDTO, LoginResponseDTO } from "../model/types.ts";

export const authApi = {
  login: async (credentials: LoginRequestDTO): Promise<LoginResponseDTO> => {
    const res = await api.post<LoginResponseDTO>("/auth/login", credentials);
    return res.data;
  },

  register: async (credentials: LoginRequestDTO): Promise<LoginResponseDTO> => {
    const res = await api.post<LoginResponseDTO>("/auth/register", credentials);
    return res.data;
  },
};

export const getErrorMessage = (error: unknown): string => {
  const defaultMessage = "Authentication failed. Please try again.";

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response: { data?: unknown } }).response !== null
  ) {
    const data = (error as { response: { data?: unknown } }).response.data;
    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
    ) {
      return (data as { message: string }).message;
    }
  }

  return defaultMessage;
};

