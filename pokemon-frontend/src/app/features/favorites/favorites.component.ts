import { Component, OnInit, inject } from '@angular/core';
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

      <div class="empty-state" *ngIf="favService.favorites().length === 0">
        <div class="empty-icon">♡</div>
        <h3>Sin favoritos aún</h3>
        <p>Explora los pokémon y añade los que más te gusten.</p>
        <a routerLink="/pokemon" class="explore-btn">Explorar Pokémon</a>
      </div>

      <div class="grid" *ngIf="favService.favorites().length > 0">
        <div class="fav-card" *ngFor="let fav of favService.favorites()" [routerLink]="['/pokemon', fav.pokemonId]">
          <button class="remove-btn" (click)="remove($event, fav.pokemonId)">×</button>
          <img [src]="fav.pokemonImageUrl" [alt]="fav.pokemonName" class="fav-img" />
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
    .empty-state {
      text-align: center; padding: 5rem 1rem; color: #999;
    }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.25rem; color: #555; margin: 0 0 0.5rem; }
    .empty-state p { margin: 0 0 1.5rem; }
    .explore-btn {
      display: inline-block; padding: 0.75rem 2rem;
      background: #e63946; color: white; text-decoration: none;
      border-radius: 12px; font-weight: 600; transition: opacity 0.2s;
    }
    .explore-btn:hover { opacity: 0.85; }
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
    .fav-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 18px rgba(0,0,0,0.11);
    }
    .remove-btn {
      position: absolute; top: 0.4rem; right: 0.5rem;
      background: none; border: none; cursor: pointer;
      font-size: 1.2rem; color: #ccc; line-height: 1;
      transition: color 0.2s;
    }
    .remove-btn:hover { color: #e63946; }
    .fav-img { width: 90px; height: 90px; object-fit: contain; }
    .fav-name {
      display: block; text-transform: capitalize;
      font-weight: 600; color: #1a1a2e; font-size: 0.9rem;
      margin-top: 0.25rem;
    }
    .fav-id { display: block; font-size: 0.75rem; color: #aaa; }
  `]
})
export class FavoritesComponent implements OnInit {
  favService = inject(FavoritesService);

  ngOnInit() {
    this.favService.load().subscribe();
  }

  remove(event: Event, pokemonId: number) {
    event.stopPropagation();
    event.preventDefault();
    this.favService.remove(pokemonId).subscribe();
  }
}
