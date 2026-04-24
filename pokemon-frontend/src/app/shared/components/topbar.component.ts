import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <div class="topbar-title">{{ title }}</div>
      <div class="topbar-right">
        <div class="user-chip" *ngIf="auth.currentUser() as user">
          <img [src]="user.pictureUrl || ''" [alt]="user.name"
               class="chip-avatar" referrerpolicy="no-referrer"
               (error)="onImgError($event)" />
          <span class="chip-name">{{ firstName(user.name) }}</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      position: fixed; left: 220px; top: 0; right: 0; height: 60px;
      background: white; border-bottom: 1px solid #f0f0f0;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 2rem; z-index: 90;
    }
    .topbar-title { font-size: 1.1rem; font-weight: 700; color: #1a1a2e; }
    .topbar-right { display: flex; align-items: center; gap: 1rem; }
    .user-chip {
      display: flex; align-items: center; gap: 0.5rem;
      background: #f8f8f8; border-radius: 999px; padding: 0.3rem 0.75rem 0.3rem 0.3rem;
    }
    .chip-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
    .chip-name { font-size: 0.85rem; font-weight: 600; color: #333; }
  `]
})
export class TopbarComponent {
  @Input() title = 'Pokédex';
  auth = inject(AuthService);

  firstName(name: string): string {
    return name.split(' ')[0];
  }

  onImgError(e: Event) {
    (e.target as HTMLImageElement).style.display = 'none';
  }
}
