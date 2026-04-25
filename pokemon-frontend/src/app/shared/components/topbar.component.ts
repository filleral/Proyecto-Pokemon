import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <div class="topbar-title">{{ title }}</div>
      <div class="topbar-right">

        <!-- Dark mode toggle -->
        <button class="theme-toggle" (click)="theme.toggle(auth.isLoggedIn())" [title]="theme.isDark() ? 'Modo claro' : 'Modo oscuro'">
          <!-- Sun icon (shown in dark mode) -->
          <svg *ngIf="theme.isDark()" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <!-- Moon icon (shown in light mode) -->
          <svg *ngIf="!theme.isDark()" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>

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
      transition: background .2s, border-color .2s;
    }
    .topbar-title { font-size: 1.1rem; font-weight: 700; color: #1a1a2e; transition: color .2s; }
    .topbar-right { display: flex; align-items: center; gap: .85rem; }

    /* Dark mode toggle button */
    .theme-toggle {
      width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      background: #f0f0f4; border: none; border-radius: 10px;
      cursor: pointer; color: #555; transition: all .2s;
    }
    .theme-toggle:hover { background: #e8e8f0; color: #1a1a2e; transform: rotate(15deg); }

    .user-chip {
      display: flex; align-items: center; gap: 0.5rem;
      background: #f8f8f8; border-radius: 999px; padding: 0.3rem 0.75rem 0.3rem 0.3rem;
    }
    .chip-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
    .chip-name { font-size: 0.85rem; font-weight: 600; color: #333; }

    /* ── Dark mode ──────────────────────────────────────────────────── */
    :host-context(html.dark) .topbar {
      background: #12102a;
      border-bottom-color: rgba(255,255,255,0.07);
    }
    :host-context(html.dark) .topbar-title { color: #e8e8f8; }
    :host-context(html.dark) .theme-toggle {
      background: rgba(255,255,255,0.08);
      color: #c8c8e8;
    }
    :host-context(html.dark) .theme-toggle:hover {
      background: rgba(255,255,255,0.14);
      color: #fbbf24;
    }
    :host-context(html.dark) .user-chip { background: rgba(255,255,255,0.06); }
    :host-context(html.dark) .chip-name { color: #d0d0e8; }
  `]
})
export class TopbarComponent {
  @Input() title = 'Pokédex';
  auth  = inject(AuthService);
  theme = inject(ThemeService);

  firstName(name: string): string { return name.split(' ')[0]; }
  onImgError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }
}
