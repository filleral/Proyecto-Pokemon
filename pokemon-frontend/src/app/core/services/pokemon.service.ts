import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  PokemonListResponse, PokemonDetail, PokemonEncounter,
  TypeDetail, PokemonSpecies, EvolutionChain, AbilityDetail
} from '../models/pokemon.model';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private http = inject(HttpClient);
  private pokeApi = 'https://pokeapi.co/api/v2';

  getList(limit = 40, offset = 0): Observable<PokemonListResponse> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<PokemonListResponse>(`${this.pokeApi}/pokemon`, { params });
  }

  getDetail(idOrName: string | number): Observable<PokemonDetail> {
    return this.http.get<PokemonDetail>(`${this.pokeApi}/pokemon/${idOrName}`);
  }

  getEncounters(idOrName: string | number): Observable<PokemonEncounter[]> {
    return this.http.get<PokemonEncounter[]>(`${this.pokeApi}/pokemon/${idOrName}/encounters`);
  }

  getTypeDetail(typeName: string): Observable<TypeDetail> {
    return this.http.get<TypeDetail>(`${this.pokeApi}/type/${typeName}`);
  }

  getTypePokemonIds(typeName: string): Observable<Set<number>> {
    return this.getTypeDetail(typeName).pipe(
      map(td => new Set(
        td.pokemon.map(entry => this.extractIdFromUrl(entry.pokemon.url))
      ))
    );
  }

  getPokemonSpecies(idOrName: string | number): Observable<PokemonSpecies> {
    return this.http.get<PokemonSpecies>(`${this.pokeApi}/pokemon-species/${idOrName}`);
  }

  getEvolutionChain(url: string): Observable<EvolutionChain> {
    return this.http.get<EvolutionChain>(url);
  }

  getAbility(url: string): Observable<AbilityDetail> {
    return this.http.get<AbilityDetail>(url);
  }

  getPokemonImageUrl(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  getSpriteUrl(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  }

  extractIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return parseInt(parts[parts.length - 1], 10);
  }
}
