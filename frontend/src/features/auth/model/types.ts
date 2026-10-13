export interface LoginRequestDTO {
  email: string;
  password: string;
}

export interface LoginResponseDTO {
  userId?: number;
  token: string;
}

