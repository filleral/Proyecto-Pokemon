import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, forkJoin } from 'rxjs';
import { ProgressService, PokedexEntry } from '../../core/services/progress.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { GameProgressDetail, CaughtPokemonDto } from '../../core/models/progress.model';
import { TYPE_COLORS, TYPE_NAMES_ES } from '../../core/models/pokemon.model';

const GAME_META: Record<string, { label: string; bg: string; logo: string }> = {
  'red':              { label: 'Pokémon Rojo',       bg: '#5a0000', logo: 'game-logos/red.png' },
  'blue':             { label: 'Pokémon Azul',        bg: '#00008B', logo: 'game-logos/blue.png' },
  'yellow':           { label: 'Pokémon Amarillo',    bg: '#7a5a00', logo: 'game-logos/yellow.png' },
  'gold':             { label: 'Pokémon Oro',         bg: '#5a3a00', logo: 'game-logos/gold.png' },
  'silver':           { label: 'Pokémon Plata',       bg: '#3a3a3a', logo: 'game-logos/silver.png' },
  'crystal':          { label: 'Pokémon Cristal',     bg: '#083050', logo: 'game-logos/crystal.png' },
  'ruby':             { label: 'Pokémon Rubí',        bg: '#5a000c', logo: 'game-logos/ruby.png' },
  'sapphire':         { label: 'Pokémon Zafiro',      bg: '#001a6e', logo: 'game-logos/sapphire.png' },
  'emerald':          { label: 'Pokémon Esmeralda',   bg: '#00391a', logo: 'game-logos/emerald.png' },
  'firered':          { label: 'Rojo Fuego',          bg: '#6b1800', logo: 'game-logos/firered.png' },
  'leafgreen':        { label: 'Verde Hoja',          bg: '#113300', logo: 'game-logos/leafgreen.png' },
  'diamond':          { label: 'Pokémon Diamante',    bg: '#0d2b52', logo: 'game-logos/diamond.png' },
  'pearl':            { label: 'Pokémon Perla',       bg: '#5c1530', logo: 'game-logos/pearl.png' },
  'platinum':         { label: 'Pokémon Platino',     bg: '#1e1e28', logo: 'game-logos/platinum.png' },
  'heartgold':        { label: 'HeartGold',           bg: '#4a2a00', logo: 'game-logos/heartgold.png' },
  'soulsilver':       { label: 'SoulSilver',          bg: '#1e1e3e', logo: 'game-logos/soulsilver.png' },
  'black':            { label: 'Pokémon Negro',       bg: '#0a0a0a', logo: 'game-logos/black.png' },
  'white':            { label: 'Pokémon Blanco',      bg: '#2a2a36', logo: 'game-logos/white.png' },
  'black-2':          { label: 'Pokémon Negro 2',     bg: '#12121e', logo: 'game-logos/black-2.png' },
  'white-2':          { label: 'Pokémon Blanco 2',    bg: '#222230', logo: 'game-logos/white-2.png' },
  'x':                { label: 'Pokémon X',           bg: '#011e38', logo: 'game-logos/x.png' },
  'y':                { label: 'Pokémon Y',           bg: '#420000', logo: 'game-logos/y.png' },
  'omega-ruby':       { label: 'Omega Rubí',          bg: '#420008', logo: 'game-logos/omega-ruby.png' },
  'alpha-sapphire':   { label: 'Alfa Zafiro',         bg: '#000e48', logo: 'game-logos/alpha-sapphire.png' },
  'sun':              { label: 'Pokémon Sol',         bg: '#422000', logo: 'game-logos/sun.png' },
  'moon':             { label: 'Pokémon Luna',        bg: '#120038', logo: 'game-logos/moon.png' },
  'ultra-sun':        { label: 'Ultrasol',            bg: '#421500', logo: 'game-logos/ultra-sun.png' },
  'ultra-moon':       { label: 'Ultraluna',           bg: '#070e40', logo: 'game-logos/ultra-moon.png' },
  'lets-go-pikachu':  { label: "Let's Go Pikachu",   bg: '#3a2a00', logo: 'game-logos/lets-go-pikachu.png' },
  'lets-go-eevee':    { label: "Let's Go Eevee",     bg: '#2e1800', logo: 'game-logos/lets-go-eevee.png' },
  'sword':            { label: 'Pokémon Espada',      bg: '#002244', logo: 'game-logos/sword.png' },
  'shield':           { label: 'Pokémon Escudo',      bg: '#420808', logo: 'game-logos/shield.png' },
  'brilliant-diamond':{ label: 'Diamante Brillante', bg: '#0e1e38', logo: 'game-logos/brilliant-diamond.png' },
  'shining-pearl':    { label: 'Perla Reluciente',    bg: '#3e0e20', logo: 'game-logos/shining-pearl.png' },
  'legends-arceus':   { label: 'Leyendas: Arceus',   bg: '#1e1000', logo: 'game-logos/legends-arceus.png' },
  'scarlet':          { label: 'Pokémon Escarlata',   bg: '#380000', logo: 'game-logos/scarlet.png' },
  'violet':           { label: 'Pokémon Púrpura',     bg: '#130025', logo: 'game-logos/violet.png' },
};

const BOX_SIZE = 30;

interface GridEntry extends PokedexEntry {
  sprite: string;
  artwork: string;
  seen: boolean;
  caughtNormal: boolean;
  caughtShiny: boolean;
}

interface Box {
  label: string;
  entries: GridEntry[];
}

interface ModalData {
  entry: GridEntry;
  types: string[];
  loadingTypes: boolean;
}

interface EncounterGame {
  game: string;
  locations: { name: string; minLv: number; maxLv: number }[];
}

interface PokemonDetailData {
  id: number;
  name: string;
  artwork: string;
  types: string[];
  stats: { name: string; value: number }[];
  height: number;
  weight: number;
  encounters: EncounterGame[];
  loading: boolean;
}

@Component({
  selector: 'app-progress-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" *ngIf="progress(); else loadingTpl">

      <!-- HEADER -->
      <div class="detail-header" [style.background]="gameMeta().bg">
        <button class="back-btn" (click)="goBack()">← Volver</button>
        <img [src]="gameMeta().logo" [alt]="gameMeta().label" class="header-logo" />
        <div class="header-info">
          <div class="header-trainer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            {{ progress()!.trainerName }}
          </div>
          <div class="header-date">Iniciado el {{ progress()!.startedAt | date:'dd/MM/yyyy' }}</div>
        </div>
      </div>

      <!-- STATS BAR -->
      <div class="stats-bar">
        <div class="stat-chip">
          <span class="chip-num">{{ totalDex() }}</span>
          <span class="chip-lbl">Pokédex</span>
        </div>
        <div class="stat-chip blue">
          <span class="chip-num">{{ totalSeen() }}</span>
          <span class="chip-lbl">👁 Vistos</span>
        </div>
        <div class="stat-chip green">
          <span class="chip-num">{{ totalCaught() }}</span>
          <span class="chip-lbl">✓ Capturados</span>
        </div>
        <div class="stat-chip gold">
          <span class="chip-num">{{ totalShiny() }}</span>
          <span class="chip-lbl">✨ Shiny</span>
        </div>
        <div class="stat-chip gray">
          <span class="chip-num">{{ totalDex() - totalCaught() }}</span>
          <span class="chip-lbl">Faltan</span>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="totalDex() ? (totalCaught() / totalDex()) * 100 : 0"></div>
          </div>
          <span class="progress-pct">{{ totalDex() ? ((totalCaught() / totalDex()) * 100 | number:'1.0-1') : 0 }}%</span>
        </div>
      </div>

      <!-- ACTION BUTTONS -->
      <div class="actions-bar">
        <div class="actions-left">
          <div class="finished-badge" *ngIf="progress()!.finishedAt">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>
            Completado el {{ progress()!.finishedAt | date:'dd/MM/yyyy' }}
          </div>
        </div>
        <div class="actions-right">
          <button class="act-btn act-reset" (click)="confirmReset.set(true)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            Reiniciar
          </button>
          <button class="act-btn act-finish" *ngIf="!progress()!.finishedAt" (click)="confirmFinish.set(true)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Finalizar juego
          </button>
          <button class="act-btn act-resume" *ngIf="progress()!.finishedAt" (click)="doResume()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Retomar juego
          </button>
        </div>
      </div>

      <!-- FILTER -->
      <div class="filter-row">
        <button class="filter-btn" [class.active]="filter() === 'all'"     (click)="filter.set('all')">Todos</button>
        <button class="filter-btn" [class.active]="filter() === 'seen'"    (click)="filter.set('seen')">👁 Vistos</button>
        <button class="filter-btn" [class.active]="filter() === 'caught'"  (click)="filter.set('caught')">✓ Capturados</button>
        <button class="filter-btn" [class.active]="filter() === 'shiny'"   (click)="filter.set('shiny')">✨ Shiny</button>
        <button class="filter-btn" [class.active]="filter() === 'missing'" (click)="filter.set('missing')">Faltan</button>
      </div>

      <!-- BOXES -->
      <div class="boxes-container" *ngIf="!loadingDex(); else dexLoading">
        <div class="box-section" *ngFor="let box of visibleBoxes()">
          <div class="box-header">{{ box.label }}</div>
          <div class="box-grid">
            <div class="dex-cell"
              *ngFor="let e of box.entries"
              [class.state-seen]="e.seen && !e.caughtNormal && !e.caughtShiny"
              [class.state-caught]="e.caughtNormal && !e.caughtShiny"
              [class.state-shiny]="e.caughtShiny"
              [class.state-none]="!e.seen && !e.caughtNormal && !e.caughtShiny"
              (click)="openModal(e)">
              <span class="cell-num">#{{ e.pokemonId }}</span>
              <img [src]="e.sprite" [alt]="e.pokemonName" class="cell-sprite"
                   [class.sprite-grey]="!e.seen && !e.caughtNormal && !e.caughtShiny"
                   [class.sprite-shiny]="e.caughtShiny" />
              <span class="cell-name">{{ e.pokemonName }}</span>
              <div class="cell-status">
                <span class="status-dot dot-seen"   *ngIf="e.seen && !e.caughtNormal && !e.caughtShiny">👁</span>
                <span class="status-dot dot-caught" *ngIf="e.caughtNormal">✓</span>
                <span class="status-dot dot-shiny"  *ngIf="e.caughtShiny">✨</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #dexLoading>
        <div class="loading-dex">
          <div class="pokeball-spin"></div>
          <p>Cargando Pokédex...</p>
        </div>
      </ng-template>
    </div>

    <!-- MODAL -->
    <div class="modal-overlay" *ngIf="modal()" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <!-- artwork with type gradient background -->
        <div class="modal-hero" [style.background]="typeGradient()">
          <img [src]="modal()!.entry.artwork" [alt]="modal()!.entry.pokemonName" class="modal-artwork" />
        </div>

        <div class="modal-body">
          <div class="modal-num">#{{ modal()!.entry.pokemonId }}</div>
          <div class="modal-name">{{ modal()!.entry.pokemonName }}</div>

          <!-- type badges -->
          <div class="modal-types" *ngIf="!modal()!.loadingTypes">
            <span class="type-badge" *ngFor="let t of modal()!.types" [style.background]="typeColor(t)">{{ typeNameEs(t) }}</span>
          </div>
          <div class="types-loading" *ngIf="modal()!.loadingTypes">Cargando tipos...</div>

          <!-- 3 action buttons -->
          <div class="modal-actions">
            <button class="action-btn btn-seen"
              [class.active]="modal()!.entry.seen"
              (click)="toggle('seen')">
              <span class="btn-icon">👁</span>
              <span class="btn-label">Visto</span>
            </button>
            <button class="action-btn btn-caught"
              [class.active]="modal()!.entry.caughtNormal"
              (click)="toggle('normal')">
              <span class="btn-icon">✓</span>
              <span class="btn-label">Capturado</span>
            </button>
            <button class="action-btn btn-shiny"
              [class.active]="modal()!.entry.caughtShiny"
              (click)="toggle('shiny')">
              <span class="btn-icon">✨</span>
              <span class="btn-label">Shiny</span>
            </button>
          </div>

          <!-- ver detalles -->
          <button class="btn-details" (click)="viewDetails()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Ver en Pokédex
          </button>

          <button class="btn-close" (click)="closeModal()">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- CONFIRM RESET MODAL -->
    <div class="modal-overlay" *ngIf="confirmReset()" (click)="confirmReset.set(false)">
      <div class="modal action-modal" (click)="$event.stopPropagation()">
        <div class="action-modal-icon reset-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="30" height="30"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
        </div>
        <h2 class="action-modal-title">Reiniciar progreso</h2>
        <p class="action-modal-msg">Se borrarán todos los Pokémon vistos, capturados y shiny. Esta acción no se puede deshacer.</p>
        <div class="action-modal-btns">
          <button class="btn-cancel" (click)="confirmReset.set(false)">Cancelar</button>
          <button class="btn-danger" (click)="doReset()">Sí, reiniciar</button>
        </div>
      </div>
    </div>

    <!-- CONFIRM FINISH MODAL -->
    <div class="modal-overlay" *ngIf="confirmFinish()" (click)="confirmFinish.set(false)">
      <div class="modal action-modal" (click)="$event.stopPropagation()">
        <div class="action-modal-icon finish-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="30" height="30"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h2 class="action-modal-title">Finalizar juego</h2>
        <p class="action-modal-msg">Se guardará la fecha de hoy como fecha de finalización. Podrás retomar el juego en cualquier momento.</p>
        <div class="action-modal-btns">
          <button class="btn-cancel" (click)="confirmFinish.set(false)">Cancelar</button>
          <button class="btn-success" (click)="doFinish()">Sí, finalizar</button>
        </div>
      </div>
    </div>

    <ng-template #loadingTpl>
      <div class="loading-state">
        <div class="pokeball-spin"></div>
        <p>Cargando...</p>
      </div>
    </ng-template>

    <!-- POKÉMON DETAIL POPUP -->
    <div class="dm-overlay" *ngIf="detailModal()" (click)="closeDetailModal()">
      <div class="dm-popup" (click)="$event.stopPropagation()">

        <!-- Loading state -->
        <div class="dm-loading" *ngIf="detailModal()!.loading">
          <div class="pokeball-spin"></div>
          <p>Cargando datos...</p>
        </div>

        <ng-container *ngIf="!detailModal()!.loading">
          <!-- Hero -->
          <div class="dm-hero" [style.background]="detailTypeGradient()">
            <button class="dm-x" (click)="closeDetailModal()">✕</button>
            <img [src]="detailModal()!.artwork" class="dm-artwork" [alt]="detailModal()!.name" />
          </div>

          <div class="dm-scroll">
            <div class="dm-title-row">
              <span class="dm-num">#{{ detailModal()!.id }}</span>
              <h2 class="dm-name">{{ detailModal()!.name }}</h2>
            </div>

            <div class="dm-types">
              <span class="type-badge" *ngFor="let t of detailModal()!.types" [style.background]="typeColor(t)">
                {{ typeNameEs(t) }}
              </span>
            </div>

            <div class="dm-physical">
              <span>📏 {{ (detailModal()!.height / 10).toFixed(1) }} m</span>
              <span>⚖️ {{ (detailModal()!.weight / 10).toFixed(1) }} kg</span>
            </div>

            <!-- Stats -->
            <div class="dm-section">Estadísticas base</div>
            <div class="dm-stats">
              <div class="dm-stat-row" *ngFor="let s of detailModal()!.stats">
                <span class="ds-label">{{ statNameEs(s.name) }}</span>
                <span class="ds-val">{{ s.value }}</span>
                <div class="ds-bar-bg">
                  <div class="ds-bar-fill" [style.width.%]="(s.value / 255) * 100" [style.background]="statColor(s.value)"></div>
                </div>
              </div>
            </div>

            <!-- Encounters -->
            <ng-container *ngIf="detailModal()!.encounters.length > 0">
              <div class="dm-section">Dónde encontrarlo</div>
              <div class="dm-encounters">
                <div class="enc-game-block" *ngFor="let eg of detailModal()!.encounters">
                  <div class="enc-game-header">
                    <img [src]="getGameLogo(eg.game)" class="enc-logo" (error)="hideImg($event)" />
                    <span class="enc-game-label">{{ getGameLabel(eg.game) }}</span>
                  </div>
                  <div class="enc-loc-row" *ngFor="let loc of eg.locations">
                    <span class="enc-loc-name">{{ loc.name }}</span>
                    <span class="enc-loc-lv">Nv. {{ loc.minLv }}–{{ loc.maxLv }}</span>
                  </div>
                </div>
              </div>
            </ng-container>
            <div class="dm-no-enc" *ngIf="detailModal()!.encounters.length === 0">
              No se encuentra en la naturaleza.
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; margin: 0 auto; padding-bottom: 2rem; }

    /* HEADER */
    .detail-header { display:flex;align-items:center;gap:1.25rem;padding:1.1rem 1.5rem;border-radius:0 0 16px 16px;margin-bottom:0; }
    .back-btn { background:rgba(255,255,255,.15);border:none;cursor:pointer;color:white;font-size:.82rem;font-weight:600;padding:.4rem .8rem;border-radius:8px;white-space:nowrap; }
    .back-btn:hover { background:rgba(255,255,255,.25); }
    .header-logo { max-height:44px;max-width:140px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,.4)); }
    .header-info { flex:1; }
    .header-trainer { display:flex;align-items:center;gap:.35rem;color:white;font-size:.9rem;font-weight:700; }
    .header-date { font-size:.72rem;color:rgba(255,255,255,.55);margin-top:.1rem; }

    /* STATS */
    .stats-bar { display:flex;align-items:center;flex-wrap:wrap;gap:.75rem 1.25rem;padding:.85rem 1.5rem;background:white;border-bottom:1px solid #f0f0f0; }
    .stat-chip { text-align:center;min-width:56px; }
    .chip-num { display:block;font-size:1.25rem;font-weight:800;color:#1a1a2e; }
    .stat-chip.blue  .chip-num { color:#1976D2; }
    .stat-chip.green .chip-num { color:#43A047; }
    .stat-chip.gold  .chip-num { color:#f4a00a; }
    .stat-chip.gray  .chip-num { color:#bbb; }
    .chip-lbl { font-size:.67rem;color:#aaa; }
    .progress-bar-wrap { flex:1;min-width:100px;display:flex;align-items:center;gap:.5rem; }
    .progress-bar { flex:1;height:7px;background:#f0f0f0;border-radius:999px;overflow:hidden; }
    .progress-fill { height:100%;background:linear-gradient(90deg,#43A047,#66BB6A);border-radius:999px;transition:width .5s; }
    .progress-pct { font-size:.75rem;font-weight:700;color:#43A047;white-space:nowrap; }

    /* FILTER */
    .filter-row { display:flex;gap:.4rem;flex-wrap:wrap;padding:.65rem 1.5rem;background:white;border-bottom:1px solid #f0f0f0; }
    .filter-btn { padding:.3rem .75rem;border:1.5px solid #e8e8e8;border-radius:999px;background:none;font-size:.78rem;font-weight:600;color:#888;cursor:pointer;transition:all .18s; }
    .filter-btn.active,.filter-btn:hover { border-color:#e63946;color:#e63946;background:rgba(230,57,70,.05); }

    /* BOXES */
    .boxes-container { padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:1.25rem; }
    .box-section { background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06); }
    .box-header { padding:.55rem 1rem;background:#f5f5f7;font-size:.78rem;font-weight:700;color:#555;letter-spacing:.3px;border-bottom:1px solid #ececec; }
    .box-grid { display:grid;grid-template-columns:repeat(6,1fr);gap:0; }

    /* CELL */
    .dex-cell {
      display:flex;flex-direction:column;align-items:center;
      padding:.6rem .3rem .4rem;cursor:pointer;
      border:1px solid #f0f0f0;transition:background .15s;
      position:relative;
    }
    .dex-cell:hover { background:#f9f9fb; }
    .state-seen   { background:#EFF6FF; }
    .state-caught { background:#F0FAF0; }
    .state-shiny  { background:#FFFBF0; }
    .state-none   { }

    .cell-num { font-size:.58rem;color:#ccc;font-weight:600;align-self:flex-start;line-height:1;padding-left:.15rem; }
    .cell-sprite { width:72px;height:72px;object-fit:contain; }
    .sprite-grey  { filter:grayscale(1) opacity(.25); }
    .sprite-shiny { filter:hue-rotate(180deg) saturate(1.8) brightness(1.05); }
    .cell-name { font-size:.6rem;font-weight:600;color:#333;text-transform:capitalize;text-align:center;line-height:1.2;margin-top:.15rem; }
    .cell-status { height:14px;display:flex;gap:.15rem;align-items:center; }
    .status-dot { font-size:.65rem;line-height:1; }

    /* MODAL */
    .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:300;padding:1rem; }
    .modal { background:white;border-radius:20px;width:100%;max-width:320px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.3); }

    .modal-hero { display:flex;align-items:center;justify-content:center;padding:1.5rem;min-height:160px;transition:background .3s; }
    .modal-artwork { width:130px;height:130px;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,.2)); }

    .modal-body { padding:1.1rem 1.25rem 1.25rem; }
    .modal-num { font-size:.78rem;color:#bbb;font-weight:600; }
    .modal-name { font-size:1.4rem;font-weight:800;color:#1a1a2e;text-transform:capitalize;margin:.1rem 0 .6rem; }
    .modal-types { display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.9rem; }
    .type-badge { font-size:.72rem;font-weight:700;color:white;padding:.2rem .6rem;border-radius:999px;text-transform:capitalize; }
    .types-loading { font-size:.75rem;color:#ccc;margin-bottom:.9rem; }

    /* 3 ACTION BUTTONS */
    .modal-actions { display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-bottom:.85rem; }
    .action-btn {
      display:flex;flex-direction:column;align-items:center;gap:.25rem;
      padding:.6rem .4rem;border:2px solid #e8e8e8;border-radius:12px;
      background:none;cursor:pointer;transition:all .18s;
    }
    .action-btn:hover { border-color:#bbb; }
    .btn-icon { font-size:1.2rem;line-height:1; }
    .btn-label { font-size:.68rem;font-weight:700;color:#888; }

    .btn-seen.active   { border-color:#1976D2;background:#EFF6FF; }
    .btn-seen.active .btn-label { color:#1976D2; }
    .btn-caught.active { border-color:#43A047;background:#F0FAF0; }
    .btn-caught.active .btn-label { color:#43A047; }
    .btn-shiny.active  { border-color:#f4a00a;background:#FFFBF0; }
    .btn-shiny.active .btn-label { color:#f4a00a; }

    .btn-details {
      width:100%;padding:.55rem;margin-bottom:.45rem;
      background:#1a1a2e;border:none;border-radius:10px;
      font-size:.82rem;font-weight:700;color:white;cursor:pointer;
      display:flex;align-items:center;justify-content:center;gap:.4rem;
      transition:background .18s;
    }
    .btn-details:hover { background:#2e2e4e; }
    .btn-close { width:100%;padding:.5rem;background:none;border:1.5px solid #ececec;border-radius:10px;font-size:.82rem;font-weight:600;color:#aaa;cursor:pointer; }
    .btn-close:hover { border-color:#ccc;color:#888; }

    /* LOADING */
    .loading-state,.loading-dex { display:flex;flex-direction:column;align-items:center;justify-content:center;height:50vh;gap:1rem;color:#888;font-size:.9rem; }
    .pokeball-spin { width:40px;height:40px;border-radius:50%;background:linear-gradient(180deg,#e63946 50%,white 50%);border:3px solid #1a1a2e;animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg) } }

    /* ACTIONS BAR */
    .actions-bar { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.6rem;padding:.75rem 1.5rem;background:white;border-bottom:1px solid #f0f0f0; }
    .actions-left { display:flex;align-items:center; }
    .actions-right { display:flex;align-items:center;gap:.5rem;flex-wrap:wrap; }
    .finished-badge { display:flex;align-items:center;gap:.4rem;font-size:.78rem;font-weight:700;color:#2e7d32;background:#e8f5e9;padding:.3rem .75rem;border-radius:999px; }
    .act-btn { display:flex;align-items:center;gap:.4rem;padding:.42rem .9rem;border:none;border-radius:10px;font-size:.78rem;font-weight:700;cursor:pointer;transition:all .18s;white-space:nowrap; }
    .act-reset  { background:#fff3f3;color:#c62828; }
    .act-reset:hover  { background:#ffcdd2; }
    .act-finish { background:#e8f5e9;color:#2e7d32; }
    .act-finish:hover { background:#c8e6c9; }
    .act-resume { background:#e3f2fd;color:#1565c0; }
    .act-resume:hover { background:#bbdefb; }

    /* ACTION MODALS */
    .action-modal { max-width:380px;text-align:center;padding:2.25rem 2rem; }
    .action-modal-icon { width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem; }
    .reset-icon  { background:rgba(198,40,40,.1);color:#c62828; }
    .finish-icon { background:rgba(46,125,50,.1);color:#2e7d32; }
    .action-modal-title { font-size:1.15rem;font-weight:800;color:#1a1a2e;margin:0 0 .6rem; }
    .action-modal-msg { font-size:.85rem;color:#888;line-height:1.55;margin:0 0 1.75rem; }
    .action-modal-btns { display:flex;gap:.75rem;justify-content:flex-end; }
    .btn-cancel { padding:.55rem 1.1rem;background:#f0f0f0;border:none;border-radius:10px;font-size:.88rem;font-weight:700;cursor:pointer;color:#555;transition:background .2s; }
    .btn-cancel:hover { background:#e0e0e0; }
    .btn-danger  { padding:.55rem 1.4rem;background:#e63946;color:white;border:none;border-radius:10px;font-size:.88rem;font-weight:700;cursor:pointer;transition:background .2s; }
    .btn-danger:hover  { background:#c1121f; }
    .btn-success { padding:.55rem 1.4rem;background:#2e7d32;color:white;border:none;border-radius:10px;font-size:.88rem;font-weight:700;cursor:pointer;transition:background .2s; }
    .btn-success:hover { background:#1b5e20; }

    /* DETAIL POPUP */
    .dm-overlay { position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:400;padding:1rem; }
    .dm-popup { background:white;border-radius:20px;width:100%;max-width:420px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.35); }
    .dm-loading { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem;gap:1rem;color:#888;font-size:.9rem; }

    .dm-hero { position:relative;display:flex;align-items:center;justify-content:center;padding:1.5rem 1rem 1rem;min-height:160px;flex-shrink:0;transition:background .3s; }
    .dm-x { position:absolute;top:.6rem;right:.7rem;background:rgba(0,0,0,.15);border:none;border-radius:50%;width:28px;height:28px;font-size:.85rem;cursor:pointer;color:#333;display:flex;align-items:center;justify-content:center; }
    .dm-x:hover { background:rgba(0,0,0,.25); }
    .dm-artwork { width:140px;height:140px;object-fit:contain;filter:drop-shadow(0 4px 14px rgba(0,0,0,.22)); }

    .dm-scroll { flex:1;overflow-y:auto;padding:1rem 1.25rem 1.5rem; }
    .dm-title-row { display:flex;align-items:baseline;gap:.5rem;margin-bottom:.4rem; }
    .dm-num { font-size:.8rem;color:#bbb;font-weight:600; }
    .dm-name { font-size:1.5rem;font-weight:800;color:#1a1a2e;text-transform:capitalize;margin:0; }
    .dm-types { display:flex;gap:.35rem;flex-wrap:wrap;margin-bottom:.65rem; }

    .dm-physical { display:flex;gap:1rem;font-size:.8rem;color:#888;font-weight:500;margin-bottom:1rem; }

    .dm-section { font-size:.68rem;font-weight:800;color:#aaa;text-transform:uppercase;letter-spacing:.6px;margin:.85rem 0 .45rem; }

    .dm-stats { display:flex;flex-direction:column;gap:.35rem; }
    .dm-stat-row { display:grid;grid-template-columns:90px 36px 1fr;align-items:center;gap:.5rem; }
    .ds-label { font-size:.72rem;font-weight:600;color:#555; }
    .ds-val { font-size:.72rem;font-weight:700;color:#1a1a2e;text-align:right; }
    .ds-bar-bg { height:7px;background:#f0f0f0;border-radius:999px;overflow:hidden; }
    .ds-bar-fill { height:100%;border-radius:999px;transition:width .4s; }

    .dm-encounters { display:flex;flex-direction:column;gap:.6rem; }
    .enc-game-block { border:1px solid #f0f0f0;border-radius:10px;overflow:hidden; }
    .enc-game-header { display:flex;align-items:center;gap:.5rem;padding:.4rem .65rem;background:#f8f8fa; }
    .enc-logo { height:18px;max-width:56px;object-fit:contain; }
    .enc-game-label { font-size:.72rem;font-weight:700;color:#444;text-transform:capitalize; }
    .enc-loc-row { display:flex;justify-content:space-between;align-items:center;padding:.28rem .65rem;border-top:1px solid #f4f4f4; }
    .enc-loc-name { font-size:.72rem;color:#555;text-transform:capitalize; }
    .enc-loc-lv { font-size:.68rem;color:#aaa;font-weight:600;white-space:nowrap; }
    .dm-no-enc { font-size:.8rem;color:#bbb;padding:.5rem 0; }
  `]
})
export class ProgressDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private progressService = inject(ProgressService);
  private pokemonService = inject(PokemonService);

  progress     = signal<GameProgressDetail | null>(null);
  allEntries   = signal<GridEntry[]>([]);
  loadingDex   = signal(true);
  filter       = signal<'all'|'seen'|'caught'|'shiny'|'missing'>('all');
  modal        = signal<ModalData | null>(null);
  detailModal  = signal<PokemonDetailData | null>(null);
  confirmReset = signal(false);
  confirmFinish = signal(false);

  private progressId!: number;

  totalDex    = computed(() => this.allEntries().length);
  totalSeen   = computed(() => this.allEntries().filter(e => e.seen).length);
  totalCaught = computed(() => this.allEntries().filter(e => e.caughtNormal).length);
  totalShiny  = computed(() => this.allEntries().filter(e => e.caughtShiny).length);

  private filteredEntries = computed(() => {
    const f = this.filter();
    return this.allEntries().filter(e => {
      if (f === 'seen')    return e.seen;
      if (f === 'caught')  return e.caughtNormal;
      if (f === 'shiny')   return e.caughtShiny;
      if (f === 'missing') return !e.caughtNormal && !e.caughtShiny;
      return true;
    });
  });

  visibleBoxes = computed<Box[]>(() => {
    const entries = this.filteredEntries();
    const boxes: Box[] = [];
    for (let i = 0; i < entries.length; i += BOX_SIZE) {
      const chunk = entries.slice(i, i + BOX_SIZE);
      const first = chunk[0].pokemonId;
      const last  = chunk[chunk.length - 1].pokemonId;
      boxes.push({ label: `Caja ${Math.floor(i / BOX_SIZE) + 1}  (#${first}–#${last})`, entries: chunk });
    }
    return boxes;
  });

  typeGradient = computed(() => {
    const types = this.modal()?.types ?? [];
    const c: Record<string, string> = {
      normal:'#e8e8d0',fire:'#fde8d0',water:'#d0dffe',electric:'#fef9d0',grass:'#d4f0d0',
      ice:'#d8f4f4',fighting:'#f0d0d0',poison:'#e8d0e8',ground:'#f4ead0',flying:'#ddd8f8',
      psychic:'#fdd0e0',bug:'#e4eccc',rock:'#ece0c0',ghost:'#d8d0e8',dragon:'#d8d0f8',
      dark:'#d8d0c8',steel:'#e4e4ec',fairy:'#fce8ec',
    };
    const c1 = c[types[0]] ?? '#f5f5f5';
    const c2 = types[1] ? (c[types[1]] ?? c1) : c1;
    return `linear-gradient(135deg,${c1},${c2})`;
  });

  typeColor(t: string)  { return TYPE_COLORS[t] ?? '#999'; }
  typeNameEs(t: string) { return TYPE_NAMES_ES[t] ?? t; }

  detailTypeGradient = computed(() => {
    const types = this.detailModal()?.types ?? [];
    const c: Record<string,string> = {
      normal:'#e8e8d0',fire:'#fde8d0',water:'#d0dffe',electric:'#fef9d0',grass:'#d4f0d0',
      ice:'#d8f4f4',fighting:'#f0d0d0',poison:'#e8d0e8',ground:'#f4ead0',flying:'#ddd8f8',
      psychic:'#fdd0e0',bug:'#e4eccc',rock:'#ece0c0',ghost:'#d8d0e8',dragon:'#d8d0f8',
      dark:'#d8d0c8',steel:'#e4e4ec',fairy:'#fce8ec',
    };
    const c1 = c[types[0]] ?? '#f5f5f5';
    const c2 = types[1] ? (c[types[1]] ?? c1) : c1;
    return `linear-gradient(135deg,${c1},${c2})`;
  });

  private readonly STAT_ES: Record<string,string> = {
    'hp':'PS', 'attack':'Ataque', 'defense':'Defensa',
    'special-attack':'Sp. Ataque', 'special-defense':'Sp. Defensa', 'speed':'Velocidad',
  };
  statNameEs(name: string) { return this.STAT_ES[name] ?? name; }
  statColor(v: number) {
    if (v < 50)  return '#e63946';
    if (v < 90)  return '#f4a00a';
    if (v < 120) return '#43A047';
    return '#1976D2';
  }
  getGameLogo(game: string)  { return GAME_META[game]?.logo  ?? ''; }
  getGameLabel(game: string) { return GAME_META[game]?.label ?? game.replace(/-/g,' '); }
  hideImg(ev: Event) { (ev.target as HTMLImageElement).style.display = 'none'; }

  closeDetailModal() { this.detailModal.set(null); }
  gameMeta() {
    const v = this.progress()?.gameVersion ?? '';
    return GAME_META[v] ?? { label: v, bg: '#333', logo: '' };
  }

  ngOnInit() {
    this.progressId = +this.route.snapshot.paramMap.get('id')!;
    this.progressService.getById(this.progressId).pipe(
      switchMap(progress => {
        this.progress.set(progress);
        return this.progressService.getPokedex(progress.gameVersion);
      })
    ).subscribe(dex => {
      const progress = this.progress()!;
      const caughtMap = new Map(progress.caughtPokemons.map(c => [c.pokemonId, c]));
      this.allEntries.set(dex.map(e => ({
        ...e,
        sprite:  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${e.pokemonId}.png`,
        artwork: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${e.pokemonId}.png`,
        seen:         caughtMap.get(e.pokemonId)?.seen ?? false,
        caughtNormal: caughtMap.get(e.pokemonId)?.caughtNormal ?? false,
        caughtShiny:  caughtMap.get(e.pokemonId)?.caughtShiny ?? false,
      })));
      this.loadingDex.set(false);
    });
  }

  openModal(e: GridEntry) {
    this.modal.set({ entry: { ...e }, types: [], loadingTypes: true });
    this.pokemonService.getDetail(e.pokemonId).subscribe(detail => {
      this.modal.update(m => m ? { ...m, types: detail.types.map(t => t.type.name), loadingTypes: false } : null);
    });
  }

  closeModal() { this.modal.set(null); }

  toggle(type: 'seen' | 'normal' | 'shiny') {
    const m = this.modal();
    if (!m) return;

    const e = { ...m.entry };
    if (type === 'seen') {
      e.seen = !e.seen;
      if (!e.seen) { e.caughtNormal = false; e.caughtShiny = false; }
    } else if (type === 'normal') {
      e.caughtNormal = !e.caughtNormal;
      if (e.caughtNormal) e.seen = true;
    } else {
      e.caughtShiny = !e.caughtShiny;
      if (e.caughtShiny) e.seen = true;
    }

    this.modal.update(m => m ? { ...m, entry: e } : null);
    this.allEntries.update(list => list.map(x => x.pokemonId === e.pokemonId ? { ...x, seen: e.seen, caughtNormal: e.caughtNormal, caughtShiny: e.caughtShiny } : x));

    const dto: CaughtPokemonDto = { pokemonId: e.pokemonId, pokemonName: e.pokemonName, seen: e.seen, caughtNormal: e.caughtNormal, caughtShiny: e.caughtShiny };

    if (!e.seen && !e.caughtNormal && !e.caughtShiny) {
      this.progressService.removeCaught(this.progressId, e.pokemonId).subscribe();
    } else {
      this.progressService.upsertCaught(this.progressId, dto).subscribe();
    }
  }

  viewDetails() {
    const entry = this.modal()?.entry;
    if (!entry) return;
    this.closeModal();
    this.detailModal.set({ id: entry.pokemonId, name: entry.pokemonName, artwork: entry.artwork, types: [], stats: [], height: 0, weight: 0, encounters: [], loading: true });

    forkJoin([
      this.pokemonService.getDetail(entry.pokemonId),
      this.pokemonService.getEncounters(entry.pokemonId),
    ]).subscribe(([detail, encounters]) => {
      const stats = detail.stats.map(s => ({ name: s.stat.name, value: s.base_stat }));

      const gameMap = new Map<string, { name: string; minLv: number; maxLv: number }[]>();
      for (const enc of encounters) {
        const locName = enc.location_area.name.replace(/-/g, ' ');
        for (const vd of enc.version_details) {
          const game = vd.version.name;
          const minLv = Math.min(...vd.encounter_details.map(e => e.min_level));
          const maxLv = Math.max(...vd.encounter_details.map(e => e.max_level));
          if (!gameMap.has(game)) gameMap.set(game, []);
          gameMap.get(game)!.push({ name: locName, minLv, maxLv });
        }
      }
      const encArr: EncounterGame[] = [];
      gameMap.forEach((locs, game) => encArr.push({ game, locations: locs }));

      this.detailModal.set({
        id: detail.id,
        name: detail.name,
        artwork: detail.sprites?.other?.['official-artwork']?.front_default ?? entry.artwork,
        types: detail.types.map(t => t.type.name),
        stats,
        height: detail.height,
        weight: detail.weight,
        encounters: encArr,
        loading: false,
      });
    });
  }

  goBack() { this.router.navigate(['/progress']); }

  doReset() {
    const id = this.progress()!.id;
    this.progressService.resetProgress(id).subscribe(() => {
      this.allEntries.update(entries => entries.map(e => ({ ...e, seen: false, caughtNormal: false, caughtShiny: false })));
      this.confirmReset.set(false);
    });
  }

  doFinish() {
    const id = this.progress()!.id;
    this.progressService.finish(id).subscribe(res => {
      this.progress.update(p => p ? { ...p, finishedAt: res.finishedAt } : p);
      this.confirmFinish.set(false);
    });
  }

  doResume() {
    const id = this.progress()!.id;
    this.progressService.resume(id).subscribe(() => {
      this.progress.update(p => p ? { ...p, finishedAt: null } : p);
    });
  }
}
