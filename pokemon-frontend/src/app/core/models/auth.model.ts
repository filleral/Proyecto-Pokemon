export interface AuthUser {
  id: number;
  email: string;
  name: string;
  pictureUrl: string | null;
  role: 'free' | 'premium' | 'admin';
  darkMode: boolean;
  bio?: string | null;
  favoritePokemonId?: number | null;
  favoritePokemonName?: string | null;
  favoritePokemonImageUrl?: string | null;
  favoriteGame?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface UpdateProfileRequest {
  name: string;
  bio: string | null;
  favoriteGame: string | null;
  favoritePokemonId: number | null;
  favoritePokemonName: string | null;
  favoritePokemonImageUrl: string | null;
}
