export interface GameProgressSummary {
  id: number;
  gameVersion: string;
  trainerName: string;
  startedAt: string;
  createdAt: string;
  totalSeen: number;
  totalCaught: number;
  totalShiny: number;
  finishedAt: string | null;
}

export interface GameProgressDetail {
  id: number;
  gameVersion: string;
  trainerName: string;
  startedAt: string;
  createdAt: string;
  caughtPokemons: CaughtPokemonDto[];
  finishedAt: string | null;
}

export interface CaughtPokemonDto {
  pokemonId: number;
  pokemonName: string;
  seen: boolean;
  caughtNormal: boolean;
  caughtShiny: boolean;
}

export interface PokedexResponse {
  pokemon_entries: {
    entry_number: number;
    pokemon_species: { name: string; url: string };
  }[];
}

/**
 * Maps a game version to either:
 *  - number  → fetch national dex and keep entries with entry_number <= N
 *  - string[] → merge those named regional dexes (for games with unique regional lists)
 */
export const GAME_POKEDEX: Record<string, number | string[]> = {
  // Gen 1 – 151 species
  'red':               151,
  'blue':              151,
  'yellow':            151,
  // Gen 2 – 251 species (Johto dex includes Kanto)
  'gold':              251,
  'silver':            251,
  'crystal':           251,
  // Gen 3 – 386 species
  'ruby':              386,
  'sapphire':          386,
  'emerald':           386,
  'firered':           386,
  'leafgreen':         386,
  // Gen 4 – 493 species
  'diamond':           493,
  'pearl':             493,
  'platinum':          493,
  'heartgold':         493,
  'soulsilver':        493,
  // Gen 5 – 649 species
  'black':             649,
  'white':             649,
  'black-2':           649,
  'white-2':           649,
  // Gen 6 – 721 species
  'x':                 721,
  'y':                 721,
  'omega-ruby':        721,
  'alpha-sapphire':    721,
  // Gen 7 – 809 species (Let's Go kept to Kanto 151)
  'sun':               802,
  'moon':              802,
  'ultra-sun':         807,
  'ultra-moon':        807,
  'lets-go-pikachu':   ['letsgo-kanto'],
  'lets-go-eevee':     ['letsgo-kanto'],
  // Gen 8 – regional lists (not all national Pokémon available)
  'sword':             ['original-galar'],
  'shield':            ['original-galar'],
  'brilliant-diamond': 493,
  'shining-pearl':     493,
  'legends-arceus':    ['hisui'],
  // Gen 9 – Paldea regional list
  'scarlet':           ['paldea'],
  'violet':            ['paldea'],
};
