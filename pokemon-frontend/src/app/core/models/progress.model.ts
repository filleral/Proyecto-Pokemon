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

export const GAME_POKEDEX: Record<string, string[]> = {
  'red':              ['kanto'],
  'blue':             ['kanto'],
  'yellow':           ['kanto'],
  'gold':             ['original-johto'],
  'silver':           ['original-johto'],
  'crystal':          ['original-johto'],
  'ruby':             ['hoenn'],
  'sapphire':         ['hoenn'],
  'emerald':          ['hoenn'],
  'firered':          ['kanto'],
  'leafgreen':        ['kanto'],
  'diamond':          ['original-sinnoh'],
  'pearl':            ['original-sinnoh'],
  'platinum':         ['extended-sinnoh'],
  'heartgold':        ['updated-johto'],
  'soulsilver':       ['updated-johto'],
  'black':            ['original-unova'],
  'white':            ['original-unova'],
  'black-2':          ['updated-unova'],
  'white-2':          ['updated-unova'],
  'x':                ['kalos-central', 'kalos-coastal', 'kalos-mountain'],
  'y':                ['kalos-central', 'kalos-coastal', 'kalos-mountain'],
  'omega-ruby':       ['updated-hoenn'],
  'alpha-sapphire':   ['updated-hoenn'],
  'sun':              ['original-alola'],
  'moon':             ['original-alola'],
  'ultra-sun':        ['updated-alola'],
  'ultra-moon':       ['updated-alola'],
  'lets-go-pikachu':  ['letsgo-kanto'],
  'lets-go-eevee':    ['letsgo-kanto'],
  'sword':            ['original-galar'],
  'shield':           ['original-galar'],
  'brilliant-diamond':['original-sinnoh'],
  'shining-pearl':    ['original-sinnoh'],
  'legends-arceus':   ['hisui'],
  'scarlet':          ['paldea'],
  'violet':           ['paldea'],
};
