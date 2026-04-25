import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { of } from 'rxjs';
import { SaveParserService } from '../../core/services/save-parser.service';
import { SaveImportService } from '../../core/services/save-import.service';
import { SaveFileInfo, ImportResult, ParsedSaveData } from '../../core/models/save-parser.types';

const GAME_META: Record<string, { label: string; bg: string; logo: string; gen: 'gen3' | 'gen4' }> = {
  'ruby':        { label: 'Pokémon Rubí',      bg: '#5a000c', logo: 'game-logos/ruby.png',        gen: 'gen3' },
  'sapphire':    { label: 'Pokémon Zafiro',    bg: '#001a6e', logo: 'game-logos/sapphire.png',    gen: 'gen3' },
  'emerald':     { label: 'Pokémon Esmeralda', bg: '#00391a', logo: 'game-logos/emerald.png',      gen: 'gen3' },
  'firered':     { label: 'Rojo Fuego',        bg: '#6b1800', logo: 'game-logos/firered.png',      gen: 'gen3' },
  'leafgreen':   { label: 'Verde Hoja',        bg: '#113300', logo: 'game-logos/leafgreen.png',    gen: 'gen3' },
  'diamond':     { label: 'Pokémon Diamante',  bg: '#0d2b52', logo: 'game-logos/diamond.png',      gen: 'gen4' },
  'pearl':       { label: 'Pokémon Perla',     bg: '#5c1530', logo: 'game-logos/pearl.png',        gen: 'gen4' },
  'platinum':    { label: 'Pokémon Platino',   bg: '#1e1e28', logo: 'game-logos/platinum.png',     gen: 'gen4' },
  'heartgold':   { label: 'HeartGold',         bg: '#4a2a00', logo: 'game-logos/heartgold.png',    gen: 'gen4' },
  'soulsilver':  { label: 'SoulSilver',        bg: '#1e1e3e', logo: 'game-logos/soulsilver.png',   gen: 'gen4' },
};

type Step = 1 | 2 | 3 | 4 | 5;

@Component({
  selector: 'app-save-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay" (click)="onOverlayClick($event)">
      <div class="wizard" (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="wizard-header">
          <div class="wizard-title-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <h2 class="wizard-title">Importar partida .sav</h2>
          </div>
          <button class="close-btn" (click)="close()" [disabled]="step() === 4">✕</button>
        </div>

        <!-- Step indicator (steps 1-3) -->
        <div class="step-indicator" *ngIf="step() <= 3">
          <div class="step-dot" [class.active]="step() >= 1" [class.done]="step() > 1">
            <span *ngIf="step() <= 1">1</span>
            <svg *ngIf="step() > 1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="step-line" [class.done]="step() > 1"></div>
          <div class="step-dot" [class.active]="step() >= 2" [class.done]="step() > 2">
            <span *ngIf="step() <= 2">2</span>
            <svg *ngIf="step() > 2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="step-line" [class.done]="step() > 2"></div>
          <div class="step-dot" [class.active]="step() >= 3">
            <span>3</span>
          </div>
        </div>

        <!-- ── STEP 1: Select file ── -->
        <div class="step-body" *ngIf="step() === 1">
          <p class="step-label">Paso 1 — Archivo</p>

          <div class="drop-zone"
               [class.has-file]="fileInfo()"
               [class.drag-over]="dragging()"
               (dragover)="onDragOver($event)"
               (dragleave)="dragging.set(false)"
               (drop)="onDrop($event)"
               (click)="fileInput.click()">
            <input #fileInput type="file" accept=".sav,.SAV" style="display:none" (change)="onFileChange($event)" />

            <ng-container *ngIf="!fileInfo()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40" class="drop-icon">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p class="drop-text">Arrastra tu archivo <strong>.sav</strong> aquí</p>
              <p class="drop-hint">o haz clic para seleccionar</p>
              <p class="drop-note">Compatible: Gen 3 (128 KB) y Gen 4 (512 KB)</p>
            </ng-container>

            <ng-container *ngIf="fileInfo() as info">
              <div class="file-result">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" width="32" height="32">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <p class="file-name">{{ fileName() }}</p>
                <p class="file-size">{{ formatSize(info.sizeBytes) }}</p>
                <div class="gen-badge" [class]="'gen-badge--' + info.generation">
                  <ng-container [ngSwitch]="info.generation">
                    <span *ngSwitchCase="'gen3'">Gen 3 detectada ✓</span>
                    <span *ngSwitchCase="'gen4'">Gen 4 detectada ✓</span>
                    <span *ngSwitchDefault>Generación desconocida</span>
                  </ng-container>
                </div>
                <button class="change-file-btn" (click)="$event.stopPropagation(); fileInput.click()">Cambiar archivo</button>
              </div>
            </ng-container>
          </div>

          <div class="step-actions">
            <button class="btn-cancel" (click)="close()">Cancelar</button>
            <button class="btn-next" [disabled]="!fileInfo()" (click)="step.set(2)">Siguiente →</button>
          </div>
        </div>

        <!-- ── STEP 2: Configure ── -->
        <div class="step-body" *ngIf="step() === 2">
          <p class="step-label">Paso 2 — Configurar</p>

          <label class="form-label">Juego</label>
          <div class="game-grid">
            <button *ngFor="let key of visibleGames()"
              class="game-btn"
              [class.selected]="form.gameVersion === key"
              [style.background]="GAME_META[key].bg"
              (click)="form.gameVersion = key">
              <img [src]="GAME_META[key].logo" [alt]="GAME_META[key].label" class="game-btn-img" />
            </button>
          </div>
          <p class="selected-game" *ngIf="form.gameVersion">{{ GAME_META[form.gameVersion]?.label }}</p>

          <label class="form-label" style="margin-top:1rem">Nombre del entrenador</label>
          <input class="form-input" [(ngModel)]="form.trainerName" placeholder="Ash, Kris, Brendan..." maxlength="20" />

          <label class="form-label" style="margin-top:1rem">Fecha de inicio</label>
          <input class="form-input" type="date" [(ngModel)]="form.startedAt" />

          <label class="form-label" style="margin-top:1.25rem">¿Qué importar?</label>
          <div class="import-opts">
            <label class="import-opt import-opt--always">
              <span class="opt-check">✓</span>
              <div>
                <span class="opt-name">Entrada de progreso</span>
                <span class="opt-desc">Crea el registro del juego con el entrenador y la fecha</span>
              </div>
            </label>

            <label class="import-opt" [class.disabled]="!parserAvailable()">
              <input type="checkbox" [(ngModel)]="form.importPokedex" [disabled]="!parserAvailable()" />
              <div>
                <span class="opt-name">
                  Pokédex
                  <span class="pending-badge" *ngIf="!parserAvailable()">Próximamente</span>
                </span>
                <span class="opt-desc">Importa los Pokémon vistos y capturados desde el archivo</span>
              </div>
            </label>

            <label class="import-opt" [class.disabled]="!parserAvailable()">
              <input type="checkbox" [(ngModel)]="form.importTeam" [disabled]="!parserAvailable()" />
              <div>
                <span class="opt-name">
                  Equipo actual
                  <span class="pending-badge" *ngIf="!parserAvailable()">Próximamente</span>
                </span>
                <span class="opt-desc">Importa los 6 Pokémon de tu equipo como un nuevo equipo</span>
              </div>
            </label>
          </div>

          <div class="step-actions">
            <button class="btn-cancel" (click)="step.set(1)">← Atrás</button>
            <button class="btn-next"
              [disabled]="!form.gameVersion || !form.trainerName || !form.startedAt"
              (click)="step.set(3)">Siguiente →</button>
          </div>
        </div>

        <!-- ── STEP 3: Preview ── -->
        <div class="step-body" *ngIf="step() === 3">
          <p class="step-label">Paso 3 — Confirmar importación</p>

          <div class="preview-card">
            <div class="preview-game-banner" [style.background]="GAME_META[form.gameVersion]?.bg">
              <img [src]="GAME_META[form.gameVersion]?.logo" [alt]="form.gameVersion" class="preview-logo" />
            </div>
            <div class="preview-info">
              <div class="preview-row">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                {{ form.trainerName }}
              </div>
              <div class="preview-row muted">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {{ form.startedAt | date:'dd/MM/yyyy' }}
              </div>
            </div>
          </div>

          <div class="preview-items">
            <div class="preview-item preview-item--ok">
              <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
              Crear entrada de progreso
            </div>

            <ng-container *ngIf="parsedData()">
              <div class="preview-item preview-item--ok" *ngIf="form.importPokedex">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
                {{ parsedData()!.caughtPokemon.length }} Pokémon capturados · {{ parsedData()!.seenIds.length - parsedData()!.caughtPokemon.length }} solo vistos
              </div>
              <div class="preview-item preview-item--ok" *ngIf="form.importTeam && parsedData()!.party.length">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
                Equipo de {{ parsedData()!.party.length }} Pokémon
              </div>
            </ng-container>

            <div class="preview-item preview-item--pending" *ngIf="!parsedData()">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" width="16" height="16">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Pokédex y equipo: parser pendiente — solo se creará el progreso. Podrás añadir tus Pokémon manualmente.
            </div>
          </div>

          <div class="step-actions">
            <button class="btn-cancel" (click)="step.set(2)">← Atrás</button>
            <button class="btn-import" (click)="runImport()">Importar</button>
          </div>
        </div>

        <!-- ── STEP 4: Importing ── -->
        <div class="step-body step-body--center" *ngIf="step() === 4">
          <div class="spinner"></div>
          <p class="importing-text">Importando partida...</p>
          <p class="importing-sub">No cierres esta ventana</p>
        </div>

        <!-- ── STEP 5: Done ── -->
        <div class="step-body step-body--center" *ngIf="step() === 5">
          <div class="done-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="40" height="40"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 class="done-title">¡Importación completada!</h3>
          <div class="done-items" *ngIf="importResult() as r">
            <div class="done-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Progreso creado — {{ GAME_META[form.gameVersion]?.label }}
            </div>
            <div class="done-item" *ngIf="r.pokemonImported > 0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
              </svg>
              {{ r.pokemonImported }} Pokémon importados
            </div>
            <div class="done-item" *ngIf="r.teamImported > 0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              Equipo de {{ r.teamImported }} Pokémon importado
            </div>
            <div class="done-item done-item--pending" *ngIf="r.pokemonImported === 0 && r.teamImported === 0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" width="14" height="14">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Pokédex no importada — añade tus Pokémon manualmente en el detalle del progreso
            </div>
          </div>

          <div class="error-msg" *ngIf="importError()">{{ importError() }}</div>

          <div class="step-actions step-actions--center">
            <button class="btn-cancel" (click)="close()">Cerrar</button>
            <button class="btn-next" *ngIf="importResult()?.progressId" (click)="goToProgress()">Ver progreso →</button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 300;
    }
    .wizard {
      background: white; border-radius: 20px;
      width: 90%; max-width: 520px; max-height: 90vh;
      overflow-y: auto; display: flex; flex-direction: column;
    }

    /* Header */
    .wizard-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.5rem 1.75rem 1rem;
      border-bottom: 1px solid #f0f0f0;
    }
    .wizard-title-row { display: flex; align-items: center; gap: .6rem; }
    .wizard-title { font-size: 1.05rem; font-weight: 800; color: #1a1a2e; margin: 0; }
    .close-btn {
      background: none; border: none; cursor: pointer;
      font-size: 1rem; color: #aaa; padding: .3rem .5rem;
      border-radius: 8px; transition: all .2s; line-height: 1;
    }
    .close-btn:hover:not(:disabled) { background: rgba(230,57,70,.1); color: #e63946; }
    .close-btn:disabled { opacity: .3; cursor: not-allowed; }

    /* Step indicator */
    .step-indicator {
      display: flex; align-items: center; justify-content: center;
      gap: 0; padding: 1rem 1.75rem .5rem;
    }
    .step-dot {
      width: 28px; height: 28px; border-radius: 50%;
      background: #f0f0f0; color: #999;
      display: flex; align-items: center; justify-content: center;
      font-size: .78rem; font-weight: 700; flex-shrink: 0;
      transition: all .25s;
    }
    .step-dot.active { background: #e63946; color: white; }
    .step-dot.done   { background: #22c55e; color: white; }
    .step-line {
      flex: 1; height: 2px; background: #f0f0f0;
      max-width: 60px; transition: background .25s;
    }
    .step-line.done { background: #22c55e; }

    /* Body */
    .step-body { padding: 1.25rem 1.75rem 1.5rem; }
    .step-body--center {
      padding: 2.5rem 1.75rem;
      display: flex; flex-direction: column; align-items: center; gap: .75rem; text-align: center;
    }
    .step-label { font-size: .72rem; font-weight: 700; color: #aaa; text-transform: uppercase; letter-spacing: .5px; margin: 0 0 1rem; }

    /* Drop zone */
    .drop-zone {
      border: 2px dashed #ddd; border-radius: 14px;
      padding: 2rem; text-align: center; cursor: pointer;
      transition: all .2s; background: #fafafa;
    }
    .drop-zone:hover, .drop-zone.drag-over { border-color: #e63946; background: rgba(230,57,70,.03); }
    .drop-zone.has-file { border-color: #22c55e; background: rgba(34,197,94,.03); cursor: default; }
    .drop-icon { color: #ccc; margin-bottom: .75rem; }
    .drop-text { font-size: .95rem; font-weight: 600; color: #555; margin: 0 0 .3rem; }
    .drop-hint { font-size: .82rem; color: #aaa; margin: 0 0 .6rem; }
    .drop-note { font-size: .75rem; color: #bbb; margin: 0; }

    .file-result { display: flex; flex-direction: column; align-items: center; gap: .4rem; }
    .file-name   { font-size: .92rem; font-weight: 700; color: #1a1a2e; margin: 0; word-break: break-all; }
    .file-size   { font-size: .78rem; color: #aaa; margin: 0; }
    .gen-badge   { padding: .25rem .7rem; border-radius: 20px; font-size: .75rem; font-weight: 700; }
    .gen-badge--gen3    { background: rgba(220,38,38,.12);  color: #b91c1c; }
    .gen-badge--gen4    { background: rgba(37,99,235,.12);  color: #1d4ed8; }
    .gen-badge--unknown { background: rgba(156,163,175,.15); color: #6b7280; }
    .change-file-btn {
      font-size: .75rem; color: #e63946; background: none; border: none;
      cursor: pointer; text-decoration: underline; margin-top: .25rem;
    }

    /* Form elements */
    .form-label { font-size: .72rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: .5px; display: block; margin-bottom: .5rem; }
    .form-input { width: 100%; padding: .6rem .85rem; border: 1.5px solid #e8e8e8; border-radius: 10px; font-size: .92rem; outline: none; box-sizing: border-box; transition: border .2s; }
    .form-input:focus { border-color: #e63946; }

    /* Game grid */
    .game-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: .4rem; }
    .game-btn   { border: 2px solid transparent; border-radius: 8px; padding: .3rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; height: 44px; }
    .game-btn:hover   { border-color: rgba(255,255,255,.4); transform: scale(1.05); }
    .game-btn.selected { border-color: #e63946; box-shadow: 0 0 0 2px #e63946; }
    .game-btn-img { max-width: 100%; max-height: 28px; object-fit: contain; filter: drop-shadow(0 1px 2px rgba(0,0,0,.4)); }
    .selected-game { font-size: .8rem; font-weight: 600; color: #555; text-align: center; margin: .4rem 0 0; }

    /* Import options */
    .import-opts { display: flex; flex-direction: column; gap: .6rem; }
    .import-opt {
      display: flex; align-items: flex-start; gap: .75rem;
      background: #f8f8f8; border-radius: 10px; padding: .75rem 1rem;
      cursor: pointer; transition: background .2s;
    }
    .import-opt--always { cursor: default; }
    .import-opt.disabled { opacity: .55; cursor: not-allowed; }
    .import-opt input[type="checkbox"] { margin-top: .15rem; flex-shrink: 0; width: 16px; height: 16px; accent-color: #e63946; }
    .opt-check { color: #22c55e; font-weight: 700; font-size: .95rem; flex-shrink: 0; padding-top: .05rem; }
    .opt-name { font-size: .88rem; font-weight: 700; color: #1a1a2e; display: flex; align-items: center; gap: .5rem; }
    .opt-desc { display: block; font-size: .76rem; color: #888; margin-top: .1rem; line-height: 1.4; }
    .pending-badge { font-size: .65rem; font-weight: 700; padding: .15rem .45rem; background: rgba(245,158,11,.15); color: #b45309; border-radius: 20px; letter-spacing: .2px; }

    /* Preview */
    .preview-card { display: flex; border: 1.5px solid #e8e8e8; border-radius: 14px; overflow: hidden; margin-bottom: 1rem; }
    .preview-game-banner { width: 80px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: .5rem; }
    .preview-logo { max-width: 60px; max-height: 40px; object-fit: contain; filter: drop-shadow(0 1px 3px rgba(0,0,0,.4)); }
    .preview-info { padding: .75rem 1rem; display: flex; flex-direction: column; justify-content: center; gap: .4rem; }
    .preview-row { display: flex; align-items: center; gap: .4rem; font-size: .88rem; font-weight: 600; color: #1a1a2e; }
    .preview-row.muted { color: #888; font-weight: 400; font-size: .8rem; }

    .preview-items { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1.5rem; }
    .preview-item { display: flex; align-items: flex-start; gap: .5rem; font-size: .85rem; padding: .6rem .85rem; border-radius: 10px; line-height: 1.4; }
    .preview-item--ok      { background: rgba(34,197,94,.08);  color: #166534; }
    .preview-item--pending { background: rgba(245,158,11,.08); color: #92400e; }

    /* Actions */
    .step-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.25rem; }
    .step-actions--center { justify-content: center; }
    .btn-cancel { padding: .55rem 1.1rem; background: #f0f0f0; border: none; border-radius: 10px; font-size: .88rem; font-weight: 700; cursor: pointer; color: #555; transition: background .2s; }
    .btn-cancel:hover { background: #e0e0e0; }
    .btn-next   { padding: .55rem 1.4rem; background: #e63946; color: white; border: none; border-radius: 10px; font-size: .88rem; font-weight: 700; cursor: pointer; transition: background .2s; }
    .btn-next:hover:not(:disabled) { background: #c1121f; }
    .btn-next:disabled { opacity: .45; cursor: not-allowed; }
    .btn-import { padding: .55rem 1.4rem; background: #22c55e; color: white; border: none; border-radius: 10px; font-size: .88rem; font-weight: 700; cursor: pointer; transition: background .2s; }
    .btn-import:hover { background: #16a34a; }

    /* Spinner */
    .spinner {
      width: 44px; height: 44px; border-radius: 50%;
      border: 3px solid #f0f0f0; border-top-color: #e63946;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .importing-text { font-size: 1rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .importing-sub  { font-size: .82rem; color: #aaa; margin: 0; }

    /* Done */
    .done-icon  { width: 72px; height: 72px; border-radius: 50%; background: rgba(34,197,94,.1); display: flex; align-items: center; justify-content: center; }
    .done-title { font-size: 1.1rem; font-weight: 800; color: #1a1a2e; margin: 0; }
    .done-items { display: flex; flex-direction: column; gap: .4rem; width: 100%; }
    .done-item  { display: flex; align-items: center; gap: .5rem; font-size: .85rem; color: #374151; background: #f8f8f8; padding: .55rem .85rem; border-radius: 10px; }
    .done-item--pending { color: #92400e; background: rgba(245,158,11,.08); }
    .error-msg  { font-size: .84rem; color: #e63946; background: rgba(230,57,70,.08); padding: .65rem 1rem; border-radius: 10px; width: 100%; box-sizing: border-box; }

    /* Dark mode */
    :host-context(html.dark) .wizard        { background: #1a1a2e; }
    :host-context(html.dark) .wizard-header { border-bottom-color: rgba(255,255,255,.07); }
    :host-context(html.dark) .wizard-title  { color: white; }
    :host-context(html.dark) .drop-zone     { border-color: rgba(255,255,255,.12); background: rgba(255,255,255,.03); }
    :host-context(html.dark) .drop-zone:hover, :host-context(html.dark) .drop-zone.drag-over { background: rgba(230,57,70,.06); }
    :host-context(html.dark) .drop-zone.has-file { background: rgba(34,197,94,.06); }
    :host-context(html.dark) .drop-text     { color: rgba(255,255,255,.75); }
    :host-context(html.dark) .file-name     { color: white; }
    :host-context(html.dark) .form-input    { background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.1); color: white; }
    :host-context(html.dark) .form-input:focus { border-color: #e63946; }
    :host-context(html.dark) .import-opt    { background: rgba(255,255,255,.05); }
    :host-context(html.dark) .opt-name      { color: white; }
    :host-context(html.dark) .opt-desc      { color: rgba(255,255,255,.45); }
    :host-context(html.dark) .preview-card  { border-color: rgba(255,255,255,.1); }
    :host-context(html.dark) .preview-row   { color: white; }
    :host-context(html.dark) .done-item     { background: rgba(255,255,255,.06); color: rgba(255,255,255,.85); }
    :host-context(html.dark) .done-title    { color: white; }
    :host-context(html.dark) .btn-cancel    { background: rgba(255,255,255,.08); color: rgba(255,255,255,.7); }
    :host-context(html.dark) .btn-cancel:hover { background: rgba(255,255,255,.13); }
    :host-context(html.dark) .step-dot      { background: rgba(255,255,255,.1); color: rgba(255,255,255,.5); }
    :host-context(html.dark) .step-line     { background: rgba(255,255,255,.1); }
    :host-context(html.dark) .importing-text { color: white; }
  `]
})
export class SaveImportComponent {
  @Input() canCreateProgress = true;
  @Output() done = new EventEmitter<number | null>();

  private parser  = inject(SaveParserService);
  private importer = inject(SaveImportService);
  private router  = inject(Router);

  readonly GAME_META = GAME_META;

  step          = signal<Step>(1);
  dragging      = signal(false);
  fileInfo      = signal<SaveFileInfo | null>(null);
  fileName      = signal('');
  parsedData    = signal<ParsedSaveData | null>(null);
  importResult  = signal<ImportResult | null>(null);
  importError   = signal('');

  form = {
    gameVersion:   '',
    trainerName:   '',
    startedAt:     new Date().toISOString().slice(0, 10),
    importPokedex: false,
    importTeam:    false,
  };

  parserAvailable(): boolean {
    const info = this.fileInfo();
    if (!info) return false;
    // Gen 4 parser is implemented; Gen 3 is pending
    return info.generation === 'gen4';
  }

  visibleGames(): string[] {
    const gen = this.fileInfo()?.generation ?? 'unknown';
    return this.parser.gamesForGeneration(gen);
  }

  formatSize(bytes: number): string {
    return bytes >= 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(0)} KB`;
  }

  onOverlayClick(e: MouseEvent) {
    if (this.step() !== 4) this.close();
  }

  close() {
    this.done.emit(this.importResult()?.progressId ?? null);
  }

  goToProgress() {
    const id = this.importResult()?.progressId;
    if (id) this.router.navigate(['/progress', id]);
    this.done.emit(id ?? null);
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(true);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.loadFile(file);
  }

  onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.loadFile(file);
  }

  private loadFile(file: File) {
    this.fileName.set(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const buffer = ev.target?.result as ArrayBuffer;
      const info = this.parser.analyze(buffer);
      this.fileInfo.set(info);
      // pre-filter game selection when changing file
      if (info.generation !== 'unknown') {
        const games = this.parser.gamesForGeneration(info.generation);
        if (!games.includes(this.form.gameVersion)) this.form.gameVersion = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  runImport() {
    const info = this.fileInfo();
    if (!info) return;

    this.step.set(4);
    this.importError.set('');

    const opts = {
      gameVersion:   this.form.gameVersion,
      trainerName:   this.form.trainerName,
      startedAt:     this.form.startedAt,
      importPokedex: this.form.importPokedex,
      importTeam:    this.form.importTeam,
    };

    const parse$ = this.parserAvailable() && this.form.gameVersion
      ? this.parser.parse(info, this.form.gameVersion)
      : of(null);

    parse$.pipe(
      switchMap(parsed => {
        this.parsedData.set(parsed);
        return this.importer.import(parsed, opts);
      })
    ).subscribe({
      next: result => {
        this.importResult.set(result);
        this.step.set(5);
      },
      error: err => {
        this.importError.set(err?.error?.message ?? 'Error al importar. Inténtalo de nuevo.');
        this.step.set(5);
      }
    });
  }
}
