import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { AuthResponse } from '../../core/models/auth.model';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sub-page">

      <!-- Already premium banner -->
      <div class="already-premium" *ngIf="auth.isPremium()">
        <div class="ap-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
          </svg>
        </div>
        <div>
          <div class="ap-title">¡Ya eres Premium!</div>
          <div class="ap-sub">Tienes acceso completo a todas las funciones de PokeNexo.</div>
        </div>
        <a routerLink="/pokemon" class="btn-back">Ir a Pokédex</a>
      </div>

      <div *ngIf="!auth.isPremium()">

        <!-- Header -->
        <div class="sub-header">
          <div class="sub-crown">
            <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
          </div>
          <h1 class="sub-title">Hazte Premium</h1>
          <p class="sub-subtitle">Desbloquea todo el potencial de PokeNexo</p>
          <div class="trial-banner">
            <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            Empieza con <strong>3 días gratis</strong> — cancela cuando quieras
          </div>
        </div>

        <!-- Plans grid -->
        <div class="plans-row">

          <!-- Free plan -->
          <div class="plan-card free-card">
            <div class="plan-badge free-badge">Gratis</div>
            <div class="plan-price">
              <span class="price-amount">$0</span>
              <span class="price-period">/ mes</span>
            </div>
            <ul class="plan-features">
              <li class="feat feat-ok">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                Pokédex completa
              </li>
              <li class="feat feat-ok">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                Favoritos ilimitados
              </li>
              <li class="feat feat-ok">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                Equipos ilimitados
              </li>
              <li class="feat feat-no">
                <svg viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Build de Pokémon
              </li>
              <li class="feat feat-no">
                <svg viewBox="0 0 24 24" fill="none" stroke="#e63946" stroke-width="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Solo 1 progreso de juego
              </li>
            </ul>
            <div class="plan-current">Tu plan actual</div>
          </div>

          <!-- Monthly plan -->
          <div class="plan-card monthly-card">
            <div class="plan-top-row">
              <div class="plan-badge monthly-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                </svg>
                Premium Mensual
              </div>
            </div>
            <div class="plan-trial-pill">🎁 3 días gratis</div>
            <div class="plan-price">
              <span class="price-amount gold">$1</span>
              <span class="price-period">/ mes</span>
            </div>
            <div class="price-note">luego $1/mes</div>
            <ul class="plan-features">
              <li class="feat feat-ok">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                Todo lo del plan Gratis
              </li>
              <li class="feat feat-ok">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                Build completo de Pokémon
              </li>
              <li class="feat feat-ok">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                Sugerencias de movimientos
              </li>
              <li class="feat feat-ok">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                Progreso ilimitado de juegos
              </li>
            </ul>
            <button class="btn-upgrade btn-monthly" (click)="upgrade('monthly')" [disabled]="loading()">
              <span *ngIf="loadingPlan() !== 'monthly'">Empezar gratis 3 días</span>
              <span *ngIf="loadingPlan() === 'monthly'">Procesando...</span>
            </button>
            <p class="upgrade-note-dark">Cancela antes de los 3 días y no pagas nada.</p>
          </div>

          <!-- Annual plan -->
          <div class="plan-card annual-card">
            <div class="plan-top-row">
              <div class="plan-badge annual-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                </svg>
                Premium Anual
              </div>
              <div class="best-value-badge">MEJOR PRECIO</div>
            </div>
            <div class="plan-trial-pill annual-trial">🎁 3 días gratis + 1 mes gratis</div>
            <div class="plan-price">
              <span class="price-amount green">$10</span>
              <span class="price-period">/ año</span>
            </div>
            <div class="price-note green-note">
              equivale a $0.83/mes · <span class="save-tag">ahorras $2</span>
            </div>
            <ul class="plan-features">
              <li class="feat feat-ok-dark">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                Todo lo de Premium Mensual
              </li>
              <li class="feat feat-ok-dark">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                <strong>1 mes gratis</strong> incluido
              </li>
              <li class="feat feat-ok-dark">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                Soporte prioritario
              </li>
              <li class="feat feat-ok-dark">
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>
                Acceso anticipado a nuevas funciones
              </li>
            </ul>
            <button class="btn-upgrade btn-annual" (click)="upgrade('annual')" [disabled]="loading()">
              <span *ngIf="loadingPlan() !== 'annual'">Empezar gratis 3 días</span>
              <span *ngIf="loadingPlan() === 'annual'">Procesando...</span>
            </button>
            <p class="upgrade-note-dark">Cancela antes de los 3 días y no pagas nada.</p>
          </div>

        </div>

        <!-- Error -->
        <div class="error-msg" *ngIf="error()">{{ error() }}</div>

        <!-- Fine print -->
        <p class="fine-print">
          Al suscribirte aceptas los términos de servicio. El cobro se realiza al finalizar el período de prueba.
          Puedes cancelar en cualquier momento desde tu cuenta.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .sub-page { padding: 2.5rem 2rem; max-width: 960px; margin: 0 auto; }

    /* Already premium */
    .already-premium {
      display: flex; align-items: center; gap: 1.25rem;
      background: linear-gradient(135deg, #1a1a2e, #2a1a3e);
      border: 1.5px solid rgba(251,191,36,0.3);
      border-radius: 20px; padding: 1.75rem 2rem; color: white;
    }
    .ap-icon { color: #fbbf24; flex-shrink: 0; }
    .ap-title { font-size: 1.15rem; font-weight: 800; margin-bottom: 0.2rem; }
    .ap-sub { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
    .btn-back {
      margin-left: auto; padding: 0.55rem 1.25rem;
      background: rgba(255,255,255,0.1); color: white;
      border: 1px solid rgba(255,255,255,0.2); border-radius: 10px;
      text-decoration: none; font-size: 0.85rem; font-weight: 600;
      transition: background 0.2s; white-space: nowrap;
    }
    .btn-back:hover { background: rgba(255,255,255,0.18); }

    /* Header */
    .sub-header { text-align: center; margin-bottom: 2.5rem; }
    .sub-crown { color: #fbbf24; margin-bottom: 0.75rem; }
    .sub-title { font-size: 2.2rem; font-weight: 900; color: #1a1a2e; margin: 0 0 0.4rem; }
    .sub-subtitle { font-size: 1rem; color: #666; margin: 0 0 1rem; }

    .trial-banner {
      display: inline-flex; align-items: center; gap: 0.45rem;
      background: linear-gradient(135deg, #fef9c3, #fef08a);
      color: #854d0e; border: 1px solid #fde047;
      padding: 0.5rem 1.1rem; border-radius: 999px;
      font-size: 0.88rem; font-weight: 600;
    }
    .trial-banner svg { color: #ca8a04; }

    /* Plans grid */
    .plans-row { display: flex; gap: 1.25rem; align-items: stretch; }
    @media (max-width: 700px) { .plans-row { flex-direction: column; } }

    .plan-card {
      flex: 1; border-radius: 20px; padding: 1.75rem;
      display: flex; flex-direction: column; gap: 1rem;
    }
    .free-card    { background: white; border: 1.5px solid #e8e8e8; }
    .monthly-card {
      background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
      border: 1.5px solid rgba(251,191,36,0.35);
      box-shadow: 0 8px 32px rgba(251,191,36,0.12);
    }
    .annual-card {
      background: linear-gradient(145deg, #0f2d1a 0%, #143d24 100%);
      border: 2px solid rgba(34,197,94,0.45);
      box-shadow: 0 8px 32px rgba(34,197,94,0.15);
    }

    /* Badge row */
    .plan-top-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; }
    .plan-badge {
      display: inline-flex; align-items: center; gap: 0.3rem;
      padding: 0.28rem 0.75rem; border-radius: 20px;
      font-size: 0.72rem; font-weight: 800; letter-spacing: 0.4px;
      text-transform: uppercase; width: fit-content;
    }
    .free-badge    { background: #f0f0f0; color: #666; }
    .monthly-badge { background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); }
    .annual-badge  { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }

    .best-value-badge {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white; font-size: 0.65rem; font-weight: 900;
      padding: 0.2rem 0.6rem; border-radius: 6px; letter-spacing: 0.5px;
    }

    /* Trial pill */
    .plan-trial-pill {
      display: inline-block; font-size: 0.8rem; font-weight: 700;
      background: rgba(251,191,36,0.12); color: #fbbf24;
      border: 1px solid rgba(251,191,36,0.25);
      padding: 0.3rem 0.75rem; border-radius: 8px; width: fit-content;
    }
    .annual-trial {
      background: rgba(34,197,94,0.1); color: #4ade80;
      border-color: rgba(34,197,94,0.25);
    }

    /* Price */
    .plan-price { display: flex; align-items: baseline; gap: 0.2rem; }
    .price-amount { font-size: 2.6rem; font-weight: 900; color: #1a1a2e; }
    .price-amount.gold  { color: #fbbf24; }
    .price-amount.green { color: #4ade80; }
    .price-period { font-size: 0.9rem; color: #999; }
    .monthly-card .price-period,
    .annual-card  .price-period { color: rgba(255,255,255,0.35); }

    .price-note { font-size: 0.76rem; color: rgba(255,255,255,0.4); margin-top: -0.5rem; }
    .green-note { color: rgba(74,222,128,0.6); }
    .save-tag { background: rgba(34,197,94,0.2); color: #4ade80; padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700; }

    /* Features */
    .plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.65rem; flex: 1; }
    .feat { display: flex; align-items: flex-start; gap: 0.55rem; font-size: 0.86rem; }
    .feat-ok     { color: #444; }
    .feat-no     { color: #bbb; }
    .feat-ok-dark { color: rgba(255,255,255,0.82); }
    .monthly-card .feat-ok { color: rgba(255,255,255,0.82); }
    .monthly-card .feat-no { color: rgba(255,255,255,0.25); }

    /* Current plan placeholder */
    .plan-current {
      text-align: center; font-size: 0.82rem; font-weight: 600;
      color: #bbb; padding: 0.65rem; border: 1.5px dashed #e0e0e0; border-radius: 10px;
    }

    /* Buttons */
    .btn-upgrade {
      width: 100%; padding: 0.88rem;
      border: none; border-radius: 12px;
      font-size: 0.92rem; font-weight: 800; cursor: pointer;
      transition: all 0.2s;
    }
    .btn-upgrade:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-monthly {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #1a1a2e; box-shadow: 0 4px 14px rgba(251,191,36,0.35);
    }
    .btn-monthly:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(251,191,36,0.5); }

    .btn-annual {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white; box-shadow: 0 4px 14px rgba(34,197,94,0.3);
    }
    .btn-annual:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(34,197,94,0.45); }

    .upgrade-note-dark { text-align: center; font-size: 0.73rem; color: rgba(255,255,255,0.3); margin: 0; }

    .error-msg { margin-top: 1rem; text-align: center; color: #e63946; font-size: 0.88rem; }

    .fine-print { text-align: center; font-size: 0.73rem; color: #aaa; margin-top: 1.5rem; max-width: 560px; margin-left: auto; margin-right: auto; line-height: 1.6; }
  `]
})
export class SubscriptionComponent {
  auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  loading    = signal(false);
  loadingPlan = signal<'monthly' | 'annual' | null>(null);
  error      = signal('');

  upgrade(plan: 'monthly' | 'annual') {
    this.loading.set(true);
    this.loadingPlan.set(plan);
    this.error.set('');
    this.http.post<AuthResponse>('http://localhost:5279/api/subscription/upgrade', { plan }).subscribe({
      next: res => {
        this.auth.setTokenAndUser(res);
        this.loading.set(false);
        this.loadingPlan.set(null);
        this.router.navigate(['/pokemon']);
      },
      error: () => {
        this.error.set('Error al procesar la suscripción. Intenta de nuevo.');
        this.loading.set(false);
        this.loadingPlan.set(null);
      }
    });
  }
}
