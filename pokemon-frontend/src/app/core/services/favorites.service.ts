import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Favorite } from '../models/pokemon.model';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private http = inject(HttpClient);
  private base = 'http://localhost:5279/api/favorites';

  favorites = signal<Favorite[]>([]);

  load() {
    return this.http.get<Favorite[]>(this.base).pipe(
      tap(data => this.favorites.set(data))
    );
  }

  add(pokemonId: number, pokemonName: string, pokemonImageUrl: string) {
    return this.http.post<Favorite>(this.base, { pokemonId, pokemonName, pokemonImageUrl }).pipe(
      tap(() => this.load().subscribe())
    );
  }

  remove(pokemonId: number) {
    return this.http.delete(`${this.base}/${pokemonId}`).pipe(
      tap(() => this.favorites.update(f => f.filter(x => x.pokemonId !== pokemonId)))
    );
  }

  isFavorite(pokemonId: number): boolean {
    return this.favorites().some(f => f.pokemonId === pokemonId);
  }
}
