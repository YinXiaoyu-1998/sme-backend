export interface UserResponse {
  id: string;
  email: string;
  name?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenResponse {
  accessToken: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
  user: UserResponse;
}

export type RegisterResponse = TokenResponse;

export interface LogoutResponse {
  success: boolean;
}

export interface MeResponse {
  user: UserResponse;
}
