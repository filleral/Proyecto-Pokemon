import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ParsedSaveData, SaveFileInfo, SaveGeneration } from '../models/save-parser.types';
import { parseGen4 } from './gen4-parser';

const GEN3_SIZE = 131072;   // 128 KB
const GEN4_SIZE = 524288;   // 512 KB

const GEN3_GAMES = ['ruby', 'sapphire', 'emerald', 'firered', 'leafgreen'];
const GEN4_GAMES = ['diamond', 'pearl', 'platinum', 'heartgold', 'soulsilver'];

@Injectable({ providedIn: 'root' })
export class SaveParserService {
  private http = inject(HttpClient);
  private pokeApi = 'https://pokeapi.co/api/v2';

  /** Detect the save generation from the file size. */
  analyze(buffer: ArrayBuffer): SaveFileInfo {
    const size = buffer.byteLength;
    let generation: SaveGeneration = 'unknown';
    if (size === GEN3_SIZE) generation = 'gen3';
    else if (size === GEN4_SIZE) generation = 'gen4';
    return { generation, sizeBytes: size, rawBuffer: buffer };
  }

  /** Games applicable to the detected generation. */
  gamesForGeneration(gen: SaveGeneration): string[] {
    if (gen === 'gen3') return GEN3_GAMES;
    if (gen === 'gen4') return GEN4_GAMES;
    return [...GEN3_GAMES, ...GEN4_GAMES];
  }

  /**
   * Parse the save file and resolve Pokémon names via PokeAPI.
   * Returns an Observable so name resolution can be async.
   * Emits null if the game is unsupported or the file is invalid.
   */
  parse(info: SaveFileInfo, gameVersion: string): Observable<ParsedSaveData | null> {
    if (info.generation === 'gen4') {
      return this.parseGen4$(info.rawBuffer, gameVersion);
    }
    // Gen 3 parser: TODO
    return of(null);
  }

  // ── Gen 4 ────────────────────────────────────────────────────────────────

  private parseGen4$(buffer: ArrayBuffer, gameVersion: string): Observable<ParsedSaveData | null> {
    const raw = parseGen4(buffer, gameVersion);
    if (!raw) return of(null);

    // Collect all species IDs that need a name (party + caught + seen)
    const speciesNeeded = new Set<number>([
      ...raw.party.map(p => p.species),
      ...raw.caughtIds,
      ...raw.seenIds,
    ]);

    if (!speciesNeeded.size) {
      return of(this.buildParsedData(gameVersion, raw, new Map()));
    }

    // Fetch all names from PokeAPI species list (one request for national dex)
    return this.fetchPokemonNames(Array.from(speciesNeeded)).pipe(
      map(nameMap => this.buildParsedData(gameVersion, raw, nameMap)),
      catchError(() => of(this.buildParsedData(gameVersion, raw, new Map())))
    );
  }

  private buildParsedData(
    gameVersion: string,
    raw: ReturnType<typeof parseGen4> & {},
    nameMap: Map<number, string>
  ): ParsedSaveData {
    const name = (id: number) => nameMap.get(id) ?? `#${id}`;

    return {
      detectedGame:  gameVersion,
      trainerName:   raw!.trainerName,
      playTimeHours: 0,
      seenIds:       raw!.seenIds,
      caughtPokemon: raw!.caughtIds.map(id => ({
        pokemonId:   id,
        pokemonName: name(id),
        isShiny:     false,
      })),
      shinyCaught: [],
      party: raw!.party.map(p => ({
        pokemonId:   p.species,
        pokemonName: name(p.species),
        isShiny:     p.isShiny,
        slot:        p.slot,
      })),
    };
  }

  /**
   * Fetch all Gen 4 Pokémon names in a single PokeAPI list request.
   * results[i].name maps to species ID i+1.
   */
  private fetchPokemonNames(_ids: number[]): Observable<Map<number, string>> {
    return this.http.get<{ results: { name: string }[] }>(
      `${this.pokeApi}/pokemon?limit=500&offset=0`
    ).pipe(
      map(res => {
        const m = new Map<number, string>();
        res.results.forEach((r, i) => m.set(i + 1, r.name));
        return m;
      }),
      catchError(() => of(new Map<number, string>()))
    );
  }
}
