import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TeamsService } from '../../core/services/teams.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonTeam } from '../../core/models/pokemon.model';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { Subject } from 'rxjs';

interface PickerResult {
  id: number;
  name: string;
  imageUrl: string;
}

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Mis Equipos</h1>
        <button class="create-btn" (click)="openCreateModal()">+ Nuevo Equipo</button>
      </div>

      <div class="empty-state" *ngIf="teamsService.teams().length === 0">
        <div class="empty-icon">⚔️</div>
        <h3>Sin equipos creados</h3>
        <p>Crea tu primer equipo y añade hasta 6 pokémon.</p>
      </div>

      <div class="teams-grid" *ngIf="teamsService.teams().length > 0">
        <div class="team-card" *ngFor="let team of teamsService.teams()">
          <div class="team-header">
            <h3 class="team-name">{{ team.name }}</h3>
            <div class="team-actions">
              <span class="team-count">{{ team.members.length }}/6</span>
              <button class="delete-btn" (click)="deleteTeam(team.id)" title="Eliminar equipo">×</button>
            </div>
          </div>
          <div class="team-slots">
            <div class="slot" *ngFor="let slot of slots">
              <ng-container *ngIf="getMember(team, slot) as member; else emptySlot">
                <div class="slot-filled" [routerLink]="['/pokemon', member.pokemonId]">
                  <img [src]="member.pokemonImageUrl" [alt]="member.pokemonName" />
                  <span class="slot-name">{{ member.pokemonName }}</span>
                  <button class="slot-remove" (click)="removeMember($event, team.id, member.pokemonId)" title="Quitar">×</button>
                </div>
              </ng-container>
              <ng-template #emptySlot>
                <div class="slot-empty" (click)="openPicker(team, slot)" [class.disabled]="team.members.length >= 6">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Crear equipo -->
    <div class="modal-overlay" *ngIf="showCreateModal()" (click)="showCreateModal.set(false)">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3 class="modal-title">Crear Equipo</h3>
        <input
          [(ngModel)]="newTeamName"
          placeholder="Nombre del equipo..."
          class="modal-input"
          (keydown.enter)="createTeam()"
          autofocus
        />
        <div class="modal-actions">
          <button class="modal-cancel" (click)="showCreateModal.set(false)">Cancelar</button>
          <button class="modal-confirm" (click)="createTeam()" [disabled]="!newTeamName.trim()">Crear</button>
        </div>
      </div>
    </div>

    <!-- Modal: Picker de Pokemon -->
    <div class="modal-overlay" *ngIf="showPicker()" (click)="closePicker()">
      <div class="picker-modal" (click)="$event.stopPropagation()">
        <div class="picker-header">
          <h3 class="modal-title">Elegir Pokémon — Slot {{ activeSlot() }}</h3>
          <button class="close-btn" (click)="closePicker()">×</button>
        </div>

        <div class="picker-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon" width="16" height="16">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            [(ngModel)]="pickerQuery"
            (ngModelChange)="onPickerSearch($event)"
            placeholder="Buscar pokémon por nombre o número..."
            class="picker-input"
            autofocus
          />
        </div>

        <div class="picker-loading" *ngIf="pickerLoading()">
          <div class="mini-spin"></div>
        </div>

        <div class="picker-results" *ngIf="!pickerLoading()">
          <div
            class="picker-item"
            *ngFor="let p of pickerResults()"
            (click)="selectPokemon(p)"
            [class.already-in]="isInTeam(p.id)"
          >
            <img [src]="p.imageUrl" [alt]="p.name" class="picker-img" />
            <div class="picker-info">
              <span class="picker-name">{{ p.name }}</span>
              <span class="picker-id">#{{ p.id | number:'3.0-0' }}</span>
            </div>
            <span class="in-team-tag" *ngIf="isInTeam(p.id)">Ya está</span>
          </div>

          <div class="picker-empty" *ngIf="pickerResults().length === 0 && pickerQuery.length > 0">
            No se encontró "{{ pickerQuery }}"
          </div>

          <div class="picker-hint" *ngIf="pickerResults().length === 0 && pickerQuery.length === 0">
            Escribe el nombre o número de un pokémon para buscarlo.
          </div>
        </div>

        <div class="adding-state" *ngIf="addingMember()">
          <div class="mini-spin"></div>
          <span>Añadiendo...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-title { font-size: 2rem; font-weight: 800; color: #1a1a2e; margin: 0; }
    .create-btn {
      padding: 0.65rem 1.5rem; background: #e63946; color: white;
      border: none; border-radius: 12px; font-weight: 600; cursor: pointer;
      font-size: 0.9rem; transition: opacity 0.2s;
    }
    .create-btn:hover { opacity: 0.85; }
    .empty-state { text-align: center; padding: 5rem 1rem; color: #999; }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.25rem; color: #555; margin: 0 0 0.5rem; }

    .teams-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
    .team-card { background: white; border-radius: 16px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
    .team-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .team-name { font-size: 1.1rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .team-actions { display: flex; align-items: center; gap: 0.5rem; }
    .team-count { font-size: 0.8rem; color: #aaa; font-weight: 500; }
    .delete-btn { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: #ccc; transition: color 0.2s; }
    .delete-btn:hover { color: #e63946; }

    .team-slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; }
    .slot-filled {
      cursor: pointer; position: relative; text-align: center;
      background: #f8f8f8; border-radius: 10px; padding: 0.5rem;
      transition: background 0.2s;
    }
    .slot-filled:hover { background: #f0f0f0; }
    .slot-filled img { width: 60px; height: 60px; object-fit: contain; }
    .slot-name {
      display: block; font-size: 0.7rem; text-transform: capitalize;
      color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .slot-remove {
      position: absolute; top: 2px; right: 4px;
      background: none; border: none; cursor: pointer;
      font-size: 0.9rem; color: #ccc; line-height: 1; transition: color 0.2s;
    }
    .slot-remove:hover { color: #e63946; }
    .slot-empty {
      background: #f8f8f8; border-radius: 10px; height: 94px;
      display: flex; align-items: center; justify-content: center;
      border: 2px dashed #e0e0e0; color: #ccc;
      cursor: pointer; transition: all 0.2s;
    }
    .slot-empty:hover { border-color: #e63946; color: #e63946; background: rgba(230,57,70,0.04); }
    .slot-empty.disabled { cursor: not-allowed; opacity: 0.4; }

    /* Modales */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center; z-index: 200;
    }
    .modal {
      background: white; border-radius: 16px; padding: 2rem;
      width: 360px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
    .modal-title { font-size: 1.15rem; font-weight: 700; margin: 0 0 1.25rem; color: #1a1a2e; }
    .modal-input {
      width: 100%; padding: 0.75rem 1rem; border: 2px solid #f0f0f0;
      border-radius: 10px; font-size: 0.95rem; outline: none;
      transition: border-color 0.2s; box-sizing: border-box;
    }
    .modal-input:focus { border-color: #e63946; }
    .modal-actions { display: flex; gap: 0.75rem; margin-top: 1.25rem; justify-content: flex-end; }
    .modal-cancel { padding: 0.6rem 1.25rem; border: 2px solid #f0f0f0; border-radius: 10px; background: white; cursor: pointer; font-weight: 500; color: #555; }
    .modal-confirm { padding: 0.6rem 1.25rem; background: #e63946; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; transition: opacity 0.2s; }
    .modal-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
    .modal-confirm:hover:not(:disabled) { opacity: 0.85; }

    /* Picker */
    .picker-modal {
      background: white; border-radius: 16px; width: 440px; max-width: 95vw;
      max-height: 85vh; display: flex; flex-direction: column;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;
    }
    .picker-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.25rem 1.5rem 0;
    }
    .close-btn { background: none; border: none; cursor: pointer; font-size: 1.4rem; color: #aaa; line-height: 1; transition: color 0.2s; }
    .close-btn:hover { color: #1a1a2e; }
    .picker-search {
      position: relative; padding: 0.75rem 1.5rem;
    }
    .search-icon { position: absolute; left: 2.25rem; top: 50%; transform: translateY(-50%); color: #aaa; }
    .picker-input {
      width: 100%; padding: 0.65rem 1rem 0.65rem 2.5rem;
      border: 2px solid #f0f0f0; border-radius: 10px; font-size: 0.9rem;
      outline: none; transition: border-color 0.2s; box-sizing: border-box;
    }
    .picker-input:focus { border-color: #e63946; }

    .picker-loading, .adding-state {
      display: flex; align-items: center; justify-content: center;
      gap: 0.75rem; padding: 2rem; color: #888; font-size: 0.9rem;
    }
    .mini-spin {
      width: 24px; height: 24px; border-radius: 50%;
      border: 3px solid #f0f0f0; border-top-color: #e63946;
      animation: spin 0.8s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .picker-results {
      overflow-y: auto; flex: 1;
      padding: 0 0.75rem 1rem;
    }
    .picker-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.5rem 0.75rem; border-radius: 10px;
      cursor: pointer; transition: background 0.15s;
    }
    .picker-item:hover:not(.already-in) { background: #fafafa; }
    .picker-item.already-in { opacity: 0.5; cursor: not-allowed; }
    .picker-img { width: 52px; height: 52px; object-fit: contain; flex-shrink: 0; }
    .picker-info { flex: 1; }
    .picker-name { display: block; text-transform: capitalize; font-weight: 600; font-size: 0.9rem; color: #1a1a2e; }
    .picker-id { font-size: 0.75rem; color: #aaa; }
    .in-team-tag {
      font-size: 0.7rem; padding: 0.2rem 0.5rem;
      background: #f0f0f0; color: #888; border-radius: 999px; font-weight: 600;
    }
    .picker-empty, .picker-hint { text-align: center; padding: 2rem; color: #aaa; font-size: 0.9rem; }
  `]
})
export class TeamsComponent implements OnInit {
  teamsService = inject(TeamsService);
  pokemonService = inject(PokemonService);

  slots = [1, 2, 3, 4, 5, 6];
  showCreateModal = signal(false);
  newTeamName = '';

  showPicker = signal(false);
  activeTeam = signal<PokemonTeam | null>(null);
  activeSlot = signal(0);
  pickerQuery = '';
  pickerResults = signal<PickerResult[]>([]);
  pickerLoading = signal(false);
  addingMember = signal(false);

  private search$ = new Subject<string>();

  ngOnInit() {
    this.teamsService.load().subscribe();

    this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query.trim()) {
          this.pickerLoading.set(false);
          return of(null);
        }
        this.pickerLoading.set(true);
        return this.pokemonService.getDetail(query.toLowerCase().trim()).pipe(
          catchError(() => of(null))  // error dentro del switchMap para que el Subject no muera
        );
      })
    ).subscribe(detail => {
      this.pickerLoading.set(false);
      if (detail) {
        this.pickerResults.set([{
          id: detail.id,
          name: detail.name,
          imageUrl:
            detail.sprites?.other?.['official-artwork']?.front_default ??
            this.pokemonService.getPokemonImageUrl(detail.id),
        }]);
      } else {
        this.pickerResults.set([]);
      }
    });
  }

  getMember(team: PokemonTeam, slot: number) {
    return team.members.find(m => m.slot === slot) ?? null;
  }

  openCreateModal() {
    this.newTeamName = '';
    this.showCreateModal.set(true);
  }

  createTeam() {
    if (!this.newTeamName.trim()) return;
    this.teamsService.create(this.newTeamName.trim()).subscribe();
    this.newTeamName = '';
    this.showCreateModal.set(false);
  }

  openPicker(team: PokemonTeam, slot: number) {
    if (team.members.length >= 6) return;
    this.activeTeam.set(team);
    this.activeSlot.set(slot);
    this.pickerQuery = '';
    this.pickerResults.set([]);
    this.pickerLoading.set(false);
    this.showPicker.set(true);
  }

  closePicker() {
    this.showPicker.set(false);
    this.activeTeam.set(null);
  }

  onPickerSearch(query: string) {
    if (!query.trim()) {
      this.pickerResults.set([]);
      this.pickerLoading.set(false);
      return;
    }
    this.search$.next(query);
  }

  isInTeam(pokemonId: number): boolean {
    return this.activeTeam()?.members.some(m => m.pokemonId === pokemonId) ?? false;
  }

  selectPokemon(p: PickerResult) {
    if (this.isInTeam(p.id)) return;
    const team = this.activeTeam()!;
    const slot = this.activeSlot();
    this.addingMember.set(true);

    this.teamsService.addMember(team.id, p.id, p.name, p.imageUrl, slot).subscribe({
      next: () => {
        this.addingMember.set(false);
        this.closePicker();
      },
      error: () => this.addingMember.set(false)
    });
  }

  deleteTeam(id: number) {
    if (confirm('¿Eliminar este equipo?')) {
      this.teamsService.deleteTeam(id).subscribe();
    }
  }

  removeMember(event: Event, teamId: number, pokemonId: number) {
    event.stopPropagation();
    event.preventDefault();
    this.teamsService.removeMember(teamId, pokemonId).subscribe();
  }
}
