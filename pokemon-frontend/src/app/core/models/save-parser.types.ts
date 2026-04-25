export type SaveGeneration = 'gen3' | 'gen4' | 'unknown';

export interface SaveFileInfo {
  generation: SaveGeneration;
  sizeBytes: number;
  rawBuffer: ArrayBuffer;
}

export interface ParsedPokemon {
  pokemonId: number;
  pokemonName: string;
  isShiny: boolean;
  slot?: number; // 0-5 for party
}

export interface ParsedSaveData {
  detectedGame: string;   // key matching GAME_POKEDEX e.g. 'emerald', 'diamond'
  trainerName: string;
  playTimeHours: number;
  seenIds: number[];
  caughtPokemon: ParsedPokemon[];
  shinyCaught: ParsedPokemon[];
  party: ParsedPokemon[];
}

export interface ImportOptions {
  gameVersion: string;
  trainerName: string;
  startedAt: string;
  importPokedex: boolean;
  importTeam: boolean;
}

export interface ImportResult {
  progressId: number | null;
  teamId: number | null;
  pokemonImported: number;
  teamImported: number;
}
