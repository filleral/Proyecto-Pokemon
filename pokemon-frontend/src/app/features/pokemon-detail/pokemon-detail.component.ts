import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PokemonService } from '../../core/services/pokemon.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { TypeBadgeComponent } from '../../shared/components/type-badge.component';
import {
  PokemonDetail, PokemonEncounter, TypeDetail, EvolutionChainLink, TYPE_COLORS, AbilityDetail, PokemonMoveEntry
} from '../../core/models/pokemon.model';

interface GameVersionInfo {
  name: string;
  label: string;
  bg: string;
  text: string;
  logo: string | null;
}

const L = (name: string) => `game-logos/${name}.png`;

const GAME_META: Record<string, { label: string; bg: string; logo: string | null }> = {
  'red':              { label: 'Pokémon Rojo',         bg: '#5a0000', logo: L('red') },
  'blue':             { label: 'Pokémon Azul',         bg: '#00008B', logo: L('blue') },
  'yellow':           { label: 'Pokémon Amarillo',     bg: '#7a5a00', logo: L('yellow') },
  'gold':             { label: 'Pokémon Oro',          bg: '#5a3a00', logo: L('gold') },
  'silver':           { label: 'Pokémon Plata',        bg: '#3a3a3a', logo: L('silver') },
  'crystal':          { label: 'Pokémon Cristal',      bg: '#083050', logo: L('crystal') },
  'ruby':             { label: 'Pokémon Rubí',         bg: '#5a000c', logo: L('ruby') },
  'sapphire':         { label: 'Pokémon Zafiro',       bg: '#001a6e', logo: L('sapphire') },
  'emerald':          { label: 'Pokémon Esmeralda',    bg: '#00391a', logo: L('emerald') },
  'firered':          { label: 'Pokémon Rojo Fuego',   bg: '#6b1800', logo: L('firered') },
  'leafgreen':        { label: 'Pokémon Verde Hoja',   bg: '#113300', logo: L('leafgreen') },
  'diamond':          { label: 'Pokémon Diamante',     bg: '#0d2b52', logo: L('diamond') },
  'pearl':            { label: 'Pokémon Perla',        bg: '#5c1530', logo: L('pearl') },
  'platinum':         { label: 'Pokémon Platino',      bg: '#1e1e28', logo: L('platinum') },
  'heartgold':        { label: 'HeartGold',            bg: '#4a2a00', logo: L('heartgold') },
  'soulsilver':       { label: 'SoulSilver',           bg: '#1e1e3e', logo: L('soulsilver') },
  'black':            { label: 'Pokémon Negro',        bg: '#0a0a0a', logo: L('black') },
  'white':            { label: 'Pokémon Blanco',       bg: '#2a2a36', logo: L('white') },
  'black-2':          { label: 'Pokémon Negro 2',      bg: '#12121e', logo: L('black-2') },
  'white-2':          { label: 'Pokémon Blanco 2',     bg: '#222230', logo: L('white-2') },
  'x':                { label: 'Pokémon X',            bg: '#011e38', logo: L('x') },
  'y':                { label: 'Pokémon Y',            bg: '#420000', logo: L('y') },
  'omega-ruby':       { label: 'Omega Rubí',           bg: '#420008', logo: L('omega-ruby') },
  'alpha-sapphire':   { label: 'Alfa Zafiro',          bg: '#000e48', logo: L('alpha-sapphire') },
  'sun':              { label: 'Pokémon Sol',          bg: '#422000', logo: L('sun') },
  'moon':             { label: 'Pokémon Luna',         bg: '#120038', logo: L('moon') },
  'ultra-sun':        { label: 'Ultrasol',             bg: '#421500', logo: L('ultra-sun') },
  'ultra-moon':       { label: 'Ultraluna',            bg: '#070e40', logo: L('ultra-moon') },
  'lets-go-pikachu':  { label: "Let's Go Pikachu",    bg: '#3a2a00', logo: L('lets-go-pikachu') },
  'lets-go-eevee':    { label: "Let's Go Eevee",      bg: '#2e1800', logo: L('lets-go-eevee') },
  'sword':            { label: 'Pokémon Espada',       bg: '#002244', logo: L('sword') },
  'shield':           { label: 'Pokémon Escudo',       bg: '#420808', logo: L('shield') },
  'brilliant-diamond':{ label: 'Diamante Brillante',  bg: '#0e1e38', logo: L('brilliant-diamond') },
  'shining-pearl':    { label: 'Perla Reluciente',     bg: '#3e0e20', logo: L('shining-pearl') },
  'legends-arceus':   { label: 'Leyendas: Arceus',    bg: '#1e1000', logo: L('legends-arceus') },
  'scarlet':          { label: 'Pokémon Escarlata',    bg: '#380000', logo: L('scarlet') },
  'violet':           { label: 'Pokémon Púrpura',      bg: '#130025', logo: L('violet') },
};

const VG_ORDER = [
  'red-blue','yellow','gold-silver','crystal','ruby-sapphire','emerald',
  'firered-leafgreen','diamond-pearl','platinum','heartgold-soulsilver',
  'black-white','black-2-white-2','x-y','omega-ruby-alpha-sapphire',
  'sun-moon','ultra-sun-ultra-moon','lets-go-pikachu-lets-go-eevee',
  'sword-shield','brilliant-diamond-and-shining-pearl','legends-arceus',
  'scarlet-violet',
];

const VG_LABELS: Record<string, string> = {
  'red-blue':                          'Rojo / Azul',
  'yellow':                            'Amarillo',
  'gold-silver':                       'Oro / Plata',
  'crystal':                           'Cristal',
  'ruby-sapphire':                     'Rubí / Zafiro',
  'emerald':                           'Esmeralda',
  'firered-leafgreen':                 'Rojo Fuego / Verde Hoja',
  'diamond-pearl':                     'Diamante / Perla',
  'platinum':                          'Platino',
  'heartgold-soulsilver':              'HeartGold / SoulSilver',
  'black-white':                       'Negro / Blanco',
  'black-2-white-2':                   'Negro 2 / Blanco 2',
  'x-y':                               'X / Y',
  'omega-ruby-alpha-sapphire':         'Omega Rubí / Alfa Zafiro',
  'sun-moon':                          'Sol / Luna',
  'ultra-sun-ultra-moon':              'Ultrasol / Ultraluna',
  'lets-go-pikachu-lets-go-eevee':     "Let's Go",
  'sword-shield':                      'Espada / Escudo',
  'brilliant-diamond-and-shining-pearl':'Diamante Brillante / Perla Reluciente',
  'legends-arceus':                    'Leyendas: Arceus',
  'scarlet-violet':                    'Escarlata / Púrpura',
};

const METHOD_ORDER = ['level-up', 'machine', 'egg', 'tutor'];
const METHOD_LABELS: Record<string, string> = {
  'level-up': 'Por nivel',
  'machine':  'Máquinas (MT / MO)',
  'egg':      'Movimientos huevo',
  'tutor':    'Tutor de movimientos',
};

interface MoveGroup {
  method: string;
  label: string;
  moves: { name: string; level: number }[];
}

interface EvoNode {
  name: string;
  id: number;
  sprite: string;
  trigger: string;
  triggerImage: string | null;
  isCurrent: boolean;
}

interface OffEntry {
  typeName: string;
  x4: string[];
  x2: string[];
  x05: string[];
  x0: string[];
}

interface EnrichedAbility {
  nameEs: string;
  nameEn: string;
  isHidden: boolean;
  slot: number;
  description: string;
  howToGet: string;
}

@Component({
  selector: 'app-pokemon-detail',
  standalone: true,
  imports: [CommonModule, TypeBadgeComponent],
  template: `
    <div class="page" *ngIf="pokemon(); else loadingTpl">
      <div class="detail-container">
        <button class="back-btn" (click)="goBack()">← Volver</button>

        <!-- HERO -->
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
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"/>
              </svg>
              {{ isFav() ? 'En favoritos' : 'Añadir a favoritos' }}
            </button>
          </div>
        </div>

        <!-- TAB NAVBAR -->
        <nav class="detail-tabs">
          <button class="tab-btn" [class.tab-btn--active]="activeTab()==='stats'"     (click)="activeTab.set('stats')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Estadísticas
          </button>
          <button class="tab-btn" [class.tab-btn--active]="activeTab()==='moves'"     (click)="activeTab.set('moves')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Movimientos
          </button>
          <button class="tab-btn" [class.tab-btn--active]="activeTab()==='types'"     (click)="activeTab.set('types')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Tipos
          </button>
          <button class="tab-btn" [class.tab-btn--active]="activeTab()==='captura'"   (click)="activeTab.set('captura')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>
            Captura
          </button>
        </nav>

        <!-- ── ESTADÍSTICAS ───────────────────────────────────────── -->
        <ng-container *ngIf="activeTab()==='stats'">
          <div class="content-grid">
            <div class="card-section stat-card">
              <h2 class="section-title">Estadísticas (Nv. 100)</h2>
              <div class="stat-table-header">
                <span class="sh-label">Stat</span>
                <span class="sh-val">Min</span>
                <span class="sh-val sh-base">Base</span>
                <span class="sh-val">Máx</span>
                <span class="sh-bar"></span>
              </div>
              <div class="stat-row" *ngFor="let s of pokemon()!.stats">
                <span class="stat-name">{{ formatStatName(s.stat.name) }}</span>
                <span class="stat-val stat-min">{{ calcMin(s.stat.name, s.base_stat) }}</span>
                <span class="stat-val stat-base">{{ s.base_stat }}</span>
                <span class="stat-val stat-max">{{ calcMax(s.stat.name, s.base_stat) }}</span>
                <div class="stat-bar-bg">
                  <div class="stat-bar" [style.width.%]="(s.base_stat/255)*100" [style.background]="statColor(s.base_stat)"></div>
                </div>
              </div>
              <div class="stat-legend">
                <span class="legend-item"><span class="dot dot-min"></span>Mínimo (0 IV, -naturaleza)</span>
                <span class="legend-item"><span class="dot dot-max"></span>Máximo (31 IV, 252 EV, +naturaleza)</span>
              </div>
            </div>
            <div class="card-section">
              <h2 class="section-title">Habilidades</h2>
              <ng-container *ngIf="abilityDetails().length; else abilitiesLoadingTpl">
                <div class="ability-card" *ngFor="let ab of abilityDetails()">
                  <div class="ab-header">
                    <span class="ab-name">{{ ab.nameEs }}</span>
                    <span class="ab-tag ab-tag--hidden" *ngIf="ab.isHidden">Oculta</span>
                    <span class="ab-tag ab-tag--slot1" *ngIf="!ab.isHidden && ab.slot === 1">Principal</span>
                    <span class="ab-tag ab-tag--slot2" *ngIf="!ab.isHidden && ab.slot === 2">Secundaria</span>
                  </div>
                  <p class="ab-desc" *ngIf="ab.description">{{ ab.description }}</p>
                  <div class="ab-how">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                    {{ ab.howToGet }}
                  </div>
                </div>
              </ng-container>
              <ng-template #abilitiesLoadingTpl>
                <div class="abilities">
                  <div class="ability-item" *ngFor="let a of pokemon()!.abilities">
                    <span class="ability-name">{{ a.ability.name }}</span>
                    <span class="ability-tag" *ngIf="a.is_hidden">Oculta</span>
                  </div>
                </div>
              </ng-template>
              <h2 class="section-title" style="margin-top:1.5rem">Sprites</h2>
              <div class="sprites">
                <div class="sprite-wrap" *ngIf="pokemon()!.sprites.front_default">
                  <img [src]="pokemon()!.sprites.front_default" alt="Normal" class="sprite" />
                  <span class="sprite-label">Normal</span>
                </div>
                <div class="sprite-wrap" *ngIf="pokemon()!.sprites.front_shiny">
                  <img [src]="pokemon()!.sprites.front_shiny" alt="Shiny" class="sprite" />
                  <span class="sprite-label">✨ Shiny</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Evolución dentro de Estadísticas -->
          <div class="card-section evo-card" *ngIf="evoChain().length > 1">
            <h2 class="section-title" style="text-align:center">Cadena de evolución</h2>
            <div class="evo-chain evo-chain--centered">
              <ng-container *ngFor="let stage of evoChain(); let i = index">
                <div class="evo-arrow-col" *ngIf="i > 0">
                  <div class="evo-arrow-group" *ngFor="let node of stage">
                    <img *ngIf="node.triggerImage" [src]="node.triggerImage" [alt]="node.trigger" class="evo-item-img" />
                    <div class="evo-trigger">{{ node.trigger }}</div>
                    <svg class="evo-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2" width="22" height="22"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </div>
                </div>
                <div class="evo-stage">
                  <a class="evo-node" *ngFor="let node of stage" [class.evo-current]="node.isCurrent" (click)="navigateToPokemon(node.id)">
                    <div class="evo-sprite-wrap"><img [src]="node.sprite" [alt]="node.name" class="evo-sprite" /></div>
                    <span class="evo-name">{{ node.name }}</span>
                  </a>
                </div>
              </ng-container>
            </div>
          </div>
        </ng-container>

        <!-- ── MOVIMIENTOS ────────────────────────────────────────── -->
        <ng-container *ngIf="activeTab()==='moves'">
          <div class="card-section moves-card" *ngIf="availableVGs().length">

          <!-- version group selector -->
          <div class="vg-selector">
            <button class="vg-pill"
              *ngFor="let vg of availableVGs()"
              [class.vg-pill--active]="selectedVG() === vg"
              (click)="selectedVG.set(vg)">
              {{ vgLabel(vg) }}
            </button>
          </div>

          <!-- move groups -->
          <div class="move-group" *ngFor="let group of movesByMethod()">
            <div class="mg-header">
              <span class="mg-label" [class]="'mg-label--' + group.method">{{ group.label }}</span>
              <span class="mg-count">{{ group.moves.length }}</span>
            </div>

            <!-- level-up: table with level column -->
            <div class="moves-table" *ngIf="group.method === 'level-up'">
              <div class="move-row move-row--header">
                <span class="mr-level">Nv.</span>
                <span class="mr-name">Movimiento</span>
              </div>
              <div class="move-row" *ngFor="let mv of group.moves">
                <span class="mr-level">{{ mv.level === 0 ? '—' : mv.level }}</span>
                <span class="mr-name">{{ formatMoveName(mv.name) }}</span>
              </div>
            </div>

            <!-- other methods: grid of move chips -->
            <div class="moves-grid" *ngIf="group.method !== 'level-up'">
              <span class="move-chip" *ngFor="let mv of group.moves">{{ formatMoveName(mv.name) }}</span>
            </div>
          </div>
          </div>
        </ng-container>

        <!-- ── TIPOS ──────────────────────────────────────────────── -->
        <ng-container *ngIf="activeTab()==='types'">
          <div class="card-section type-card" *ngIf="defChartGroups().length || offEntries().length">
            <div class="type-chart-grid">
              <div class="chart-col">
                <p class="chart-subtitle">🛡 Defensa — recibe daño de</p>
                <ng-container *ngFor="let group of defChartGroups()">
                  <div class="eff-row" *ngIf="group.types.length">
                    <span class="eff-label" [class]="'eff-'+group.key">{{ group.label }}</span>
                    <div class="eff-types"><app-type-badge *ngFor="let t of group.types" [type]="t" /></div>
                  </div>
                </ng-container>
              </div>
              <div class="chart-col">
                <p class="chart-subtitle">⚔️ Ataque — movimientos</p>
                <div class="off-type-block" *ngFor="let entry of offEntries()">
                  <div class="off-type-header"><app-type-badge [type]="entry.typeName" /></div>
                  <div class="eff-row" *ngIf="entry.x2.length">
                    <span class="eff-label eff-x2">×2 Súper eficaz</span>
                    <div class="eff-types"><app-type-badge *ngFor="let t of entry.x2" [type]="t" /></div>
                  </div>
                  <div class="eff-row" *ngIf="entry.x05.length">
                    <span class="eff-label eff-x05">×½ Poco eficaz</span>
                    <div class="eff-types"><app-type-badge *ngFor="let t of entry.x05" [type]="t" /></div>
                  </div>
                  <div class="eff-row" *ngIf="entry.x0.length">
                    <span class="eff-label eff-x0">×0 Sin efecto</span>
                    <div class="eff-types"><app-type-badge *ngFor="let t of entry.x0" [type]="t" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- ── CAPTURA ────────────────────────────────────────────── -->
        <ng-container *ngIf="activeTab()==='captura'">
          <div class="card-section games-card" *ngIf="gameVersions().length">
            <h2 class="section-title">Aparece en estos juegos</h2>
            <div class="games-grid">
              <div class="game-badge" *ngFor="let g of gameVersions()" [style.background]="g.bg">
                <img *ngIf="g.logo" [src]="g.logo" [alt]="g.label" class="game-logo" />
                <span *ngIf="!g.logo" class="game-label-fallback" [style.color]="g.text">{{ g.label }}</span>
              </div>
            </div>
          </div>
          <div class="card-section encounters-card" *ngIf="encountersByGame().length">
            <h2 class="section-title">Dónde capturarlo</h2>
            <div class="enc-games-list">
              <div class="enc-game-row" *ngFor="let g of encountersByGame()">
                <div class="enc-game-header" [style.background]="g.bg">
                  <img *ngIf="g.logo" [src]="g.logo" [alt]="g.label" class="enc-game-logo" />
                  <span *ngIf="!g.logo" class="enc-game-label-fallback">{{ g.label }}</span>
                </div>
                <div class="enc-locations">
                  <div class="enc-location-item" *ngFor="let loc of g.locations">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13" class="enc-pin"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                    <span class="enc-loc-name">{{ loc.name }}</span>
                    <span class="enc-loc-level">Nv. {{ loc.minLevel }}–{{ loc.maxLevel }}</span>
                    <span class="enc-loc-method">{{ formatMethod(loc.method) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="card-section" *ngIf="encountersLoaded() && !encounters().length">
            <p class="no-encounters">No aparece en la naturaleza. Obtenlo por evolución, intercambio o evento.</p>
          </div>
        </ng-container>

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
    .back-btn { background:none;border:none;cursor:pointer;font-size:.9rem;color:#666;font-weight:500;padding:0;margin-bottom:1.5rem;display:block; }
    .back-btn:hover { color:#e63946; }

    .hero { border-radius:20px;padding:2rem 2.5rem;display:flex;justify-content:space-between;align-items:center;gap:2rem;margin-bottom:1.25rem; }
    .pokemon-id { font-size:.85rem;font-weight:700;opacity:.5;color:#1a1a2e; }
    .pokemon-name { font-size:2.5rem;font-weight:800;text-transform:capitalize;color:#1a1a2e;margin:.25rem 0 .75rem; }
    .types { display:flex;gap:.5rem;margin-bottom:1.25rem; }
    .quick-stats { display:flex;align-items:center;gap:1.25rem; }
    .quick-stat { text-align:center; }
    .qs-value { display:block;font-size:1.1rem;font-weight:700;color:#1a1a2e; }
    .qs-label { font-size:.75rem;color:#888; }
    .qs-divider { width:1px;height:32px;background:rgba(0,0,0,.12); }
    .hero-image { position:relative;flex-shrink:0;text-align:center; }
    .main-img { width:220px;height:220px;object-fit:contain;filter:drop-shadow(0 8px 16px rgba(0,0,0,.15)); }
    .fav-btn-hero { display:flex;align-items:center;gap:.4rem;margin-top:.75rem;padding:.5rem 1rem;border:2px solid rgba(0,0,0,.15);border-radius:999px;background:white;cursor:pointer;font-size:.85rem;font-weight:600;color:#555;transition:all .2s;width:100%;justify-content:center; }
    .fav-btn-hero:hover,.fav-btn-hero.active { border-color:#e63946;color:#e63946;background:rgba(230,57,70,.06); }

    /* TAB NAVBAR */
    .detail-tabs { display:flex;gap:.25rem;background:white;border-radius:14px;padding:.35rem;box-shadow:0 2px 8px rgba(0,0,0,.06);margin-bottom:1.25rem;overflow-x:auto;scrollbar-width:none; }
    .detail-tabs::-webkit-scrollbar { display:none; }
    .tab-btn { display:flex;align-items:center;gap:.4rem;padding:.5rem .9rem;border:none;background:none;border-radius:10px;font-size:.8rem;font-weight:600;color:#888;cursor:pointer;transition:all .18s;white-space:nowrap;flex-shrink:0; }
    .tab-btn:hover { background:#f5f5f5;color:#444; }
    .tab-btn--active { background:#1a1a2e;color:#fff; }
    .tab-btn svg { opacity:.7; }
    .tab-btn--active svg { opacity:1; }

    .content-grid { display:grid;grid-template-columns:1.2fr .8fr;gap:1.25rem;margin-bottom:1.25rem; }
    @media(max-width:700px){ .hero{flex-direction:column} .content-grid{grid-template-columns:1fr} }

    .card-section { background:white;border-radius:16px;padding:1.5rem;box-shadow:0 2px 8px rgba(0,0,0,.06);margin-bottom:1.25rem; }
    .section-title { font-size:.85rem;font-weight:700;color:#1a1a2e;margin:0 0 1rem;text-transform:uppercase;letter-spacing:.5px; }

    .stat-table-header { display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem;padding-bottom:.4rem;border-bottom:1px solid #f0f0f0; }
    .sh-label { font-size:.72rem;color:#aaa;font-weight:600;width:82px;flex-shrink:0; }
    .sh-val { font-size:.72rem;color:#aaa;font-weight:600;width:36px;flex-shrink:0;text-align:center; }
    .sh-base { color:#555!important; }
    .sh-bar { flex:1; }
    .stat-row { display:flex;align-items:center;gap:.5rem;margin-bottom:.55rem; }
    .stat-name { font-size:.8rem;color:#888;width:82px;flex-shrink:0;text-transform:capitalize; }
    .stat-val { font-size:.82rem;font-weight:700;width:36px;flex-shrink:0;text-align:center; }
    .stat-min { color:#EF5350; } .stat-base { color:#1a1a2e; } .stat-max { color:#43A047; }
    .stat-bar-bg { flex:1;height:6px;background:#f0f0f0;border-radius:999px;overflow:hidden; }
    .stat-bar { height:100%;border-radius:999px;transition:width .8s ease; }
    .stat-legend { display:flex;flex-direction:column;gap:.3rem;margin-top:1rem;padding-top:.75rem;border-top:1px solid #f0f0f0; }
    .legend-item { display:flex;align-items:center;gap:.4rem;font-size:.72rem;color:#999; }
    .dot { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
    .dot-min { background:#EF5350; } .dot-max { background:#43A047; }

    .abilities { display:flex;flex-direction:column;gap:.5rem; }
    .ability-item { display:flex;align-items:center;gap:.5rem; }
    .ability-name { text-transform:capitalize;font-size:.9rem;color:#333;font-weight:500; }
    .ability-tag { font-size:.7rem;padding:.15rem .5rem;background:rgba(230,57,70,.1);color:#e63946;border-radius:999px;font-weight:600; }

    .ability-card { background:#f8f9fb;border-radius:12px;padding:.9rem 1rem;margin-bottom:.65rem;border-left:3px solid #ddd; }
    .ability-card:last-child { margin-bottom:0; }
    .ab-header { display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem; }
    .ab-name { font-size:.95rem;font-weight:700;color:#1a1a2e;text-transform:capitalize; }
    .ab-tag { font-size:.68rem;padding:.15rem .5rem;border-radius:999px;font-weight:700;white-space:nowrap; }
    .ab-tag--hidden { background:rgba(230,57,70,.12);color:#e63946; }
    .ab-tag--slot1  { background:rgba(33,150,243,.12);color:#1976d2; }
    .ab-tag--slot2  { background:rgba(76,175,80,.12);color:#388e3c; }
    .ab-desc { font-size:.82rem;color:#555;line-height:1.5;margin:0 0 .5rem; }
    .ab-how { display:flex;align-items:flex-start;gap:.35rem;font-size:.75rem;color:#888;line-height:1.4; }
    .ab-how svg { flex-shrink:0;margin-top:1px;color:#bbb; }
    .sprites { display:flex;gap:1.5rem; }
    .sprite-wrap { display:flex;flex-direction:column;align-items:center;gap:.25rem; }
    .sprite { width:80px;height:80px;object-fit:contain; }
    .sprite-label { font-size:.72rem;color:#888; }

    /* TYPE CHART */
    .type-card { }
    .type-chart-grid { display:grid;grid-template-columns:1fr 1fr;gap:2rem; }
    @media(max-width:700px){ .type-chart-grid{grid-template-columns:1fr} }
    .chart-subtitle { font-size:.78rem;font-weight:600;color:#888;margin:0 0 .75rem;text-transform:uppercase;letter-spacing:.5px; }
    .eff-row { display:flex;align-items:flex-start;gap:.6rem;margin-bottom:.6rem; }
    .eff-label {
      font-size:.7rem;font-weight:700;padding:.25rem .5rem;border-radius:6px;
      white-space:nowrap;flex-shrink:0;min-width:90px;text-align:center;
    }
    .eff-x4  { background:#B71C1C;color:#fff; }
    .eff-x2  { background:#E53935;color:#fff; }
    .eff-x1  { background:#9E9E9E;color:#fff; }
    .eff-x05 { background:#388E3C;color:#fff; }
    .eff-x025{ background:#1B5E20;color:#fff; }
    .eff-x0  { background:#424242;color:#fff; }
    .eff-types { display:flex;flex-wrap:wrap;gap:.3rem;align-items:center; }
    .off-type-block { margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid #f5f5f5; }
    .off-type-block:last-child { border-bottom:none;margin-bottom:0;padding-bottom:0; }
    .off-type-header { margin-bottom:.5rem; }

    /* EVOLUTION CHAIN */
    .evo-chain { display:flex;align-items:center;flex-wrap:wrap;gap:.5rem; }
    .evo-chain--centered { justify-content:center; }
    .evo-stage { display:flex;flex-direction:column;gap:.75rem;align-items:center; }
    .evo-arrow-col { display:flex;flex-direction:column;gap:.75rem;align-items:center; }
    .evo-arrow-group { display:flex;flex-direction:column;align-items:center;gap:.2rem; }
    .evo-item-img { width:32px;height:32px;object-fit:contain;image-rendering:pixelated; }
    .evo-trigger { font-size:.68rem;color:#888;font-weight:600;text-transform:capitalize;text-align:center;max-width:80px; }
    .evo-arrow-svg { opacity:.4; }
    .evo-node {
      display:flex;flex-direction:column;align-items:center;gap:.4rem;
      cursor:pointer;text-decoration:none;padding:.6rem;border-radius:14px;
      transition:all .2s;
    }
    .evo-node:hover { background:rgba(0,0,0,.05); }
    .evo-current .evo-sprite-wrap { box-shadow:0 0 0 3px #e63946; }
    .evo-sprite-wrap { width:96px;height:96px;border-radius:50%;background:#f5f5f5;display:flex;align-items:center;justify-content:center;overflow:hidden; }
    .evo-sprite { width:88px;height:88px;object-fit:contain;image-rendering:pixelated; }
    .evo-name { font-size:.8rem;font-weight:600;color:#1a1a2e;text-transform:capitalize;text-align:center; }

    /* GAMES */
    .games-grid { display:flex;flex-wrap:wrap;gap:.75rem; }
    .game-badge { display:flex;align-items:center;justify-content:center;width:130px;height:60px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.25);overflow:hidden;padding:.4rem .6rem; }
    .game-logo { max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 1px 3px rgba(0,0,0,.3)); }
    .game-label-fallback { font-size:.78rem;font-weight:700;text-align:center;line-height:1.2; }

    /* ENCOUNTERS */
    .enc-games-list { display:flex;flex-direction:column;gap:.75rem; }
    .enc-game-row { border-radius:12px;overflow:hidden;border:1px solid #ececec; }
    .enc-game-header { display:flex;align-items:center;justify-content:center;height:52px;padding:.5rem 1rem; }
    .enc-game-logo { max-height:38px;max-width:160px;object-fit:contain;filter:drop-shadow(0 1px 3px rgba(0,0,0,.35)); }
    .enc-game-label-fallback { font-size:.8rem;font-weight:700;color:#fff; }
    .enc-locations { padding:.5rem .75rem;display:flex;flex-direction:column;gap:.35rem;background:#fafafa; }
    .enc-location-item { display:flex;align-items:center;gap:.45rem;font-size:.8rem;color:#444; }
    .enc-pin { color:#e63946;flex-shrink:0; }
    .enc-loc-name { flex:1;font-weight:500; }
    .enc-loc-level { font-size:.72rem;color:#666;background:#eee;border-radius:999px;padding:.1rem .45rem;white-space:nowrap; }
    .enc-loc-method { font-size:.7rem;color:#999;text-transform:capitalize; }
    .no-encounters { font-size:.88rem;color:#888;margin:0; }

    /* MOVES */
    .vg-selector { display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:1.25rem; }
    .vg-pill { padding:.3rem .75rem;border-radius:999px;border:1.5px solid #e0e0e0;background:white;font-size:.72rem;font-weight:600;cursor:pointer;color:#666;transition:all .15s;white-space:nowrap; }
    .vg-pill:hover { border-color:#1976d2;color:#1976d2; }
    .vg-pill--active { background:#1976d2;border-color:#1976d2;color:#fff; }

    .move-group { margin-bottom:1.25rem; }
    .move-group:last-child { margin-bottom:0; }
    .mg-header { display:flex;align-items:center;gap:.5rem;margin-bottom:.6rem; }
    .mg-label { font-size:.72rem;font-weight:700;padding:.25rem .6rem;border-radius:6px;text-transform:uppercase;letter-spacing:.4px; }
    .mg-label--level-up { background:#e3f2fd;color:#1565c0; }
    .mg-label--machine  { background:#fce4ec;color:#c62828; }
    .mg-label--egg      { background:#f3e5f5;color:#6a1b9a; }
    .mg-label--tutor    { background:#e8f5e9;color:#2e7d32; }
    .mg-count { font-size:.72rem;color:#aaa;font-weight:600; }

    .moves-table { border-radius:10px;overflow:hidden;border:1px solid #f0f0f0; }
    .move-row { display:flex;align-items:center;gap:.75rem;padding:.35rem .75rem; }
    .move-row:nth-child(even) { background:#fafafa; }
    .move-row--header { background:#f5f5f5;font-size:.7rem;font-weight:700;color:#999;text-transform:uppercase;padding:.3rem .75rem; }
    .mr-level { width:32px;flex-shrink:0;font-size:.8rem;font-weight:700;color:#1976d2;text-align:center; }
    .mr-name  { font-size:.82rem;color:#333;font-weight:500; }

    .moves-grid { display:flex;flex-wrap:wrap;gap:.4rem; }
    .move-chip { padding:.28rem .65rem;background:#f5f5f5;border-radius:8px;font-size:.78rem;color:#444;font-weight:500;white-space:nowrap; }

    .loading-state { display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:1rem;color:#888; }
    .pokeball-spin { width:48px;height:48px;border-radius:50%;background:linear-gradient(180deg,#e63946 50%,white 50%);border:4px solid #1a1a2e;animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg) } }
  `]
})
export class PokemonDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  pokemonService = inject(PokemonService);
  favService = inject(FavoritesService);

  pokemon        = signal<PokemonDetail | null>(null);
  encounters     = signal<PokemonEncounter[]>([]);
  encountersLoaded = signal(false);
  evoChain       = signal<EvoNode[][]>([]);
  abilityDetails = signal<EnrichedAbility[]>([]);
  selectedVG     = signal<string>('');
  activeTab      = signal<string>('stats');
  private _defChart  = signal<Record<string, number>>({});
  private _offDetails = signal<TypeDetail[]>([]);

  availableVGs = computed(() => {
    const p = this.pokemon();
    if (!p) return [];
    const vgSet = new Set<string>();
    for (const m of p.moves) {
      for (const d of m.version_group_details) vgSet.add(d.version_group.name);
    }
    return VG_ORDER.filter(vg => vgSet.has(vg));
  });

  movesByMethod = computed<MoveGroup[]>(() => {
    const p = this.pokemon();
    const vg = this.selectedVG();
    if (!p || !vg) return [];
    const map = new Map<string, { name: string; level: number }[]>();
    for (const entry of p.moves) {
      const d = entry.version_group_details.find(x => x.version_group.name === vg);
      if (!d) continue;
      const meth = d.move_learn_method.name;
      if (!map.has(meth)) map.set(meth, []);
      map.get(meth)!.push({ name: entry.move.name, level: d.level_learned_at });
    }
    return METHOD_ORDER.filter(m => map.has(m)).map(m => {
      let moves = map.get(m)!;
      moves = m === 'level-up'
        ? moves.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
        : moves.sort((a, b) => a.name.localeCompare(b.name));
      return { method: m, label: METHOD_LABELS[m] ?? m.replace(/-/g, ' '), moves };
    });
  });

  // defensive groups for template
  defChartGroups = computed(() => {
    const chart = this._defChart();
    const all = Object.keys(TYPE_COLORS);
    const group = (key: string, mult: number) => ({
      key, label: this.multLabel(mult),
      types: all.filter(t => chart[t] === mult)
    });
    return [
      group('x4',   4),
      group('x2',   2),
      group('x05',  0.5),
      group('x025', 0.25),
      group('x0',   0),
    ].filter(g => g.types.length);
  });

  // offensive entries per Pokemon type
  offEntries = computed<OffEntry[]>(() => {
    const details = this._offDetails();
    return details.map(td => {
      const dr = td.damage_relations;
      const base2x = dr.double_damage_to.map(t => t.name);
      const base05 = dr.half_damage_to.map(t => t.name);
      const base0  = dr.no_damage_to.map(t => t.name);
      // 4x offensive: when two types both deal 2x to same defending type (dual-type move combo, rare but show it)
      // Standard: just show the single type matchup
      return {
        typeName: td.name,
        x4:  [] as string[],   // only shown if we had move combos; leave empty for single type
        x2:  base2x,
        x05: base05,
        x0:  base0,
      };
    });
  });

  encountersByGame = computed(() => {
    const map = new Map<string, { name: string; minLevel: number; maxLevel: number; method: string }[]>();
    for (const enc of this.encounters()) {
      for (const vd of enc.version_details) {
        const vName = vd.version.name;
        if (!map.has(vName)) map.set(vName, []);
        const detail = vd.encounter_details[0];
        map.get(vName)!.push({
          name: this.formatLocation(enc.location_area.name),
          minLevel: detail?.min_level ?? 0,
          maxLevel: detail?.max_level ?? 0,
          method: detail?.method?.name ?? '',
        });
      }
    }
    return Array.from(map.entries()).map(([version, locations]) => ({
      version,
      label: GAME_META[version]?.label ?? version,
      bg: GAME_META[version]?.bg ?? '#333',
      logo: GAME_META[version]?.logo ?? null,
      locations,
    }));
  });

  gameVersions = computed<GameVersionInfo[]>(() => {
    const p = this.pokemon();
    if (!p) return [];
    return p.game_indices.map(gi => {
      const name = gi.version.name;
      const meta = GAME_META[name];
      return { name, label: meta?.label ?? name, bg: meta?.bg ?? '#333', text: '#fff', logo: meta?.logo ?? null };
    });
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      pokemon:    this.pokemonService.getDetail(id),
      encounters: this.pokemonService.getEncounters(id),
    }).subscribe(({ pokemon, encounters }) => {
      this.pokemon.set(pokemon);
      this.encounters.set(encounters);
      this.encountersLoaded.set(true);
      const vgs = this.availableVGs();
      if (vgs.length) this.selectedVG.set(vgs[vgs.length - 1]);

      const typeNames = pokemon.types.map(t => t.type.name);
      forkJoin({
        types:     forkJoin(typeNames.map(t => this.pokemonService.getTypeDetail(t))),
        species:   this.pokemonService.getPokemonSpecies(pokemon.id),
        abilities: forkJoin(pokemon.abilities.map(a => this.pokemonService.getAbility(a.ability.url))),
      }).subscribe(({ types, species, abilities }) => {
        this._offDetails.set(types);
        this._defChart.set(this.buildDefChart(types));
        this.pokemonService.getEvolutionChain(species.evolution_chain.url)
          .subscribe(chain => this.evoChain.set(this.parseEvoChain(chain.chain, pokemon.name)));

        const enriched: EnrichedAbility[] = pokemon.abilities.map((a, i) => {
          const detail: AbilityDetail = abilities[i];
          const nameEs = detail.names.find(n => n.language.name === 'es')?.name ?? a.ability.name;
          const descEs = detail.flavor_text_entries
            .filter(f => f.language.name === 'es').pop()?.flavor_text;
          const descEn = detail.effect_entries
            .find(e => e.language.name === 'en')?.short_effect ?? '';
          const description = (descEs ?? descEn).replace(/\f/g, ' ').replace(/­/g, '');
          const howToGet = a.is_hidden
            ? 'Se obtiene en incursiones Max, criando con un progenitor que tenga la habilidad oculta, o mediante Pokémon HOME.'
            : a.slot === 1
              ? 'Habilidad principal — la mayoría de ejemplares capturados la tendrán.'
              : 'Algunos ejemplares la tendrán en lugar de la habilidad principal.';
          return { nameEs, nameEn: a.ability.name, isHidden: a.is_hidden, slot: a.slot, description, howToGet };
        });
        this.abilityDetails.set(enriched);
      });
    });
    this.favService.load().subscribe();
  }

  // ── Type chart ──────────────────────────────────────────────────────────────

  private buildDefChart(typeDetails: TypeDetail[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const atkType of Object.keys(TYPE_COLORS)) {
      let immune = false;
      let mult = 1;
      for (const td of typeDetails) {
        const dr = td.damage_relations;
        if (dr.no_damage_from.some(t => t.name === atkType)) { immune = true; break; }
        if (dr.double_damage_from.some(t => t.name === atkType)) mult *= 2;
        else if (dr.half_damage_from.some(t => t.name === atkType)) mult *= 0.5;
      }
      result[atkType] = immune ? 0 : mult;
    }
    return result;
  }

  multLabel(mult: number): string {
    const m: Record<number, string> = { 4: '×4 Hiperdébil', 2: '×2 Débil', 0.5: '×½ Resistente', 0.25: '×¼ Muy resistente', 0: '×0 Inmune' };
    return m[mult] ?? `×${mult}`;
  }

  // ── Evolution chain ─────────────────────────────────────────────────────────

  private parseEvoChain(link: EvolutionChainLink, currentName: string): EvoNode[][] {
    const stages: EvoNode[][] = [];
    const baseId = this.pokemonService.extractIdFromUrl(link.species.url);
    stages.push([{ name: link.species.name, id: baseId, sprite: this.pokemonService.getSpriteUrl(baseId), trigger: '', triggerImage: null, isCurrent: link.species.name === currentName }]);

    let current = link.evolves_to;
    while (current.length) {
      stages.push(current.map(evo => {
        const id = this.pokemonService.extractIdFromUrl(evo.species.url);
        const detail = evo.evolution_details[0];
        return { name: evo.species.name, id, sprite: this.pokemonService.getSpriteUrl(id), trigger: this.formatTrigger(detail), triggerImage: this.getTriggerImage(detail), isCurrent: evo.species.name === currentName };
      }));
      current = current.flatMap(e => e.evolves_to);
    }
    return stages;
  }

  private getTriggerImage(d: EvolutionChainLink['evolution_details'][0] | undefined): string | null {
    if (!d) return null;
    const item = d.item ?? d.held_item;
    if (item) return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item.name}.png`;
    return null;
  }

  private formatTrigger(d: EvolutionChainLink['evolution_details'][0] | undefined): string {
    if (!d) return '';
    const t = d.trigger.name;
    if (t === 'level-up') {
      if (d.min_level)     return `Nv. ${d.min_level}`;
      if (d.min_happiness) return 'Felicidad alta';
      if (d.min_beauty)    return 'Belleza alta';
      if (d.known_move)    return d.known_move.name.replace(/-/g, ' ');
      if (d.location)      return 'Lugar especial';
      if (d.time_of_day === 'day')   return 'Subir niv. (día)';
      if (d.time_of_day === 'night') return 'Subir niv. (noche)';
      return 'Subir nivel';
    }
    if (t === 'use-item')  return d.item ? d.item.name.replace(/-/g, ' ') : 'Usar objeto';
    if (t === 'trade')     return d.held_item ? `Intercambio (${d.held_item.name.replace(/-/g, ' ')})` : d.trade_species ? `Intercambio con ${d.trade_species.name}` : 'Intercambio';
    if (t === 'shed')      return 'Shedinja';
    if (t === 'spin')      return 'Girar';
    if (t === 'take-damage')        return 'Recibir daño';
    if (t === 'three-critical-hits') return '3 críticos';
    return t.replace(/-/g, ' ');
  }

  // ── Misc ────────────────────────────────────────────────────────────────────

  navigateToPokemon(id: number) { this.router.navigate(['/pokemon', id]); }

  isFav() { return this.pokemon() ? this.favService.isFavorite(this.pokemon()!.id) : false; }

  mainImage(): string {
    const p = this.pokemon()!;
    return p.sprites.other?.['official-artwork']?.front_default ?? this.pokemonService.getPokemonImageUrl(p.id);
  }

  heroGradient(): string {
    const c: Record<string, string> = {
      normal:'#e8e8d0',fire:'#fde8d0',water:'#d0dffe',electric:'#fef9d0',grass:'#d4f0d0',ice:'#d8f4f4',
      fighting:'#f0d0d0',poison:'#e8d0e8',ground:'#f4ead0',flying:'#ddd8f8',psychic:'#fdd0e0',bug:'#e4eccc',
      rock:'#ece0c0',ghost:'#d8d0e8',dragon:'#d8d0f8',dark:'#d8d0c8',steel:'#e4e4ec',fairy:'#fce8ec',
    };
    const types = this.pokemon()?.types ?? [];
    const c1 = c[types[0]?.type.name] ?? '#f5f5f5';
    const c2 = types[1] ? (c[types[1].type.name] ?? c1) : c1;
    return `linear-gradient(135deg,${c1} 0%,${c2} 100%)`;
  }

  formatStatName(name: string): string {
    const m: Record<string,string> = { hp:'HP',attack:'Ataque',defense:'Defensa','special-attack':'Sp. Atq','special-defense':'Sp. Def',speed:'Velocidad' };
    return m[name] ?? name;
  }
  statColor(v: number) { return v>=100?'#4CAF50':v>=70?'#8BC34A':v>=50?'#FFC107':'#F44336'; }
  calcMax(n: string, b: number) { return n==='hp'?2*b+204:Math.floor((2*b+94+5)*1.1); }
  calcMin(n: string, b: number) { return n==='hp'?2*b+110:Math.floor((2*b+5)*.9); }
  formatLocation(name: string) { return name.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }
  formatMethod(name: string): string {
    const m: Record<string,string> = { 'walk':'Hierba','surf':'Surf','old-rod':'Caña vieja','good-rod':'Buena caña','super-rod':'Super caña','rock-smash':'Romperroca','headbutt':'Cabezazo','gift':'Regalo','only-one':'Único' };
    return m[name] ?? name.replace(/-/g,' ');
  }
  gameLabel(name: string) { return GAME_META[name]?.label ?? name; }
  gameColor(name: string) { return GAME_META[name]?.bg ?? '#888'; }
  vgLabel(vg: string) { return VG_LABELS[vg] ?? vg.replace(/-/g, ' '); }
  formatMoveName(name: string) { return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

  toggleFavorite() {
    const p = this.pokemon()!;
    if (this.isFav()) this.favService.remove(p.id).subscribe();
    else this.favService.add(p.id, p.name, this.mainImage()).subscribe();
  }
  goBack() { this.router.navigate(['/pokemon']); }
}
