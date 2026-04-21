import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../core/services/favorites.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Favoritos</h1>
        <p class="page-subtitle">{{ favService.favorites().length }} pokémon guardados</p>
      </div>

      <!-- Cargando -->
      <div class="loading-state" *ngIf="loading()">
        <div class="pokeball-spin"></div>
        <p>Cargando favoritos...</p>
      </div>

      <!-- Error de conexión -->
      <div class="error-state" *ngIf="error() && !loading()">
        <div class="error-icon">⚠️</div>
        <h3>No se pudo conectar al servidor</h3>
        <p>Asegúrate de que el backend está corriendo en el puerto 5279.</p>
        <button class="retry-btn" (click)="loadFavorites()">Reintentar</button>
      </div>

      <!-- Sin favoritos -->
      <div class="empty-state" *ngIf="!loading() && !error() && favService.favorites().length === 0">
        <div class="empty-icon">♡</div>
        <h3>Sin favoritos aún</h3>
        <p>Explora los pokémon y añade los que más te gusten.</p>
        <a routerLink="/pokemon" class="explore-btn">Explorar Pokémon</a>
      </div>

      <!-- Grid de favoritos -->
      <div class="grid" *ngIf="!loading() && !error() && favService.favorites().length > 0">
        <div class="fav-card" *ngFor="let fav of favService.favorites()" [routerLink]="['/pokemon', fav.pokemonId]">
          <button class="remove-btn" (click)="remove($event, fav.pokemonId)" title="Eliminar">×</button>
          <div class="img-wrapper">
            <img
              [src]="fav.pokemonImageUrl || fallbackImg(fav.pokemonId)"
              [alt]="fav.pokemonName"
              class="fav-img"
              (error)="onImgError($event, fav.pokemonId)"
            />
          </div>
          <span class="fav-name">{{ fav.pokemonName }}</span>
          <span class="fav-id">#{{ fav.pokemonId | number:'3.0-0' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-title { font-size: 2rem; font-weight: 800; color: #1a1a2e; margin: 0; }
    .page-subtitle { color: #888; margin: 0.25rem 0 0; font-size: 0.9rem; }

    .loading-state, .error-state, .empty-state {
      text-align: center; padding: 5rem 1rem; color: #999;
    }
    .pokeball-spin {
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(180deg, #e63946 50%, white 50%);
      border: 4px solid #1a1a2e;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-icon, .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .error-state h3, .empty-state h3 { font-size: 1.25rem; color: #555; margin: 0 0 0.5rem; }
    .error-state p, .empty-state p { margin: 0 0 1.5rem; }

    .retry-btn, .explore-btn {
      display: inline-block; padding: 0.75rem 2rem;
      background: #e63946; color: white; text-decoration: none;
      border: none; border-radius: 12px; font-weight: 600;
      cursor: pointer; font-size: 1rem; transition: opacity 0.2s;
    }
    .retry-btn:hover, .explore-btn:hover { opacity: 0.85; }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }
    .fav-card {
      cursor: pointer; background: white; border-radius: 14px;
      padding: 1rem; text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
    }
    .fav-card:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(0,0,0,0.11); }
    .remove-btn {
      position: absolute; top: 0.4rem; right: 0.5rem;
      background: none; border: none; cursor: pointer;
      font-size: 1.2rem; color: #ccc; line-height: 1;
      transition: color 0.2s; z-index: 1;
    }
    .remove-btn:hover { color: #e63946; }
    .img-wrapper { width: 90px; height: 90px; margin: 0 auto; }
    .fav-img { width: 100%; height: 100%; object-fit: contain; }
    .fav-name {
      display: block; text-transform: capitalize;
      font-weight: 600; color: #1a1a2e; font-size: 0.9rem;
      margin-top: 0.25rem; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .fav-id { display: block; font-size: 0.75rem; color: #aaa; }
  `]
})
export class FavoritesComponent implements OnInit {
  favService = inject(FavoritesService);
  loading = signal(true);
  error = signal(false);

  ngOnInit() {
    this.loadFavorites();
  }

  loadFavorites() {
    this.loading.set(true);
    this.error.set(false);
    this.favService.load().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      }
    });
  }

  remove(event: Event, pokemonId: number) {
    event.stopPropagation();
    event.preventDefault();
    this.favService.remove(pokemonId).subscribe();
  }

  fallbackImg(pokemonId: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
  }

  onImgError(event: Event, pokemonId: number) {
    (event.target as HTMLImageElement).src = this.fallbackImg(pokemonId);
  }
}
