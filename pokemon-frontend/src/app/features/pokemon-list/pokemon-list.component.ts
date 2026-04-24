import { Component, OnInit, inject, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, from } from 'rxjs';
import { mergeMap, toArray } from 'rxjs/operators';
import { PokemonService } from '../../core/services/pokemon.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { PokemonCardComponent } from '../../shared/components/pokemon-card.component';
import { TYPE_COLORS, TYPE_NAMES_ES } from '../../core/models/pokemon.model';

interface BasicPokemon { id: number; name: string; }

interface PokemonCard {
  id: number; name: string; types: string[]; imageUrl: string;
  weight: number; height: number; hp: number; attack: number;
  defense: number; spAtk: number; spDef: number; speed: number;
  total: number; baseExp: number;
}

type SortKey =
  | 'id-asc'  | 'id-desc'
  | 'name-asc'| 'name-desc'
  | 'weight-desc' | 'weight-asc'
  | 'height-desc' | 'height-asc'
  | 'hp-desc'     | 'attack-desc' | 'defense-desc'
  | 'spatk-desc'  | 'spdef-desc'
  | 'speed-desc'  | 'speed-asc'
  | 'total-desc'  | 'total-asc'
  | 'exp-desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'id-asc',      label: '🔢 Número ↑' },
  { value: 'id-desc',     label: '🔢 Número ↓' },
  { value: 'name-asc',    label: '🔤 Nombre A → Z' },
  { value: 'name-desc',   label: '🔤 Nombre Z → A' },
  { value: 'weight-desc', label: '⚖️ Más pesado primero' },
  { value: 'weight-asc',  label: '⚖️ Más ligero primero' },
  { value: 'height-desc', label: '📏 Más alto primero' },
  { value: 'height-asc',  label: '📏 Más bajo primero' },
  { value: 'hp-desc',     label: '❤️ Mayor PS' },
  { value: 'attack-desc', label: '⚔️ Mayor Ataque' },
  { value: 'defense-desc','label': '🛡️ Mayor Defensa' },
  { value: 'spatk-desc',  label: '🌀 Mayor Sp. Ataque' },
  { value: 'spdef-desc',  label: '🔮 Mayor Sp. Defensa' },
  { value: 'speed-desc',  label: '💨 Más rápido' },
  { value: 'speed-asc',   label: '🐢 Más lento' },
  { value: 'total-desc',  label: '⭐ Mayor total de stats' },
  { value: 'total-asc',   label: '⭐ Menor total de stats' },
  { value: 'exp-desc',    label: '🏅 Mayor exp. base' },
];

const GENS = [
  { label: 'Gen I',    offset: 0,   limit: 151 },
  { label: 'Gen II',   offset: 151, limit: 100 },
  { label: 'Gen III',  offset: 251, limit: 135 },
  { label: 'Gen IV',   offset: 386, limit: 107 },
  { label: 'Gen V',    offset: 493, limit: 156 },
  { label: 'Gen VI',   offset: 649, limit: 72  },
  { label: 'Gen VII',  offset: 721, limit: 88  },
  { label: 'Gen VIII', offset: 809, limit: 96  },
  { label: 'Gen IX',   offset: 905, limit: 120 },
];

const ALL_TYPES = Object.keys(TYPE_COLORS);
const PAGE_SIZE = 24;
const STAT_SORT_THRESHOLD = 400; // load all stats globally if filtered list ≤ this
const STAT_SORTS = new Set<SortKey>(['weight-desc','weight-asc','height-desc','height-asc','hp-desc','attack-desc','defense-desc','spatk-desc','spdef-desc','speed-desc','speed-asc','total-desc','total-asc','exp-desc']);

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PokemonCardComponent],
  template: `
    <div class="page">

      <!-- HEADER -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Pokédex</h1>
          <p class="page-subtitle">
            <ng-container *ngIf="loadingList()">Cargando Pokédex completa...</ng-container>
            <ng-container *ngIf="!loadingList()">
              {{ sortedList().length | number }} pokémon
              <span *ngIf="hasFilters()" class="subtitle-note">(filtrados de {{ allBasic().length | number }})</span>
            </ng-container>
          </p>
        </div>
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" class="search-icon">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" [ngModel]="searchQuery()" (ngModelChange)="onSearch($event)"
            placeholder="Buscar por nombre..." class="search-input" />
        </div>
      </div>

      <!-- GEN TABS -->
      <div class="gen-tabs">
        <button class="gen-tab" [class.active]="!genFilter()" (click)="setGen(null)">Todos</button>
        <button *ngFor="let g of GENS" class="gen-tab"
          [class.active]="genFilter()?.label === g.label"
          (click)="setGen(g)">{{ g.label }}</button>
      </div>

      <!-- FILTER ROW -->
      <div class="filter-row">
        <!-- TYPE CHIPS -->
        <div class="filter-section">
          <span class="filter-label">
            Tipo
            <span *ngIf="selectedTypes().length > 0" class="type-count">({{ selectedTypes().length }}/2)</span>
            <span *ngIf="loadingType()" class="loading-type">cargando...</span>
          </span>
          <div class="type-chips">
            <button *ngFor="let t of allTypes"
              class="type-chip"
              [class.selected]="selectedTypes().includes(t)"
              [class.dimmed]="selectedTypes().length >= 2 && !selectedTypes().includes(t)"
              [disabled]="loadingType()"
              [style.--tc]="typeColor(t)"
              (click)="toggleType(t)">
              {{ typeNameEs(t) }}
            </button>
          </div>
        </div>

        <!-- SORT SELECT -->
        <div class="filter-section sort-section">
          <span class="filter-label">Ordenar</span>
          <select class="sort-select" [ngModel]="sortKey()" (ngModelChange)="sortKey.set($event)">
            <option *ngFor="let o of sortOptions" [value]="o.value">{{ o.label }}</option>
          </select>
        </div>

        <!-- CLEAR -->
        <button class="btn-clear" *ngIf="hasFilters()" (click)="clearFilters()">
          ✕ Limpiar
        </button>
      </div>

      <!-- STAT LOADING / HINT -->
      <div class="stat-banner loading" *ngIf="loadingAllStats()">
        Cargando estadísticas para ordenar globalmente...
      </div>
      <div class="stat-banner hint" *ngIf="showStatHint() && !loadingAllStats()">
        Aplica un filtro de generación o tipo para ordenar por estadísticas en todas las páginas (máx. {{ STAT_SORT_THRESHOLD }} pokémon).
      </div>

      <!-- GRID -->
      <div class="grid" *ngIf="!loadingPage(); else loadingTpl">
        <app-pokemon-card
          *ngFor="let p of sortedCards()"
          [id]="p.id" [name]="p.name" [types]="p.types" [imageUrl]="p.imageUrl"
          [isFavorite]="favService.isFavorite(p.id)"
          (favoriteToggle)="toggleFavorite(p)"
        />
      </div>

      <div class="empty-state" *ngIf="!loadingPage() && !loadingList() && sortedList().length === 0">
        No hay Pokémon con esos filtros.
        <button class="btn-clear" style="margin-top:.5rem" (click)="clearFilters()">Limpiar filtros</button>
      </div>

      <ng-template #loadingTpl>
        <div class="loading-grid">
          <div class="skeleton-card" *ngFor="let i of skeletons"></div>
        </div>
      </ng-template>

      <!-- PAGINATION -->
      <div class="pagination" *ngIf="!loadingPage() && totalPages() > 1">
        <button class="page-btn" [disabled]="currentPage() === 0" (click)="goPage(currentPage() - 1)">← Ant.</button>
        <div class="page-numbers">
          <button *ngFor="let p of pageRange()" class="page-num"
            [class.active]="p === currentPage()"
            (click)="goPage(p)">{{ p + 1 }}</button>
        </div>
        <button class="page-btn" [disabled]="currentPage() >= totalPages()-1" (click)="goPage(currentPage() + 1)">Sig. →</button>
        <span class="page-info">{{ currentPage()+1 }} / {{ totalPages() }}</span>
      </div>

    </div>
  `,
  styles: [`
    .page { padding: 1.5rem 2rem; max-width: 1400px; margin: 0 auto; }

    /* HEADER */
    .page-header { display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;margin-bottom:1rem;flex-wrap:wrap; }
    .page-title { font-size:2rem;font-weight:800;color:#1a1a2e;margin:0; }
    .page-subtitle { color:#888;margin:.2rem 0 0;font-size:.85rem; }
    .subtitle-note { color:#e63946;font-weight:600; }
    .search-wrap { position:relative;min-width:260px; }
    .search-icon { position:absolute;left:.85rem;top:50%;transform:translateY(-50%);color:#aaa; }
    .search-input { width:100%;padding:.6rem 1rem .6rem 2.4rem;border:2px solid #eee;border-radius:12px;font-size:.9rem;outline:none;transition:border .2s;background:white;box-sizing:border-box; }
    .search-input:focus { border-color:#e63946; }

    /* GEN TABS */
    .gen-tabs { display:flex;gap:.3rem;flex-wrap:wrap;margin-bottom:.85rem;background:white;padding:.55rem .75rem;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06); }
    .gen-tab { padding:.3rem .7rem;border:1.5px solid #eee;border-radius:8px;background:none;cursor:pointer;font-size:.78rem;font-weight:600;color:#888;transition:all .15s; }
    .gen-tab:hover,.gen-tab.active { border-color:#e63946;color:#e63946;background:rgba(230,57,70,.06); }

    /* FILTER ROW */
    .filter-row { display:flex;align-items:flex-end;gap:1rem;flex-wrap:wrap;background:white;border-radius:12px;padding:.85rem 1rem;box-shadow:0 1px 4px rgba(0,0,0,.06);margin-bottom:1.1rem; }
    .filter-section { display:flex;flex-direction:column;gap:.35rem; }
    .sort-section { min-width:200px; }
    .filter-label { font-size:.68rem;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:.5px; }
    .loading-type { font-size:.65rem;font-weight:500;color:#e63946;text-transform:none;letter-spacing:0;animation:pulse 1s infinite alternate; }
    @keyframes pulse { from{opacity:.5} to{opacity:1} }

    /* TYPE CHIPS */
    .type-chips { display:flex;flex-wrap:wrap;gap:.25rem; }
    .type-chip {
      padding:.22rem .55rem;border-radius:999px;border:1.5px solid var(--tc);
      font-size:.7rem;font-weight:700;cursor:pointer;text-transform:capitalize;
      background:transparent;color:var(--tc);transition:all .15s;
    }
    .type-chip:hover { background:var(--tc);color:white;opacity:.85; }
    .type-chip.selected { background:var(--tc);color:white;box-shadow:0 2px 6px rgba(0,0,0,.2); }
    .type-chip.dimmed { opacity:.3;cursor:not-allowed; }
    .type-count { font-size:.65rem;font-weight:500;color:#e63946;text-transform:none;letter-spacing:0;margin-left:.25rem; }

    /* SORT SELECT */
    .sort-select { padding:.5rem .85rem;border:1.5px solid #eee;border-radius:10px;font-size:.85rem;color:#444;background:white;cursor:pointer;outline:none;transition:border .2s;width:100%; }
    .sort-select:focus { border-color:#e63946; }

    /* CLEAR */
    .btn-clear { padding:.42rem .9rem;border:1.5px solid #eee;border-radius:999px;background:none;font-size:.78rem;font-weight:600;color:#aaa;cursor:pointer;white-space:nowrap;transition:all .15s;align-self:flex-end; }
    .btn-clear:hover { border-color:#e63946;color:#e63946; }

    /* GRID */
    .grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:1.1rem; }
    .loading-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:1.1rem; }
    .skeleton-card { height:220px;border-radius:16px;background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.5s infinite; }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    .empty-state { text-align:center;padding:3rem;color:#aaa;font-size:.95rem;display:flex;flex-direction:column;align-items:center; }

    /* PAGINATION */
    .pagination { display:flex;align-items:center;justify-content:center;gap:.5rem;margin-top:2rem;flex-wrap:wrap; }
    .page-btn { padding:.45rem 1rem;border:1.5px solid #e63946;border-radius:8px;background:white;color:#e63946;font-weight:600;cursor:pointer;font-size:.82rem;transition:all .2s; }
    .page-btn:hover:not(:disabled) { background:#e63946;color:white; }
    .page-btn:disabled { opacity:.35;cursor:not-allowed; }
    .page-numbers { display:flex;gap:.25rem;flex-wrap:wrap; }
    .page-num { width:32px;height:32px;border:1.5px solid #eee;border-radius:8px;background:white;cursor:pointer;font-size:.78rem;font-weight:600;color:#888;transition:all .15s; }
    .page-num.active { border-color:#e63946;background:#e63946;color:white; }
    .page-info { font-size:.82rem;color:#aaa;margin-left:.25rem; }
    .stat-banner { padding:.55rem 1rem;border-radius:10px;font-size:.82rem;font-weight:500;margin-bottom:.85rem; }
    .stat-banner.loading { background:rgba(230,57,70,.08);color:#e63946;border:1px solid rgba(230,57,70,.2); animation:pulse 1s infinite alternate; }
    .stat-banner.hint { background:rgba(0,0,0,.04);color:#aaa;border:1px solid #eee; }
  `]
})
export class PokemonListComponent implements OnInit {
  private pokemonSvc = inject(PokemonService);
  favService = inject(FavoritesService);

  allBasic        = signal<BasicPokemon[]>([]);
  loadingList     = signal(true);
  genFilter       = signal<typeof GENS[0] | null>(null);
  selectedTypes   = signal<string[]>([]);
  searchQuery     = signal<string>('');
  sortKey         = signal<SortKey>('id-asc');
  typeIds         = signal<Set<number> | null>(null);
  loadingType     = signal(false);
  private typeIdCache = new Map<string, Set<number>>();
  loadingAllStats = signal(false);
  currentPage     = signal(0);
  pageCards       = signal<PokemonCard[]>([]);
  loadingPage     = signal(false);
  sortedList      = signal<BasicPokemon[]>([]);

  private cache        = new Map<number, PokemonCard>();
  private statsLoadId  = 0;

  skeletons   = Array(24).fill(0);
  GENS        = GENS;
  allTypes    = ALL_TYPES;
  sortOptions          = SORT_OPTIONS;
  STAT_SORT_THRESHOLD  = STAT_SORT_THRESHOLD;

  typeColor(t: string)  { return TYPE_COLORS[t] ?? '#999'; }
  typeNameEs(t: string) { return TYPE_NAMES_ES[t] ?? t; }

  filteredIds = computed(() => {
    if (this.loadingList()) return [];
    let list = this.allBasic();
    const gen = this.genFilter();
    if (gen) {
      const min = gen.offset + 1, max = gen.offset + gen.limit;
      list = list.filter(p => p.id >= min && p.id <= max);
    }
    const typeSet = this.typeIds();
    if (typeSet) list = list.filter(p => typeSet.has(p.id));
    const q = this.searchQuery().toLowerCase().trim();
    if (q) list = list.filter(p => p.name.includes(q));
    return list;
  });

  totalPages  = computed(() => Math.ceil(this.sortedList().length / PAGE_SIZE));
  sortedCards = computed(() => this.pageCards());
  hasFilters  = computed(() =>
    !!this.genFilter() || this.selectedTypes().length > 0 || !!this.searchQuery().trim() || this.sortKey() !== 'id-asc'
  );
  showStatHint = computed(() =>
    STAT_SORTS.has(this.sortKey()) && this.filteredIds().length > STAT_SORT_THRESHOLD
  );

  pageRange = computed(() => {
    const total = this.totalPages(), cur = this.currentPage();
    const start = Math.max(0, cur - 3), end = Math.min(total - 1, cur + 3);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  constructor() {
    effect(() => {
      const list = this.filteredIds();
      const k    = this.sortKey();
      untracked(() => this.refreshList(list, k));
    });
  }

  ngOnInit() {
    this.pokemonSvc.getList(1025, 0).subscribe(resp => {
      this.allBasic.set(
        resp.results
          .map(r => ({ name: r.name, id: this.pokemonSvc.extractIdFromUrl(r.url) }))
          .filter(p => p.id <= 1025)
          .sort((a, b) => a.id - b.id)
      );
      this.loadingList.set(false);
    });
    this.favService.load().subscribe();
  }

  private refreshList(list: BasicPokemon[], k: SortKey) {
    if (list.length === 0) {
      this.sortedList.set([]);
      this.pageCards.set([]);
      return;
    }

    if (!STAT_SORTS.has(k)) {
      const sorted = this.applyBasicSort(list, k);
      this.sortedList.set(sorted);
      this.currentPage.set(0);
      this.loadPageDetails(0, sorted);
      return;
    }

    // Stat sort: if list is too large, show hint and use natural order
    if (list.length > STAT_SORT_THRESHOLD) {
      this.sortedList.set(list);
      this.currentPage.set(0);
      this.loadPageDetails(0, list);
      return;
    }

    const missing = list.filter(p => !this.cache.has(p.id));
    if (missing.length === 0) {
      const sorted = this.applyStatSort(list, k);
      this.sortedList.set(sorted);
      this.currentPage.set(0);
      this.loadPageDetails(0, sorted);
      return;
    }

    // Fetch all missing stats then sort globally
    const myId = ++this.statsLoadId;
    this.loadingAllStats.set(true);
    this.loadingPage.set(true);
    this.pageCards.set([]);

    from(missing).pipe(
      mergeMap(p => this.pokemonSvc.getDetail(p.id), 30),
      toArray()
    ).subscribe({
      next: details => {
        if (this.statsLoadId !== myId) return;
        details.forEach(d => this.cacheCard(d));
      },
      complete: () => {
        if (this.statsLoadId !== myId) return;
        this.loadingAllStats.set(false);
        const sorted = this.applyStatSort(this.filteredIds(), this.sortKey());
        this.sortedList.set(sorted);
        this.currentPage.set(0);
        this.loadPageDetails(0, sorted);
      },
      error: () => {
        if (this.statsLoadId !== myId) return;
        this.loadingAllStats.set(false);
        this.sortedList.set(list);
        this.currentPage.set(0);
        this.loadPageDetails(0, list);
      }
    });
  }

  private applyBasicSort(list: BasicPokemon[], k: SortKey): BasicPokemon[] {
    if (k === 'id-desc')   return [...list].sort((a, b) => b.id - a.id);
    if (k === 'name-asc')  return [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (k === 'name-desc') return [...list].sort((a, b) => b.name.localeCompare(a.name));
    return list;
  }

  private applyStatSort(list: BasicPokemon[], k: SortKey): BasicPokemon[] {
    return [...list].sort((a, b) => {
      const ca = this.cache.get(a.id), cb = this.cache.get(b.id);
      if (!ca || !cb) return a.id - b.id;
      switch (k) {
        case 'weight-desc': return cb.weight - ca.weight;
        case 'weight-asc':  return ca.weight - cb.weight;
        case 'height-desc': return cb.height - ca.height;
        case 'height-asc':  return ca.height - cb.height;
        case 'hp-desc':     return cb.hp - ca.hp;
        case 'attack-desc': return cb.attack - ca.attack;
        case 'defense-desc':return cb.defense - ca.defense;
        case 'spatk-desc':  return cb.spAtk - ca.spAtk;
        case 'spdef-desc':  return cb.spDef - ca.spDef;
        case 'speed-desc':  return cb.speed - ca.speed;
        case 'speed-asc':   return ca.speed - cb.speed;
        case 'total-desc':  return cb.total - ca.total;
        case 'total-asc':   return ca.total - cb.total;
        case 'exp-desc':    return cb.baseExp - ca.baseExp;
        default:            return a.id - b.id;
      }
    });
  }

  private cacheCard(d: any): void {
    if (this.cache.has(d.id)) return;
    const stats: Record<string, number> = {};
    d.stats.forEach((s: any) => { stats[s.stat.name] = s.base_stat; });
    this.cache.set(d.id, {
      id: d.id, name: d.name,
      types: d.types.map((t: any) => t.type.name),
      imageUrl: d.sprites?.other?.['official-artwork']?.front_default ?? this.pokemonSvc.getPokemonImageUrl(d.id),
      weight: d.weight, height: d.height,
      hp: stats['hp'] ?? 0, attack: stats['attack'] ?? 0,
      defense: stats['defense'] ?? 0, spAtk: stats['special-attack'] ?? 0,
      spDef: stats['special-defense'] ?? 0, speed: stats['speed'] ?? 0,
      total: d.stats.reduce((s: number, x: any) => s + x.base_stat, 0),
      baseExp: d.base_experience ?? 0,
    });
  }

  private loadPageDetails(page: number, list: BasicPokemon[]) {
    const start  = page * PAGE_SIZE;
    const pageIds = list.slice(start, start + PAGE_SIZE).map(p => p.id);
    if (pageIds.length === 0) { this.pageCards.set([]); this.loadingPage.set(false); return; }

    const allCached = pageIds.every(id => this.cache.has(id));
    if (allCached) {
      this.pageCards.set(pageIds.map(id => this.cache.get(id)!));
      this.loadingPage.set(false);
      return;
    }

    this.loadingPage.set(true);
    const missing = pageIds.filter(id => !this.cache.has(id));

    forkJoin(missing.map(id => this.pokemonSvc.getDetail(id))).subscribe({
      next: details => {
        details.forEach(d => this.cacheCard(d));
        this.pageCards.set(pageIds.map(id => this.cache.get(id)!));
        this.loadingPage.set(false);
      },
      error: () => this.loadingPage.set(false),
    });
  }

  setGen(g: typeof GENS[0] | null) { this.genFilter.set(g); }

  toggleType(t: string) {
    const current = this.selectedTypes();
    if (current.includes(t)) {
      const next = current.filter(x => x !== t);
      this.selectedTypes.set(next);
      this.typeIds.set(this.intersectTypeIds(next));
      return;
    }
    if (current.length >= 2) return;

    const addType = (ids: Set<number>) => {
      this.typeIdCache.set(t, ids);
      const next = [...this.selectedTypes(), t];
      this.selectedTypes.set(next);
      this.typeIds.set(this.intersectTypeIds(next));
      this.loadingType.set(false);
    };

    if (this.typeIdCache.has(t)) {
      addType(this.typeIdCache.get(t)!);
      return;
    }

    this.loadingType.set(true);
    this.pokemonSvc.getTypePokemonIds(t).subscribe({
      next: ids => addType(ids),
      error: ()  => this.loadingType.set(false),
    });
  }

  private intersectTypeIds(types: string[]): Set<number> | null {
    if (types.length === 0) return null;
    const sets = types.map(t => this.typeIdCache.get(t)).filter(Boolean) as Set<number>[];
    if (sets.length === 0) return null;
    if (sets.length === 1) return sets[0];
    return new Set([...sets[0]].filter(id => sets[1].has(id)));
  }

  onSearch(q: string) { this.searchQuery.set(q); }

  goPage(page: number) {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadPageDetails(page, this.sortedList());
  }

  clearFilters() {
    this.genFilter.set(null);
    this.selectedTypes.set([]);
    this.typeIds.set(null);
    this.searchQuery.set('');
    this.sortKey.set('id-asc');
  }

  toggleFavorite(p: PokemonCard) {
    if (this.favService.isFavorite(p.id)) this.favService.remove(p.id).subscribe();
    else this.favService.add(p.id, p.name, p.imageUrl).subscribe();
  }
}
