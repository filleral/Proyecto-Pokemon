import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SidebarComponent } from './shared/components/sidebar.component';
import { TopbarComponent } from './shared/components/topbar.component';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';

const PAGE_TITLES: Record<string, string> = {
  '/pokemon':      'Pokédex',
  '/favorites':    'Favoritos',
  '/teams':        'Mis Equipos',
  '/progress':     'Mi Progreso',
  '/subscription': 'Premium',
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, TopbarComponent],
  template: `
    <ng-container *ngIf="auth.isLoggedIn(); else publicLayout">
      <app-sidebar />
      <app-topbar [title]="pageTitle()" />
      <main class="app-main">
        <router-outlet />
      </main>
    </ng-container>

    <ng-template #publicLayout>
      <router-outlet />
    </ng-template>

    <!-- WELCOME PREMIUM POPUP -->
    <div class="welcome-overlay" *ngIf="auth.justUpgraded()" (click)="dismissWelcome()">
      <div class="welcome-card" (click)="$event.stopPropagation()">

        <div class="welcome-glow"></div>

        <div class="welcome-crown">
          <svg viewBox="0 0 24 24" fill="currentColor" width="52" height="52">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>

        <h1 class="welcome-title">¡Bienvenido a Premium!</h1>
        <p class="welcome-sub">Ahora tienes acceso completo a todo PokeNexo</p>

        <div class="welcome-benefits">
          <div class="benefit">
            <span class="benefit-icon">⚔️</span>
            <div class="benefit-text">
              <strong>Build completo de Pokémon</strong>
              <span>Objeto, movimientos, EVs, IVs, habilidad y naturaleza</span>
            </div>
          </div>
          <div class="benefit">
            <span class="benefit-icon">📋</span>
            <div class="benefit-text">
              <strong>Progreso ilimitado</strong>
              <span>Registra todos tus juegos sin ningún límite</span>
            </div>
          </div>
          <div class="benefit">
            <span class="benefit-icon">🧠</span>
            <div class="benefit-text">
              <strong>Sugerencias inteligentes</strong>
              <span>Movimientos recomendados con sinergia de habilidad y objeto</span>
            </div>
          </div>
          <div class="benefit">
            <span class="benefit-icon">⭐</span>
            <div class="benefit-text">
              <strong>Soporte prioritario</strong>
              <span>Acceso anticipado a nuevas funciones</span>
            </div>
          </div>
        </div>

        <button class="welcome-btn" (click)="dismissWelcome()">
          ¡Empezar a disfrutarlo!
        </button>

        <p class="welcome-note">Gracias por apoyar PokeNexo 🙏</p>
      </div>
    </div>
  `,
  styles: [`
    .app-main {
      margin-left: 220px;
      padding-top: 60px;
      min-height: 100vh;
      background: #f7f7f9;
      transition: background .2s;
    }
    :host-context(html.dark) .app-main { background: #0d0d1a; }

    /* ── Welcome Premium Overlay ─────────────────────────────────────────── */
    .welcome-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.65);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; padding: 1rem;
      backdrop-filter: blur(4px);
      animation: fadeIn .3s ease;
    }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

    .welcome-card {
      background: linear-gradient(160deg, #1a1a2e 0%, #12102a 60%, #0d1f12 100%);
      border: 1.5px solid rgba(251,191,36,0.3);
      border-radius: 28px;
      padding: 2.75rem 2.5rem 2.25rem;
      width: 100%; max-width: 480px;
      text-align: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 60px rgba(251,191,36,0.08);
      animation: slideUp .35s ease;
    }
    @keyframes slideUp { from { transform:translateY(24px);opacity:0 } to { transform:translateY(0);opacity:1 } }

    .welcome-glow {
      position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
      width: 200px; height: 200px;
      background: radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 70%);
      pointer-events: none;
    }

    .welcome-crown {
      color: #fbbf24;
      filter: drop-shadow(0 0 16px rgba(251,191,36,0.6));
      margin-bottom: 1rem;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%,100% { filter: drop-shadow(0 0 16px rgba(251,191,36,0.6)); }
      50%      { filter: drop-shadow(0 0 28px rgba(251,191,36,0.9)); }
    }

    .welcome-title {
      font-size: 1.9rem; font-weight: 900; color: white;
      margin: 0 0 0.4rem; letter-spacing: -0.5px;
    }
    .welcome-sub {
      font-size: 0.9rem; color: rgba(255,255,255,0.5);
      margin: 0 0 1.75rem;
    }

    .welcome-benefits {
      display: flex; flex-direction: column; gap: 0.85rem;
      text-align: left; margin-bottom: 2rem;
    }
    .benefit {
      display: flex; align-items: flex-start; gap: 0.85rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px; padding: 0.75rem 1rem;
    }
    .benefit-icon { font-size: 1.3rem; flex-shrink: 0; line-height: 1.3; }
    .benefit-text { display: flex; flex-direction: column; gap: 0.1rem; }
    .benefit-text strong { font-size: 0.88rem; color: white; font-weight: 700; }
    .benefit-text span { font-size: 0.76rem; color: rgba(255,255,255,0.42); line-height: 1.4; }

    .welcome-btn {
      width: 100%; padding: 1rem;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #1a1a2e; border: none; border-radius: 14px;
      font-size: 1rem; font-weight: 900; cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 20px rgba(251,191,36,0.4);
      letter-spacing: -0.2px;
    }
    .welcome-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(251,191,36,0.55);
    }

    .welcome-note {
      font-size: 0.75rem; color: rgba(255,255,255,0.25);
      margin: 1rem 0 0;
    }
  `]
})
export class AppComponent implements OnInit {
  auth  = inject(AuthService);
  theme = inject(ThemeService); // initializes dark mode on app load
  private router = inject(Router);

  private url$ = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    map(e => (e as NavigationEnd).urlAfterRedirects)
  );

  pageTitle = toSignal(
    this.url$.pipe(
      map(url => {
        const base = '/' + url.split('/')[1];
        return PAGE_TITLES[base] ?? 'PokeNexo';
      })
    ),
    { initialValue: 'PokeNexo' }
  );

  ngOnInit() {
    // Sync with the real DB role on every app load — no re-login needed
    this.auth.refreshFromServer();
  }

  dismissWelcome() {
    this.auth.justUpgraded.set(false);
  }
}
