import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { GameProgressSummary, GameProgressDetail, CaughtPokemonDto, GAME_POKEDEX } from '../models/progress.model';

export interface PokedexEntry {
  pokemonId: number;
  pokemonName: string;
  entryNumber: number;
}

interface PokedexApiResponse {
  pokemon_entries: {
    entry_number: number;
    pokemon_species: { name: string; url: string };
  }[];
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private http = inject(HttpClient);
  private base = 'http://localhost:5279/api/gameprogress';
  private pokeApi = 'https://pokeapi.co/api/v2';

  getAll(): Observable<GameProgressSummary[]> {
    return this.http.get<GameProgressSummary[]>(this.base);
  }

  getById(id: number): Observable<GameProgressDetail> {
    return this.http.get<GameProgressDetail>(`${this.base}/${id}`);
  }

  create(gameVersion: string, trainerName: string, startedAt: Date): Observable<GameProgressSummary> {
    return this.http.post<GameProgressSummary>(this.base, { gameVersion, trainerName, startedAt });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  upsertCaught(progressId: number, dto: CaughtPokemonDto): Observable<CaughtPokemonDto> {
    return this.http.put<CaughtPokemonDto>(`${this.base}/${progressId}/caught`, dto);
  }

  removeCaught(progressId: number, pokemonId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${progressId}/caught/${pokemonId}`);
  }

  finish(id: number): Observable<{ finishedAt: string }> {
    return this.http.post<{ finishedAt: string }>(`${this.base}/${id}/finish`, {});
  }

  resume(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/resume`, {});
  }

  resetProgress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/reset`);
  }

  getPokedex(gameVersion: string): Observable<PokedexEntry[]> {
    const dexNames = GAME_POKEDEX[gameVersion] ?? ['kanto'];

    const fetchOne = (name: string): Observable<PokedexEntry[]> =>
      this.http.get<PokedexApiResponse>(`${this.pokeApi}/pokedex/${name}`).pipe(
        map(res => res.pokemon_entries.map(e => ({
          pokemonId:   this.extractId(e.pokemon_species.url),
          pokemonName: e.pokemon_species.name,
          entryNumber: e.entry_number,
        }))),
        catchError(() => of([] as PokedexEntry[]))
      );

    if (dexNames.length === 1) {
      return fetchOne(dexNames[0]).pipe(
        map(entries => entries.sort((a, b) => a.entryNumber - b.entryNumber))
      );
    }

    // Multi-dex games (X/Y): merge all dexes, deduplicate by pokemonId, sort by national ID
    return forkJoin(dexNames.map(fetchOne)).pipe(
      map(all => {
        const seen = new Set<number>();
        return all.flat()
          .filter(e => { if (seen.has(e.pokemonId)) return false; seen.add(e.pokemonId); return true; })
          .sort((a, b) => a.pokemonId - b.pokemonId)
          .map((e, i) => ({ ...e, entryNumber: i + 1 }));
      })
    );
  }

  private extractId(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return parseInt(parts[parts.length - 1], 10);
  }
}
