import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProgressService } from '../../core/services/progress.service';
import { GameProgressSummary } from '../../core/models/progress.model';

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

export const GAME_VERSIONS = Object.keys(GAME_META);

@Component({
  selector: 'app-progress-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Mi progreso</h1>
        <button class="btn-new" (click)="showForm.set(true)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M12 5v14M5 12h14"/></svg>
          Nuevo progreso
        </button>
      </div>

      <!-- CONFIRM DELETE MODAL -->
      <div class="modal-overlay" *ngIf="confirmDeleteId() !== null" (click)="confirmDeleteId.set(null)">
        <div class="modal confirm-modal" (click)="$event.stopPropagation()">
          <div class="confirm-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="32" height="32">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </div>
          <h2 class="confirm-title">Eliminar progreso</h2>
          <p class="confirm-msg">Esta acción no se puede deshacer. Se eliminarán todos los Pokémon registrados en este progreso.</p>
          <div class="form-actions">
            <button class="btn-cancel" (click)="confirmDeleteId.set(null)">Cancelar</button>
            <button class="btn-delete" (click)="confirmDelete()">Sí, eliminar</button>
          </div>
        </div>
      </div>

      <!-- CREATE FORM -->
      <div class="modal-overlay" *ngIf="showForm()" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2 class="modal-title">Iniciar progreso</h2>

          <label class="form-label">Juego</label>
          <div class="game-select-grid">
            <button *ngFor="let v of gameVersions"
              class="game-option"
              [class.selected]="form.gameVersion === v"
              [style.background]="gameMeta(v).bg"
              (click)="form.gameVersion = v">
              <img [src]="gameMeta(v).logo" [alt]="gameMeta(v).label" class="game-opt-logo" />
            </button>
          </div>
          <p class="selected-game-name" *ngIf="form.gameVersion">
            {{ gameMeta(form.gameVersion).label }}
          </p>

          <label class="form-label" style="margin-top:1rem">Nombre del entrenador</label>
          <input class="form-input" [(ngModel)]="form.trainerName" placeholder="Ash, Red, Kris..." maxlength="20" />

          <label class="form-label" style="margin-top:1rem">Fecha de inicio</label>
          <input class="form-input" type="date" [(ngModel)]="form.startedAt" />

          <div class="form-actions">
            <button class="btn-cancel" (click)="closeForm()">Cancelar</button>
            <button class="btn-save" (click)="create()" [disabled]="!form.gameVersion || !form.trainerName || !form.startedAt || saving()">
              {{ saving() ? 'Guardando...' : 'Empezar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- PROGRESS CARDS -->
      <div class="empty-state" *ngIf="progresses().length === 0 && !loading()">
        <svg viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" width="64" height="64">
          <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
          <line x1="12" y1="2" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="22"/>
          <line x1="2" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="22" y2="12"/>
        </svg>
        <p>No tienes ningún progreso aún.<br>¡Empieza uno nuevo!</p>
      </div>

      <div class="progress-grid" *ngIf="progresses().length">
        <div class="progress-card" *ngFor="let p of progresses()" (click)="open(p.id)">
          <div class="card-game-banner" [style.background]="gameMeta(p.gameVersion).bg">
            <img [src]="gameMeta(p.gameVersion).logo" [alt]="gameMeta(p.gameVersion).label" class="card-game-logo" />
          </div>
          <div class="card-body">
            <div class="card-trainer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {{ p.trainerName }}
            </div>
            <div class="card-date">Iniciado el {{ p.startedAt | date:'dd/MM/yyyy' }}</div>
            <div class="card-stats">
              <div class="card-stat">
                <span class="stat-num seen">{{ p.totalSeen }}</span>
                <span class="stat-lbl">👁 Vistos</span>
              </div>
              <div class="card-stat">
                <span class="stat-num">{{ p.totalCaught }}</span>
                <span class="stat-lbl">✓ Captd.</span>
              </div>
              <div class="card-stat">
                <span class="stat-num shiny">{{ p.totalShiny }}</span>
                <span class="stat-lbl">✨ Shiny</span>
              </div>
            </div>
          </div>
          <button class="card-delete" (click)="deleteProgress($event, p.id)" title="Eliminar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1100px; margin: 0 auto; }
    .page-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem; }
    .page-title { font-size:1.6rem;font-weight:800;color:#1a1a2e;margin:0; }
    .btn-new { display:flex;align-items:center;gap:.4rem;padding:.55rem 1.1rem;background:#e63946;color:white;border:none;border-radius:10px;font-size:.88rem;font-weight:700;cursor:pointer;transition:background .2s; }
    .btn-new:hover { background:#c1121f; }

    /* MODAL */
    .modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:200; }
    .modal { background:white;border-radius:20px;padding:2rem;width:90%;max-width:520px;max-height:90vh;overflow-y:auto; }
    .modal-title { font-size:1.2rem;font-weight:800;color:#1a1a2e;margin:0 0 1.25rem; }
    .form-label { font-size:.78rem;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;display:block;margin-bottom:.5rem; }
    .form-input { width:100%;padding:.6rem .85rem;border:1.5px solid #e8e8e8;border-radius:10px;font-size:.92rem;outline:none;box-sizing:border-box;transition:border .2s; }
    .form-input:focus { border-color:#e63946; }
    .game-select-grid { display:grid;grid-template-columns:repeat(6,1fr);gap:.4rem; }
    .game-option { border:2px solid transparent;border-radius:8px;padding:.3rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;height:44px; }
    .game-option:hover { border-color:rgba(255,255,255,.4);transform:scale(1.05); }
    .game-option.selected { border-color:#e63946;box-shadow:0 0 0 2px #e63946; }
    .game-opt-logo { max-width:100%;max-height:28px;object-fit:contain;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4)); }
    .selected-game-name { font-size:.82rem;font-weight:600;color:#555;margin:.4rem 0 0;text-align:center; }
    .form-actions { display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem; }
    .btn-cancel { padding:.55rem 1.1rem;background:#f0f0f0;border:none;border-radius:10px;font-size:.88rem;font-weight:700;cursor:pointer;color:#555;transition:background .2s; }
    .btn-cancel:hover { background:#e0e0e0; }
    .btn-save { padding:.55rem 1.4rem;background:#e63946;color:white;border:none;border-radius:10px;font-size:.88rem;font-weight:700;cursor:pointer;transition:background .2s; }
    .btn-save:disabled { opacity:.5;cursor:not-allowed; }
    .btn-save:hover:not(:disabled) { background:#c1121f; }

    /* EMPTY */
    .empty-state { display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:4rem;color:#bbb;text-align:center;font-size:.95rem;line-height:1.6; }

    /* GRID */
    .progress-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1.25rem; }
    .progress-card { background:white;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.08);cursor:pointer;transition:transform .2s,box-shadow .2s;position:relative; }
    .progress-card:hover { transform:translateY(-3px);box-shadow:0 6px 20px rgba(0,0,0,.12); }
    .card-game-banner { height:80px;display:flex;align-items:center;justify-content:center;padding:.5rem; }
    .card-game-logo { max-height:56px;max-width:90%;object-fit:contain;filter:drop-shadow(0 1px 4px rgba(0,0,0,.4)); }
    .card-body { padding:1rem; }
    .card-trainer { display:flex;align-items:center;gap:.35rem;font-size:.88rem;font-weight:700;color:#1a1a2e;margin-bottom:.25rem; }
    .card-date { font-size:.75rem;color:#aaa;margin-bottom:.85rem; }
    .card-stats { display:flex;gap:1.25rem; }
    .card-stat { text-align:center; }
    .stat-num { display:block;font-size:1.3rem;font-weight:800;color:#1a1a2e; }
    .stat-num.seen  { color:#1976D2; }
    .stat-num.shiny { color:#f4a00a; }
    .stat-lbl { font-size:.7rem;color:#aaa; }
    .card-delete { position:absolute;top:.6rem;right:.6rem;background:rgba(0,0,0,.06);border:none;border-radius:8px;padding:.35rem;cursor:pointer;color:#bbb;transition:all .2s; }
    .card-delete:hover { background:rgba(230,57,70,.1);color:#e63946; }

    /* CONFIRM DELETE */
    .confirm-modal { max-width:380px;text-align:center;padding:2.25rem 2rem; }
    .confirm-icon { width:64px;height:64px;border-radius:50%;background:rgba(230,57,70,.1);display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem;color:#e63946; }
    .confirm-title { font-size:1.15rem;font-weight:800;color:#1a1a2e;margin:0 0 .6rem; }
    .confirm-msg { font-size:.85rem;color:#888;line-height:1.55;margin:0 0 1.75rem; }
    .btn-delete { padding:.55rem 1.4rem;background:#e63946;color:white;border:none;border-radius:10px;font-size:.88rem;font-weight:700;cursor:pointer;transition:background .2s; }
    .btn-delete:hover { background:#c1121f; }
  `]
})
export class ProgressListComponent implements OnInit {
  private progressService = inject(ProgressService);
  private router = inject(Router);

  progresses = signal<GameProgressSummary[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  confirmDeleteId = signal<number | null>(null);

  form = { gameVersion: '', trainerName: '', startedAt: '' };
  gameVersions = GAME_VERSIONS;

  gameMeta(v: string) {
    return GAME_META[v] ?? { label: v, bg: '#333', logo: '' };
  }

  ngOnInit() {
    this.progressService.getAll().subscribe(list => {
      this.progresses.set(list);
      this.loading.set(false);
    });
  }

  closeForm() {
    this.showForm.set(false);
    this.form = { gameVersion: '', trainerName: '', startedAt: '' };
  }

  create() {
    if (!this.form.gameVersion || !this.form.trainerName || !this.form.startedAt) return;
    this.saving.set(true);
    this.progressService.create(this.form.gameVersion, this.form.trainerName, new Date(this.form.startedAt)).subscribe(p => {
      this.progresses.update(list => [p, ...list]);
      this.saving.set(false);
      this.closeForm();
    });
  }

  open(id: number) {
    this.router.navigate(['/progress', id]);
  }

  deleteProgress(e: Event, id: number) {
    e.stopPropagation();
    this.confirmDeleteId.set(id);
  }

  confirmDelete() {
    const id = this.confirmDeleteId();
    if (id === null) return;
    this.progressService.delete(id).subscribe(() => {
      this.progresses.update(list => list.filter(p => p.id !== id));
      this.confirmDeleteId.set(null);
    });
  }
}
