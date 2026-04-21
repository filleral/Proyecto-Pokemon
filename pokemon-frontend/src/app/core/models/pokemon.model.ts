export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: PokemonTypeSlot[];
  stats: PokemonStatSlot[];
  abilities: PokemonAbilitySlot[];
  sprites: PokemonSprites;
}

export interface PokemonTypeSlot {
  slot: number;
  type: { name: string; url: string };
}

export interface PokemonStatSlot {
  base_stat: number;
  effort: number;
  stat: { name: string; url: string };
}

export interface PokemonAbilitySlot {
  is_hidden: boolean;
  slot: number;
  ability: { name: string; url: string };
}

export interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  other?: {
    'official-artwork'?: {
      front_default: string | null;
      front_shiny: string | null;
    };
  };
}

export interface Favorite {
  id: number;
  pokemonId: number;
  pokemonName: string;
  pokemonImageUrl: string;
  createdAt: string;
}

export interface PokemonTeam {
  id: number;
  name: string;
  createdAt: string;
  members: TeamMember[];
}

export interface TeamMember {
  id: number;
  pokemonTeamId: number;
  pokemonId: number;
  pokemonName: string;
  pokemonImageUrl: string;
  slot: number;
}

export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};
