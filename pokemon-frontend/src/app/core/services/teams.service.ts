import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { switchMap, tap } from 'rxjs/operators';
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
      switchMap(() => this.load())
    );
  }

  addMember(teamId: number, pokemonId: number, pokemonName: string, pokemonImageUrl: string, slot: number) {
    return this.http.post<PokemonTeam>(`${this.base}/${teamId}/members`, {
      pokemonId, pokemonName, pokemonImageUrl, slot
    }).pipe(switchMap(() => this.load()));
  }

  removeMember(teamId: number, pokemonId: number) {
    return this.http.delete(`${this.base}/${teamId}/members/${pokemonId}`).pipe(
      switchMap(() => this.load())
    );
  }

  updateMember(teamId: number, memberId: number, data: {
    heldItem?: string|null; ability?: string|null; nature?: string|null;
    move1?: string|null; move2?: string|null; move3?: string|null; move4?: string|null;
    evHp: number; evAtk: number; evDef: number; evSpAtk: number; evSpDef: number; evSpeed: number;
    ivHp: number; ivAtk: number; ivDef: number; ivSpAtk: number; ivSpDef: number; ivSpeed: number;
  }) {
    return this.http.put(`${this.base}/${teamId}/members/${memberId}`, data).pipe(
      switchMap(() => this.load())
    );
  }

  deleteTeam(teamId: number) {
    return this.http.delete(`${this.base}/${teamId}`).pipe(
      switchMap(() => this.load())
    );
  }
}
