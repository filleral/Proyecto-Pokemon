import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TeamsService } from '../../core/services/teams.service';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Mis Equipos</h1>
        <button class="create-btn" (click)="showModal.set(true)">+ Nuevo Equipo</button>
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
              <button class="delete-btn" (click)="deleteTeam(team.id)">×</button>
            </div>
          </div>
          <div class="team-slots">
            <div class="slot" *ngFor="let slot of [1,2,3,4,5,6]">
              <ng-container *ngIf="getMember(team, slot) as member; else emptySlot">
                <div class="slot-filled" [routerLink]="['/pokemon', member.pokemonId]">
                  <img [src]="member.pokemonImageUrl" [alt]="member.pokemonName" />
                  <span>{{ member.pokemonName }}</span>
                  <button class="slot-remove" (click)="removeMember($event, team.id, member.pokemonId)">×</button>
                </div>
              </ng-container>
              <ng-template #emptySlot>
                <div class="slot-empty">
                  <span>+</span>
                </div>
              </ng-template>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showModal()" (click)="showModal.set(false)">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3 class="modal-title">Crear Equipo</h3>
          <input
            [(ngModel)]="newTeamName"
            placeholder="Nombre del equipo..."
            class="modal-input"
            (keydown.enter)="createTeam()"
          />
          <div class="modal-actions">
            <button class="modal-cancel" (click)="showModal.set(false)">Cancelar</button>
            <button class="modal-confirm" (click)="createTeam()" [disabled]="!newTeamName">Crear</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .page-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 2rem;
    }
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
    .team-card {
      background: white; border-radius: 16px; padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    }
    .team-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 1rem;
    }
    .team-name { font-size: 1.1rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .team-actions { display: flex; align-items: center; gap: 0.5rem; }
    .team-count { font-size: 0.8rem; color: #aaa; font-weight: 500; }
    .delete-btn {
      background: none; border: none; cursor: pointer; font-size: 1.2rem;
      color: #ccc; line-height: 1; transition: color 0.2s;
    }
    .delete-btn:hover { color: #e63946; }
    .team-slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; }
    .slot-filled {
      cursor: pointer; position: relative; text-align: center;
      background: #f8f8f8; border-radius: 10px; padding: 0.5rem;
      transition: background 0.2s;
    }
    .slot-filled:hover { background: #f0f0f0; }
    .slot-filled img { width: 56px; height: 56px; object-fit: contain; }
    .slot-filled span {
      display: block; font-size: 0.7rem; text-transform: capitalize;
      color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .slot-remove {
      position: absolute; top: 2px; right: 4px;
      background: none; border: none; cursor: pointer;
      font-size: 0.9rem; color: #ccc; line-height: 1;
    }
    .slot-remove:hover { color: #e63946; }
    .slot-empty {
      background: #f8f8f8; border-radius: 10px; height: 90px;
      display: flex; align-items: center; justify-content: center;
      border: 2px dashed #e8e8e8; color: #ccc; font-size: 1.5rem;
    }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      z-index: 200;
    }
    .modal {
      background: white; border-radius: 16px; padding: 2rem;
      width: 360px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
    .modal-title { font-size: 1.25rem; font-weight: 700; margin: 0 0 1.25rem; color: #1a1a2e; }
    .modal-input {
      width: 100%; padding: 0.75rem 1rem; border: 2px solid #f0f0f0;
      border-radius: 10px; font-size: 0.95rem; outline: none;
      transition: border-color 0.2s; box-sizing: border-box;
    }
    .modal-input:focus { border-color: #e63946; }
    .modal-actions { display: flex; gap: 0.75rem; margin-top: 1.25rem; justify-content: flex-end; }
    .modal-cancel {
      padding: 0.6rem 1.25rem; border: 2px solid #f0f0f0;
      border-radius: 10px; background: white; cursor: pointer;
      font-weight: 500; color: #555;
    }
    .modal-confirm {
      padding: 0.6rem 1.25rem; background: #e63946; color: white;
      border: none; border-radius: 10px; cursor: pointer; font-weight: 600;
      transition: opacity 0.2s;
    }
    .modal-confirm:hover:not(:disabled) { opacity: 0.85; }
    .modal-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
  `]
})
export class TeamsComponent implements OnInit {
  teamsService = inject(TeamsService);
  showModal = signal(false);
  newTeamName = '';

  ngOnInit() {
    this.teamsService.load().subscribe();
  }

  getMember(team: any, slot: number) {
    return team.members.find((m: any) => m.slot === slot) ?? null;
  }

  createTeam() {
    if (!this.newTeamName) return;
    this.teamsService.create(this.newTeamName).subscribe();
    this.newTeamName = '';
    this.showModal.set(false);
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
