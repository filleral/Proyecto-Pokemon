import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <svg class="pokeball-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
          <!-- Top half -->
          <path d="M 5,50 A 45,45 0 0,1 95,50 Z" fill="#e63946"/>
          <!-- Bottom half -->
          <path d="M 5,50 A 45,45 0 0,0 95,50 Z" fill="white"/>
          <!-- Outer ring -->
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1a1a2e" stroke-width="5"/>
          <!-- Middle band -->
          <line x1="5" y1="50" x2="95" y2="50" stroke="#1a1a2e" stroke-width="5"/>
          <!-- Center button outer -->
          <circle cx="50" cy="50" r="14" fill="#1a1a2e"/>
          <!-- Center button inner -->
          <circle cx="50" cy="50" r="9" fill="white"/>
          <!-- Center button shine -->
          <circle cx="46" cy="46" r="3" fill="rgba(255,255,255,0.6)"/>
        </svg>
        <span class="brand-text">PokeNexo</span>
      </div>

      <nav class="sidebar-nav">
        <a routerLink="/pokemon" routerLinkActive="active" [routerLinkActiveOptions]="{exact:false}"
           class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
            <line x1="12" y1="2" x2="12" y2="9"/>
            <line x1="12" y1="15" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="9" y2="12"/>
            <line x1="15" y1="12" x2="22" y2="12"/>
          </svg>
          <span>Pokédex</span>
        </a>

        <a routerLink="/favorites" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"/>
          </svg>
          <span>Favoritos</span>
        </a>

        <a routerLink="/teams" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>Equipos</span>
        </a>

        <a routerLink="/progress" routerLinkActive="active" class="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Progreso</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info" *ngIf="auth.currentUser() as user">
          <img [src]="user.pictureUrl || 'assets/default-avatar.png'"
               [alt]="user.name" class="user-avatar"
               referrerpolicy="no-referrer" />
          <div class="user-details">
            <span class="user-name">{{ user.name }}</span>
            <span class="user-email">{{ user.email }}</span>
          </div>
        </div>
        <button class="logout-btn" (click)="auth.logout()" title="Cerrar sesión">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed; left: 0; top: 0; bottom: 0;
      width: 220px; background: #1a1a2e;
      display: flex; flex-direction: column;
      z-index: 100; padding: 1.5rem 0;
    }
    .sidebar-brand {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0 1.25rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.07);
      margin-bottom: 0.75rem;
    }
    .pokeball-svg { flex-shrink: 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); }
    .brand-text { font-size: 1.15rem; font-weight: 700; color: white; letter-spacing: -0.5px; }

    .sidebar-nav { flex: 1; padding: 0 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1rem; border-radius: 10px;
      text-decoration: none; color: rgba(255,255,255,0.55);
      font-size: 0.9rem; font-weight: 500; transition: all 0.2s;
    }
    .nav-item:hover { color: white; background: rgba(255,255,255,0.07); }
    .nav-item.active { color: white; background: rgba(230,57,70,0.25); }
    .nav-item.active svg { color: #e63946; }

    .sidebar-footer {
      padding: 1rem 0.75rem 0;
      border-top: 1px solid rgba(255,255,255,0.07);
      display: flex; align-items: center; gap: 0.5rem;
    }
    .user-info { flex: 1; display: flex; align-items: center; gap: 0.6rem; min-width: 0; }
    .user-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; object-fit: cover; }
    .user-details { flex: 1; min-width: 0; }
    .user-name {
      display: block; font-size: 0.8rem; font-weight: 600;
      color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .user-email {
      display: block; font-size: 0.7rem; color: rgba(255,255,255,0.4);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .logout-btn {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.4); padding: 0.4rem; border-radius: 8px;
      transition: all 0.2s; flex-shrink: 0;
    }
    .logout-btn:hover { color: #e63946; background: rgba(230,57,70,0.15); }
  `]
})
export class SidebarComponent {
  auth = inject(AuthService);
}
