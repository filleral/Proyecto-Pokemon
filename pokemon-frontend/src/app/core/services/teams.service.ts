import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { PokemonTeam } from '../models/pokemon.model';

@Injectable({ providedIn: 'root' })
export class TeamsService {
  private http = inject(HttpClient);
  private base = 'http://localhost:5279/api/teams';

  teams = signal<PokemonTeam[]>([]);

  load() {
    return this.http.get<PokemonTeam[]>(this.base).pipe(
      tap(data => this.teams.set(data))
    );
  }

  create(name: string) {
    return this.http.post<PokemonTeam>(this.base, { name }).pipe(
      tap(() => this.load().subscribe())
    );
  }

  addMember(teamId: number, pokemonId: number, pokemonName: string, pokemonImageUrl: string, slot: number) {
    return this.http.post<PokemonTeam>(`${this.base}/${teamId}/members`, {
      pokemonId, pokemonName, pokemonImageUrl, slot
    }).pipe(tap(() => this.load().subscribe()));
  }

  removeMember(teamId: number, pokemonId: number) {
    return this.http.delete(`${this.base}/${teamId}/members/${pokemonId}`).pipe(
      tap(() => this.load().subscribe())
    );
  }

  deleteTeam(teamId: number) {
    return this.http.delete(`${this.base}/${teamId}`).pipe(
      tap(() => this.teams.update(t => t.filter(x => x.id !== teamId)))
    );
  }
}
