import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TypeBadgeComponent } from './type-badge.component';

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  imports: [CommonModule, RouterLink, TypeBadgeComponent],
  template: `
    <div class="card" [routerLink]="['/pokemon', id]">
      <div class="card-header" [style.background]="typeGradient">
        <span class="pokemon-id">#{{ id | number:'3.0-0' }}</span>
        <button class="fav-btn" (click)="onFavorite($event)" [class.active]="isFavorite">
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"/>
          </svg>
        </button>
        <img [src]="imageUrl" [alt]="name" class="pokemon-img" loading="lazy" />
      </div>
      <div class="card-body">
        <h3 class="pokemon-name">{{ name }}</h3>
        <div class="types">
          <app-type-badge *ngFor="let t of types" [type]="t" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      cursor: pointer;
      border-radius: 16px;
      overflow: hidden;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .card-header {
      position: relative;
      padding: 1.5rem 1rem 0.5rem;
      display: flex;
      justify-content: center;
      min-height: 140px;
    }
    .pokemon-id {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      font-size: 0.75rem;
      font-weight: 700;
      opacity: 0.5;
      color: #1a1a2e;
    }
    .fav-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 50%;
      color: rgba(255,255,255,0.7);
      transition: color 0.2s, transform 0.2s;
      z-index: 2;
    }
    .fav-btn:hover, .fav-btn.active {
      color: #e63946;
      transform: scale(1.2);
    }
    .pokemon-img {
      width: 110px;
      height: 110px;
      object-fit: contain;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));
      transition: transform 0.3s ease;
    }
    .card:hover .pokemon-img {
      transform: scale(1.08) translateY(-4px);
    }
    .card-body {
      padding: 0.75rem 1rem 1rem;
    }
    .pokemon-name {
      font-size: 1rem;
      font-weight: 700;
      text-transform: capitalize;
      color: #1a1a2e;
      margin: 0 0 0.5rem;
    }
    .types {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
  `]
})
export class PokemonCardComponent {
  @Input() id = 0;
  @Input() name = '';
  @Input() types: string[] = [];
  @Input() imageUrl = '';
  @Input() isFavorite = false;
  @Output() favoriteToggle = new EventEmitter<void>();

  get typeGradient(): string {
    const colors: Record<string, string> = {
      normal: '#e8e8d0', fire: '#fde8d0', water: '#d0dffe', electric: '#fef9d0',
      grass: '#d4f0d0', ice: '#d8f4f4', fighting: '#f0d0d0', poison: '#e8d0e8',
      ground: '#f4ead0', flying: '#ddd8f8', psychic: '#fdd0e0', bug: '#e4eccc',
      rock: '#ece0c0', ghost: '#d8d0e8', dragon: '#d8d0f8', dark: '#d8d0c8',
      steel: '#e4e4ec', fairy: '#fce8ec',
    };
    const first = this.types[0];
    const second = this.types[1];
    const c1 = colors[first] ?? '#f0f0f0';
    const c2 = second ? (colors[second] ?? c1) : c1;
    return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
  }

  onFavorite(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.favoriteToggle.emit();
  }
}
