export interface AuthUser {
  id: number;
  email: string;
  name: string;
  pictureUrl: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
