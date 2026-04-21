import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PokemonListResponse, PokemonDetail } from '../models/pokemon.model';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private http = inject(HttpClient);
  private base = 'http://localhost:5000/api';

  getList(limit = 20, offset = 0): Observable<PokemonListResponse> {
    const params = new HttpParams().set('limit', limit).set('offset', offset);
    return this.http.get<PokemonListResponse>(`${this.base}/pokemon`, { params });
  }

  getDetail(idOrName: string | number): Observable<PokemonDetail> {
    return this.http.get<PokemonDetail>(`${this.base}/pokemon/${idOrName}`);
  }

  getPokemonImageUrl(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  extractIdFromUrl(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return parseInt(parts[parts.length - 1], 10);
  }
}
