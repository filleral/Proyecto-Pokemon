import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PokemonService } from '../../core/services/pokemon.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { TypeBadgeComponent } from '../../shared/components/type-badge.component';
import { PokemonDetail, TYPE_COLORS } from '../../core/models/pokemon.model';

@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  imports: [CommonModule, TypeBadgeComponent],
  template: `
    <div class="page" *ngIf="pokemon(); else loadingTpl">
      <div class="detail-container">
        <button class="back-btn" (click)="goBack()">← Volver</button>

        <div class="hero" [style.background]="heroGradient()">
          <div class="hero-info">
            <span class="pokemon-id">#{{ pokemon()!.id | number:'3.0-0' }}</span>
            <h1 class="pokemon-name">{{ pokemon()!.name }}</h1>
            <div class="types">
              <app-type-badge *ngFor="let t of pokemon()!.types" [type]="t.type.name" />
            </div>
            <div class="quick-stats">
              <div class="quick-stat">
                <span class="qs-value">{{ pokemon()!.height / 10 }}m</span>
                <span class="qs-label">Altura</span>
              </div>
              <div class="qs-divider"></div>
              <div class="quick-stat">
                <span class="qs-value">{{ pokemon()!.weight / 10 }}kg</span>
                <span class="qs-label">Peso</span>
              </div>
              <div class="qs-divider"></div>
              <div class="quick-stat">
                <span class="qs-value">{{ pokemon()!.base_experience }}</span>
                <span class="qs-label">Exp. Base</span>
              </div>
            </div>
          </div>
          <div class="hero-image">
            <img [src]="mainImage()" [alt]="pokemon()!.name" class="main-img" />
            <button class="fav-btn-hero" (click)="toggleFavorite()" [class.active]="isFav()">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"/>
              </svg>
              {{ isFav() ? 'En favoritos' : 'Añadir a favoritos' }}
            </button>
          </div>
        </div>

        <div class="content-grid">
          <div class="card-section">
            <h2 class="section-title">Estadísticas Base</h2>
            <div class="stats">
              <div class="stat-row" *ngFor="let s of pokemon()!.stats">
                <span class="stat-name">{{ formatStatName(s.stat.name) }}</span>
                <span class="stat-value">{{ s.base_stat }}</span>
                <div class="stat-bar-bg">
                  <div class="stat-bar" [style.width.%]="(s.base_stat / 255) * 100" [style.background]="statColor(s.base_stat)"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="card-section">
            <h2 class="section-title">Habilidades</h2>
            <div class="abilities">
              <div class="ability-item" *ngFor="let a of pokemon()!.abilities">
                <span class="ability-name">{{ a.ability.name }}</span>
                <span class="ability-tag" *ngIf="a.is_hidden">Oculta</span>
              </div>
            </div>

            <h2 class="section-title" style="margin-top:1.5rem">Sprites</h2>
            <div class="sprites">
              <img *ngIf="pokemon()!.sprites.front_default"
                [src]="pokemon()!.sprites.front_default" alt="front" class="sprite" />
              <img *ngIf="pokemon()!.sprites.front_shiny"
                [src]="pokemon()!.sprites.front_shiny" alt="shiny" class="sprite" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="loading-state">
        <div class="pokeball-spin"></div>
        <p>Cargando...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1100px; margin: 0 auto; }
    .back-btn {
      background: none; border: none; cursor: pointer; font-size: 0.9rem;
      color: #666; font-weight: 500; padding: 0; margin-bottom: 1.5rem;
      display: block;
    }
    .back-btn:hover { color: #e63946; }
    .hero {
      border-radius: 20px;
      padding: 2rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }
    .pokemon-id { font-size: 0.85rem; font-weight: 700; opacity: 0.5; color: #1a1a2e; }
    .pokemon-name {
      font-size: 2.5rem; font-weight: 800; text-transform: capitalize;
      color: #1a1a2e; margin: 0.25rem 0 0.75rem;
    }
    .types { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
    .quick-stats { display: flex; align-items: center; gap: 1.25rem; }
    .quick-stat { text-align: center; }
    .qs-value { display: block; font-size: 1.1rem; font-weight: 700; color: #1a1a2e; }
    .qs-label { font-size: 0.75rem; color: #888; }
    .qs-divider { width: 1px; height: 32px; background: rgba(0,0,0,0.12); }
    .hero-image { position: relative; flex-shrink: 0; }
    .main-img { width: 220px; height: 220px; object-fit: contain; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.15)); }
    .fav-btn-hero {
      display: flex; align-items: center; gap: 0.4rem;
      margin-top: 0.75rem; padding: 0.5rem 1rem;
      border: 2px solid rgba(0,0,0,0.15); border-radius: 999px;
      background: white; cursor: pointer; font-size: 0.85rem;
      font-weight: 600; color: #555; transition: all 0.2s;
      width: 100%; justify-content: center;
    }
    .fav-btn-hero:hover, .fav-btn-hero.active {
      border-color: #e63946; color: #e63946; background: rgba(230,57,70,0.06);
    }
    .content-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;
    }
    @media (max-width: 640px) {
      .hero { flex-direction: column; }
      .content-grid { grid-template-columns: 1fr; }
    }
    .card-section {
      background: white; border-radius: 16px;
      padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .section-title {
      font-size: 1rem; font-weight: 700; color: #1a1a2e;
      margin: 0 0 1rem; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .stat-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.6rem; }
    .stat-name { font-size: 0.8rem; color: #888; width: 90px; flex-shrink: 0; text-transform: capitalize; }
    .stat-value { font-size: 0.85rem; font-weight: 700; color: #1a1a2e; width: 32px; flex-shrink: 0; text-align: right; }
    .stat-bar-bg { flex: 1; height: 6px; background: #f0f0f0; border-radius: 999px; overflow: hidden; }
    .stat-bar { height: 100%; border-radius: 999px; transition: width 0.8s ease; }
    .abilities { display: flex; flex-direction: column; gap: 0.5rem; }
    .ability-item { display: flex; align-items: center; gap: 0.5rem; }
    .ability-name { text-transform: capitalize; font-size: 0.9rem; color: #333; font-weight: 500; }
    .ability-tag {
      font-size: 0.7rem; padding: 0.15rem 0.5rem;
      background: rgba(230,57,70,0.1); color: #e63946;
      border-radius: 999px; font-weight: 600;
    }
    .sprites { display: flex; gap: 1rem; }
    .sprite { width: 80px; height: 80px; object-fit: contain; }
    .loading-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 60vh; gap: 1rem; color: #888;
    }
    .pokeball-spin {
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(180deg, #e63946 50%, white 50%);
      border: 4px solid #1a1a2e;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PokemonDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  pokemonService = inject(PokemonService);
  favService = inject(FavoritesService);

  pokemon = signal<PokemonDetail | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.pokemonService.getDetail(id).subscribe(p => this.pokemon.set(p));
    this.favService.load().subscribe();
  }

  isFav() {
    return this.pokemon() ? this.favService.isFavorite(this.pokemon()!.id) : false;
  }

  mainImage(): string {
    const p = this.pokemon()!;
    return p.sprites.other?.['official-artwork']?.front_default
      ?? this.pokemonService.getPokemonImageUrl(p.id);
  }

  heroGradient(): string {
    const colors: Record<string, string> = {
      normal: '#e8e8d0', fire: '#fde8d0', water: '#d0dffe', electric: '#fef9d0',
      grass: '#d4f0d0', ice: '#d8f4f4', fighting: '#f0d0d0', poison: '#e8d0e8',
      ground: '#f4ead0', flying: '#ddd8f8', psychic: '#fdd0e0', bug: '#e4eccc',
      rock: '#ece0c0', ghost: '#d8d0e8', dragon: '#d8d0f8', dark: '#d8d0c8',
      steel: '#e4e4ec', fairy: '#fce8ec',
    };
    const types = this.pokemon()?.types ?? [];
    const c1 = colors[types[0]?.type.name] ?? '#f5f5f5';
    const c2 = types[1] ? (colors[types[1].type.name] ?? c1) : c1;
    return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
  }

  formatStatName(name: string): string {
    const map: Record<string, string> = {
      hp: 'HP', attack: 'Ataque', defense: 'Defensa',
      'special-attack': 'Sp. Atq', 'special-defense': 'Sp. Def', speed: 'Velocidad'
    };
    return map[name] ?? name;
  }

  statColor(value: number): string {
    if (value >= 100) return '#4CAF50';
    if (value >= 70) return '#8BC34A';
    if (value >= 50) return '#FFC107';
    return '#F44336';
  }

  toggleFavorite() {
    const p = this.pokemon()!;
    if (this.isFav()) {
      this.favService.remove(p.id).subscribe();
    } else {
      const img = this.mainImage();
      this.favService.add(p.id, p.name, img).subscribe();
    }
  }

  goBack() { this.router.navigate(['/pokemon']); }
}
