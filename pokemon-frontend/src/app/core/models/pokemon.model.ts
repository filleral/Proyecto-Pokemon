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

export interface PokemonMoveEntry {
  move: { name: string; url: string };
  version_group_details: {
    level_learned_at: number;
    move_learn_method: { name: string };
    version_group: { name: string };
  }[];
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
  game_indices: PokemonGameIndex[];
  moves: PokemonMoveEntry[];
}

export interface PokemonGameIndex {
  game_index: number;
  version: { name: string; url: string };
}

export interface PokemonEncounter {
  location_area: { name: string; url: string };
  version_details: {
    version: { name: string; url: string };
    max_chance: number;
    encounter_details: { min_level: number; max_level: number; method: { name: string } }[];
  }[];
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

export interface AbilityDetail {
  name: string;
  names: { name: string; language: { name: string } }[];
  effect_entries: { effect: string; short_effect: string; language: { name: string } }[];
  flavor_text_entries: { flavor_text: string; language: { name: string }; version_group: { name: string } }[];
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

export interface TypeDetail {
  name: string;
  damage_relations: {
    double_damage_from: { name: string }[];
    double_damage_to:   { name: string }[];
    half_damage_from:   { name: string }[];
    half_damage_to:     { name: string }[];
    no_damage_from:     { name: string }[];
    no_damage_to:       { name: string }[];
  };
  pokemon: { pokemon: { name: string; url: string }; slot: number }[];
}

export interface PokemonSpecies {
  evolution_chain: { url: string };
}

export interface EvolutionDetail {
  trigger:    { name: string };
  min_level:  number | null;
  item:       { name: string } | null;
  held_item:  { name: string } | null;
  min_happiness: number | null;
  min_beauty:    number | null;
  time_of_day:   string;
  known_move:    { name: string } | null;
  location:      { name: string } | null;
  trade_species: { name: string } | null;
  needs_overworld_rain: boolean;
  turn_upside_down: boolean;
}

export interface EvolutionChainLink {
  species: { name: string; url: string };
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionChainLink[];
}

export interface EvolutionChain {
  chain: EvolutionChainLink;
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
  heldItem?: string | null;
  ability?: string | null;
  nature?: string | null;
  move1?: string | null;
  move2?: string | null;
  move3?: string | null;
  move4?: string | null;
  evHp?: number; evAtk?: number; evDef?: number; evSpAtk?: number; evSpDef?: number; evSpeed?: number;
  ivHp?: number; ivAtk?: number; ivDef?: number; ivSpAtk?: number; ivSpDef?: number; ivSpeed?: number;
}

export const TYPE_NAMES_ES: Record<string, string> = {
  normal: 'Normal',    fire: 'Fuego',       water: 'Agua',
  electric: 'Eléctrico', grass: 'Planta',   ice: 'Hielo',
  fighting: 'Lucha',   poison: 'Veneno',    ground: 'Tierra',
  flying: 'Volador',   psychic: 'Psíquico', bug: 'Bicho',
  rock: 'Roca',        ghost: 'Fantasma',   dragon: 'Dragón',
  dark: 'Siniestro',   steel: 'Acero',      fairy: 'Hada',
};

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
