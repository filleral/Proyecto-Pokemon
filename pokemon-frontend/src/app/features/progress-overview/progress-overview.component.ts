import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GameProgressSummary } from '../../core/models/progress.model';

// ── Game metadata ─────────────────────────────────────────────────────────────
interface GameEntry {
  version: string;
  label: string;
  logo: string;
  bg: string;
  dexTotal: number;
}

interface GenGroup {
  gen: string;
  games: GameEntry[];
}

const GEN_GROUPS: GenGroup[] = [
  { gen: 'Generación I', games: [
    { version: 'red',     label: 'Pokémon Rojo',      logo: 'game-logos/red.png',     bg: '#5a0000', dexTotal: 151 },
    { version: 'blue',    label: 'Pokémon Azul',       logo: 'game-logos/blue.png',    bg: '#00008B', dexTotal: 151 },
    { version: 'yellow',  label: 'Pokémon Amarillo',   logo: 'game-logos/yellow.png',  bg: '#7a5a00', dexTotal: 151 },
  ]},
  { gen: 'Generación II', games: [
    { version: 'gold',    label: 'Pokémon Oro',        logo: 'game-logos/gold.png',    bg: '#5a3a00', dexTotal: 251 },
    { version: 'silver',  label: 'Pokémon Plata',      logo: 'game-logos/silver.png',  bg: '#3a3a3a', dexTotal: 251 },
    { version: 'crystal', label: 'Pokémon Cristal',    logo: 'game-logos/crystal.png', bg: '#083050', dexTotal: 251 },
  ]},
  { gen: 'Generación III', games: [
    { version: 'ruby',       label: 'Pokémon Rubí',      logo: 'game-logos/ruby.png',      bg: '#5a000c', dexTotal: 386 },
    { version: 'sapphire',   label: 'Pokémon Zafiro',    logo: 'game-logos/sapphire.png',  bg: '#001a6e', dexTotal: 386 },
    { version: 'emerald',    label: 'Pokémon Esmeralda', logo: 'game-logos/emerald.png',   bg: '#00391a', dexTotal: 386 },
    { version: 'firered',    label: 'Rojo Fuego',        logo: 'game-logos/firered.png',   bg: '#6b1800', dexTotal: 386 },
    { version: 'leafgreen',  label: 'Verde Hoja',        logo: 'game-logos/leafgreen.png', bg: '#113300', dexTotal: 386 },
  ]},
  { gen: 'Generación IV', games: [
    { version: 'diamond',     label: 'Pokémon Diamante', logo: 'game-logos/diamond.png',     bg: '#0d2b52', dexTotal: 493 },
    { version: 'pearl',       label: 'Pokémon Perla',    logo: 'game-logos/pearl.png',       bg: '#5c1530', dexTotal: 493 },
    { version: 'platinum',    label: 'Pokémon Platino',  logo: 'game-logos/platinum.png',    bg: '#1e1e28', dexTotal: 493 },
    { version: 'heartgold',   label: 'HeartGold',        logo: 'game-logos/heartgold.png',   bg: '#4a2a00', dexTotal: 493 },
    { version: 'soulsilver',  label: 'SoulSilver',       logo: 'game-logos/soulsilver.png',  bg: '#1e1e3e', dexTotal: 493 },
  ]},
  { gen: 'Generación V', games: [
    { version: 'black',   label: 'Pokémon Negro',   logo: 'game-logos/black.png',   bg: '#0a0a0a', dexTotal: 649 },
    { version: 'white',   label: 'Pokémon Blanco',  logo: 'game-logos/white.png',   bg: '#2a2a36', dexTotal: 649 },
    { version: 'black-2', label: 'Pokémon Negro 2', logo: 'game-logos/black-2.png', bg: '#12121e', dexTotal: 649 },
    { version: 'white-2', label: 'Pokémon Blanco 2',logo: 'game-logos/white-2.png', bg: '#222230', dexTotal: 649 },
  ]},
  { gen: 'Generación VI', games: [
    { version: 'x',               label: 'Pokémon X',      logo: 'game-logos/x.png',              bg: '#011e38', dexTotal: 721 },
    { version: 'y',               label: 'Pokémon Y',      logo: 'game-logos/y.png',              bg: '#420000', dexTotal: 721 },
    { version: 'omega-ruby',      label: 'Omega Rubí',     logo: 'game-logos/omega-ruby.png',     bg: '#420008', dexTotal: 721 },
    { version: 'alpha-sapphire',  label: 'Alfa Zafiro',    logo: 'game-logos/alpha-sapphire.png', bg: '#000e48', dexTotal: 721 },
  ]},
  { gen: 'Generación VII', games: [
    { version: 'sun',              label: 'Pokémon Sol',       logo: 'game-logos/sun.png',              bg: '#422000', dexTotal: 802 },
    { version: 'moon',             label: 'Pokémon Luna',      logo: 'game-logos/moon.png',             bg: '#120038', dexTotal: 802 },
    { version: 'ultra-sun',        label: 'Ultrasol',          logo: 'game-logos/ultra-sun.png',        bg: '#421500', dexTotal: 807 },
    { version: 'ultra-moon',       label: 'Ultraluna',         logo: 'game-logos/ultra-moon.png',       bg: '#070e40', dexTotal: 807 },
    { version: 'lets-go-pikachu',  label: "Let's Go Pikachu",  logo: 'game-logos/lets-go-pikachu.png',  bg: '#3a2a00', dexTotal: 151 },
    { version: 'lets-go-eevee',    label: "Let's Go Eevee",    logo: 'game-logos/lets-go-eevee.png',    bg: '#2e1800', dexTotal: 151 },
  ]},
  { gen: 'Generación VIII', games: [
    { version: 'sword',             label: 'Pokémon Espada',     logo: 'game-logos/sword.png',             bg: '#002244', dexTotal: 400 },
    { version: 'shield',            label: 'Pokémon Escudo',     logo: 'game-logos/shield.png',            bg: '#420808', dexTotal: 400 },
    { version: 'brilliant-diamond', label: 'Diamante Brillante', logo: 'game-logos/brilliant-diamond.png', bg: '#0e1e38', dexTotal: 493 },
    { version: 'shining-pearl',     label: 'Perla Reluciente',   logo: 'game-logos/shining-pearl.png',     bg: '#3e0e20', dexTotal: 493 },
    { version: 'legends-arceus',    label: 'Leyendas: Arceus',   logo: 'game-logos/legends-arceus.png',    bg: '#1e1000', dexTotal: 242 },
  ]},
  { gen: 'Generación IX', games: [
    { version: 'scarlet', label: 'Pokémon Escarlata', logo: 'game-logos/scarlet.png', bg: '#380000', dexTotal: 400 },
    { version: 'violet',  label: 'Pokémon Púrpura',   logo: 'game-logos/violet.png',  bg: '#130025', dexTotal: 400 },
  ]},
];

@Component({
  selector: 'app-progress-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="overview">

      <div class="gen-block" *ngFor="let group of genGroups">
        <div class="gen-header">
          <span class="gen-label">{{ group.gen }}</span>
          <span class="gen-stats">
            {{ startedCount(group) }} / {{ group.games.length }} juegos iniciados
          </span>
        </div>

        <div class="table-wrap">
          <table class="ov-table">
            <thead>
              <tr>
                <th class="col-game">Juego</th>
                <th class="col-dex">Pokédex del juego</th>
                <th class="col-fin">Finalizado</th>
                <th class="col-hrs">Tiempo</th>
                <th class="col-num">Atrapados</th>
                <th class="col-num">Vistos</th>
                <th class="col-act"></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let game of group.games"
                  [class.row-started]="getProgress(game.version)"
                  [class.row-done]="getProgress(game.version)?.finishedAt">
                <!-- Game -->
                <td class="col-game">
                  <div class="game-cell">
                    <div class="game-logo-wrap" [style.background]="game.bg">
                      <img [src]="game.logo" [alt]="game.label" class="game-logo" />
                    </div>
                    <span class="game-name">{{ game.label }}</span>
                  </div>
                </td>

                <!-- Pokédex progress -->
                <td class="col-dex">
                  <ng-container *ngIf="getProgress(game.version) as p; else noDex">
                    <div class="dex-cell">
                      <div class="dex-counts">
                        <span class="dex-caught">{{ p.totalCaught }}</span>
                        <span class="dex-sep">/</span>
                        <span class="dex-total">{{ game.dexTotal }}</span>
                      </div>
                      <div class="dex-bar-track">
                        <div class="dex-bar-fill"
                          [style.width.%]="pct(p.totalCaught, game.dexTotal)"
                          [class.dex-bar-complete]="p.totalCaught >= game.dexTotal">
                        </div>
                      </div>
                    </div>
                  </ng-container>
                  <ng-template #noDex><span class="dash">—</span></ng-template>
                </td>

                <!-- Finished -->
                <td class="col-fin">
                  <ng-container *ngIf="getProgress(game.version) as p; else noFin">
                    <span class="badge-done" *ngIf="p.finishedAt">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="11" height="11"><polyline points="20 6 9 17 4 12"/></svg>
                      Sí
                    </span>
                    <span class="badge-wip" *ngIf="!p.finishedAt">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      En curso
                    </span>
                  </ng-container>
                  <ng-template #noFin><span class="dash">—</span></ng-template>
                </td>

                <!-- Time -->
                <td class="col-hrs">
                  <ng-container *ngIf="getProgress(game.version) as p">
                    <span class="time-val">{{ daysText(p) }}</span>
                  </ng-container>
                  <span class="dash" *ngIf="!getProgress(game.version)">—</span>
                </td>

                <!-- Caught -->
                <td class="col-num">
                  <ng-container *ngIf="getProgress(game.version) as p">
                    <span class="num caught">{{ p.totalCaught }}</span>
                  </ng-container>
                  <span class="dash" *ngIf="!getProgress(game.version)">—</span>
                </td>

                <!-- Seen -->
                <td class="col-num">
                  <ng-container *ngIf="getProgress(game.version) as p">
                    <span class="num seen">{{ p.totalSeen }}</span>
                  </ng-container>
                  <span class="dash" *ngIf="!getProgress(game.version)">—</span>
                </td>

                <!-- Action -->
                <td class="col-act">
                  <a *ngIf="getProgress(game.version) as p"
                     [routerLink]="['/progress', p.id]"
                     class="btn-go" title="Ver detalle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><polyline points="9 18 15 12 9 6"/></svg>
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .overview { display: flex; flex-direction: column; gap: 2rem; }

    /* Generation block */
    .gen-block { }
    .gen-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: .65rem;
    }
    .gen-label {
      font-size: .72rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: .8px; color: #aaa;
    }
    .gen-stats { font-size: .72rem; color: #bbb; }

    /* Table wrapper */
    .table-wrap { overflow-x: auto; border-radius: 14px; box-shadow: 0 2px 10px rgba(0,0,0,.07); }

    .ov-table {
      width: 100%; border-collapse: collapse;
      background: white; border-radius: 14px; overflow: hidden;
      font-size: .84rem;
    }

    thead tr { background: #f8f8f8; }
    thead th {
      padding: .6rem 1rem; text-align: left;
      font-size: .68rem; font-weight: 800; color: #aaa;
      text-transform: uppercase; letter-spacing: .5px;
      white-space: nowrap; border-bottom: 1.5px solid #f0f0f0;
    }
    thead th.col-num, thead th.col-act { text-align: center; }

    tbody tr {
      border-bottom: 1px solid #f5f5f5;
      transition: background .15s;
    }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: #fafafa; }
    tbody tr.row-started { }
    tbody tr.row-done td.col-game .game-name { color: #22c55e; }

    td { padding: .65rem 1rem; vertical-align: middle; }
    td.col-num, td.col-act { text-align: center; }

    /* Game cell */
    .col-game { min-width: 180px; }
    .game-cell { display: flex; align-items: center; gap: .75rem; }
    .game-logo-wrap {
      width: 44px; height: 30px; border-radius: 7px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; padding: .2rem;
    }
    .game-logo { max-width: 38px; max-height: 24px; object-fit: contain; filter: drop-shadow(0 1px 2px rgba(0,0,0,.4)); }
    .game-name { font-weight: 700; color: #1a1a2e; font-size: .84rem; }

    /* Dex cell */
    .col-dex { min-width: 160px; }
    .dex-cell { display: flex; flex-direction: column; gap: .3rem; }
    .dex-counts { display: flex; align-items: baseline; gap: .2rem; }
    .dex-caught { font-size: .92rem; font-weight: 800; color: #1a1a2e; }
    .dex-sep    { font-size: .75rem; color: #ccc; }
    .dex-total  { font-size: .75rem; color: #aaa; }
    .dex-bar-track { height: 4px; background: #f0f0f0; border-radius: 999px; width: 100%; overflow: hidden; }
    .dex-bar-fill  { height: 100%; background: #e63946; border-radius: 999px; transition: width .4s; min-width: 2px; }
    .dex-bar-complete { background: #22c55e; }

    /* Badges */
    .col-fin { white-space: nowrap; }
    .badge-done, .badge-wip {
      display: inline-flex; align-items: center; gap: .3rem;
      padding: .2rem .55rem; border-radius: 20px;
      font-size: .72rem; font-weight: 700;
    }
    .badge-done { background: rgba(34,197,94,.12); color: #15803d; }
    .badge-wip  { background: rgba(234,179,8,.12);  color: #a16207; }

    /* Time */
    .col-hrs { white-space: nowrap; }
    .time-val { font-size: .8rem; color: #666; }

    /* Numbers */
    .col-num { min-width: 80px; }
    .num        { font-size: .9rem; font-weight: 800; }
    .num.caught { color: #1a1a2e; }
    .num.seen   { color: #1976D2; }
    .num.shiny  { color: #f4a00a; }

    /* Dash */
    .dash { color: #ccc; font-size: .9rem; }

    /* Action button */
    .col-act { width: 40px; }
    .btn-go {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 8px;
      background: #f0f0f0; color: #888;
      text-decoration: none; transition: all .2s;
    }
    .btn-go:hover { background: rgba(230,57,70,.12); color: #e63946; }

    /* ── Dark mode ──────────────────────────────────────────────────────────── */
    :host-context(html.dark) .ov-table          { background: #1a1a2e; }
    :host-context(html.dark) thead tr           { background: rgba(255,255,255,.04); }
    :host-context(html.dark) thead th           { color: rgba(255,255,255,.35); border-bottom-color: rgba(255,255,255,.07); }
    :host-context(html.dark) tbody tr           { border-bottom-color: rgba(255,255,255,.05); }
    :host-context(html.dark) tbody tr:hover     { background: rgba(255,255,255,.03); }
    :host-context(html.dark) .game-name         { color: white; }
    :host-context(html.dark) .dex-caught        { color: white; }
    :host-context(html.dark) .dex-bar-track     { background: rgba(255,255,255,.08); }
    :host-context(html.dark) .dash              { color: rgba(255,255,255,.2); }
    :host-context(html.dark) .time-val          { color: rgba(255,255,255,.5); }
    :host-context(html.dark) .btn-go            { background: rgba(255,255,255,.07); color: rgba(255,255,255,.4); }
    :host-context(html.dark) .btn-go:hover      { background: rgba(230,57,70,.2); color: #e63946; }
    :host-context(html.dark) .gen-label         { color: rgba(255,255,255,.3); }
    :host-context(html.dark) .gen-stats         { color: rgba(255,255,255,.25); }
    :host-context(html.dark) .table-wrap        { box-shadow: 0 2px 14px rgba(0,0,0,.35); }
    :host-context(html.dark) tbody tr.row-done td.col-game .game-name { color: #4ade80; }
    :host-context(html.dark) .num.caught        { color: white; }
  `]
})
export class ProgressOverviewComponent {
  @Input() progresses: GameProgressSummary[] = [];

  readonly genGroups = GEN_GROUPS;

  getProgress(version: string): GameProgressSummary | null {
    // If multiple runs exist, return the one with most progress
    const matches = this.progresses.filter(p => p.gameVersion === version);
    if (!matches.length) return null;
    return matches.reduce((best, cur) =>
      cur.totalCaught > best.totalCaught ? cur : best
    );
  }

  pct(caught: number, total: number): number {
    return Math.min(Math.round(caught / total * 100), 100);
  }

  startedCount(group: GenGroup): number {
    return group.games.filter(g => this.getProgress(g.version)).length;
  }

  daysText(p: GameProgressSummary): string {
    const start = new Date(p.startedAt).getTime();
    const end   = p.finishedAt ? new Date(p.finishedAt).getTime() : Date.now();
    const days  = Math.max(0, Math.floor((end - start) / 86400000));
    if (days === 0) return 'Hoy';
    if (days === 1) return '1 día';
    return `${days} días`;
  }
}
