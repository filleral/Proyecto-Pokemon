import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PokemonService } from '../../core/services/pokemon.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { PokemonCardComponent } from '../../shared/components/pokemon-card.component';

interface PokemonCard {
  id: number;
  name: string;
  types: string[];
  imageUrl: string;
}

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PokemonCardComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Explorar Pokémon</h1>
        <p class="page-subtitle">{{ total() | number }} pokémon disponibles</p>
      </div>

      <div class="search-bar">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearch()"
          placeholder="Buscar por nombre..."
          class="search-input"
        />
      </div>

      <div class="filters">
        <button class="filter-btn" [class.active]="selectedGen() === null" (click)="setGeneration(null)">
          Todos
        </button>
        <button *ngFor="let gen of generations"
          class="filter-btn"
          [class.active]="selectedGen() === gen.offset"
          (click)="setGeneration(gen.offset)">
          {{ gen.label }}
        </button>
      </div>

      <div class="grid" *ngIf="!loading(); else loadingTpl">
        <app-pokemon-card
          *ngFor="let p of displayedCards()"
          [id]="p.id"
          [name]="p.name"
          [types]="p.types"
          [imageUrl]="p.imageUrl"
          [isFavorite]="favService.isFavorite(p.id)"
          (favoriteToggle)="toggleFavorite(p)"
        />
      </div>

      <ng-template #loadingTpl>
        <div class="loading-grid">
          <div class="skeleton-card" *ngFor="let i of skeletons"></div>
        </div>
      </ng-template>

      <div class="pagination" *ngIf="!searchQuery && !loading()">
        <button class="page-btn" [disabled]="currentPage() === 0" (click)="prevPage()">← Anterior</button>
        <span class="page-info">Página {{ currentPage() + 1 }} de {{ totalPages() }}</span>
        <button class="page-btn" [disabled]="currentPage() >= totalPages() - 1" (click)="nextPage()">Siguiente →</button>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .page-header { margin-bottom: 2rem; }
    .page-title { font-size: 2rem; font-weight: 800; color: #1a1a2e; margin: 0; }
    .page-subtitle { color: #888; margin: 0.25rem 0 0; font-size: 0.9rem; }
    .search-bar { position: relative; max-width: 480px; margin-bottom: 1.5rem; }
    .search-icon {
      position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
      width: 18px; height: 18px; color: #aaa;
    }
    .search-input {
      width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem;
      border: 2px solid #f0f0f0; border-radius: 12px; font-size: 0.95rem;
      outline: none; transition: border-color 0.2s; background: white; box-sizing: border-box;
    }
    .search-input:focus { border-color: #e63946; }
    .filters { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
    .filter-btn {
      padding: 0.4rem 1rem; border: 2px solid #f0f0f0; border-radius: 999px;
      background: white; cursor: pointer; font-size: 0.85rem; font-weight: 500;
      color: #555; transition: all 0.2s;
    }
    .filter-btn:hover, .filter-btn.active { border-color: #e63946; color: #e63946; background: rgba(230,57,70,0.06); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.25rem; }
    .loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.25rem; }
    .skeleton-card {
      height: 240px; border-radius: 16px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%; animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-top: 2.5rem; }
    .page-btn {
      padding: 0.6rem 1.5rem; border: 2px solid #e63946; border-radius: 10px;
      background: white; color: #e63946; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .page-btn:hover:not(:disabled) { background: #e63946; color: white; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { font-size: 0.9rem; color: #666; font-weight: 500; }
  `]
})
export class PokemonListComponent implements OnInit {
  pokemonService = inject(PokemonService);
  favService = inject(FavoritesService);

  loading = signal(true);
  total = signal(0);
  cards = signal<PokemonCard[]>([]);
  currentPage = signal(0);
  selectedGen = signal<number | null>(null);
  searchQuery = '';
  pageSize = 40;
  skeletons = Array(20).fill(0);

  generations = [
    { label: 'Gen I',   offset: 0,   limit: 151 },
    { label: 'Gen II',  offset: 151, limit: 100 },
    { label: 'Gen III', offset: 251, limit: 135 },
    { label: 'Gen IV',  offset: 386, limit: 107 },
    { label: 'Gen V',   offset: 493, limit: 156 },
    { label: 'Gen VI',  offset: 649, limit: 72  },
    { label: 'Gen VII', offset: 721, limit: 88  },
    { label: 'Gen VIII',offset: 809, limit: 96  },
    { label: 'Gen IX',  offset: 905, limit: 120 },
  ];

  totalPages = computed(() => Math.ceil(this.total() / this.pageSize));

  displayedCards = computed(() => {
    if (this.searchQuery.trim()) {
      return this.cards().filter(c =>
        c.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    return this.cards();
  });

  ngOnInit() {
    this.loadPage(0, null);
    this.favService.load().subscribe();
  }

  loadPage(page: number, genOffset: number | null) {
    this.loading.set(true);
    this.cards.set([]);

    const gen = this.generations.find(g => g.offset === genOffset);
    const offset = gen ? gen.offset + page * this.pageSize : page * this.pageSize;
    const limit = gen
      ? Math.min(this.pageSize, gen.limit - page * this.pageSize)
      : this.pageSize;

    this.pokemonService.getList(limit > 0 ? limit : this.pageSize, offset).subscribe(resp => {
      this.total.set(gen ? gen.limit : resp.count);

      // Carga detalles de todos en paralelo con forkJoin (1 batch, no loop)
      const detailCalls = resp.results.map(item => {
        const id = this.pokemonService.extractIdFromUrl(item.url);
        return this.pokemonService.getDetail(id);
      });

      forkJoin(detailCalls).subscribe({
        next: details => {
          this.cards.set(details.map(d => ({
            id: d.id,
            name: d.name,
            types: d.types.map(t => t.type.name),
            imageUrl:
              d.sprites?.other?.['official-artwork']?.front_default ??
              this.pokemonService.getPokemonImageUrl(d.id),
          })));
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    });
  }

  onSearch() {}

  setGeneration(offset: number | null) {
    this.selectedGen.set(offset);
    this.currentPage.set(0);
    this.loadPage(0, offset);
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadPage(this.currentPage(), this.selectedGen());
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadPage(this.currentPage(), this.selectedGen());
    }
  }

  toggleFavorite(p: PokemonCard) {
    if (this.favService.isFavorite(p.id)) {
      this.favService.remove(p.id).subscribe();
    } else {
      this.favService.add(p.id, p.name, p.imageUrl).subscribe();
    }
  }
}
