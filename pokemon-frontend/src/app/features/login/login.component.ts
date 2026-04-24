import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="pokeball-logo">
          <div class="ball-top"></div>
          <div class="ball-middle">
            <div class="ball-button"></div>
          </div>
          <div class="ball-bottom"></div>
        </div>

        <h1 class="login-title">Pokédex</h1>
        <p class="login-subtitle">Tu compañero pokémon personal</p>

        <div class="divider"></div>

        <p class="login-desc">Inicia sesión para guardar tus favoritos y equipos</p>

        <div id="google-btn" class="google-btn-container"></div>

        <div class="loading-state" *ngIf="loading()">
          <div class="mini-spin"></div>
          <span>Iniciando sesión...</span>
        </div>

        <p class="error-msg" *ngIf="error()">{{ error() }}</p>
      </div>

      <div class="login-deco">
        <div class="deco-circle c1"></div>
        <div class="deco-circle c2"></div>
        <div class="deco-circle c3"></div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      position: relative; overflow: hidden;
    }
    .login-card {
      background: white; border-radius: 24px; padding: 3rem 2.5rem;
      width: 380px; max-width: 95vw; text-align: center;
      box-shadow: 0 32px 80px rgba(0,0,0,0.4); position: relative; z-index: 1;
    }
    .pokeball-logo {
      width: 72px; height: 72px; margin: 0 auto 1.5rem;
      position: relative; border-radius: 50%;
      border: 4px solid #1a1a2e; overflow: hidden;
    }
    .ball-top { height: 50%; background: #e63946; }
    .ball-bottom { height: 50%; background: white; }
    .ball-middle {
      position: absolute; top: 50%; left: 0; right: 0;
      height: 8px; background: #1a1a2e; transform: translateY(-50%);
      display: flex; align-items: center; justify-content: center;
    }
    .ball-button {
      width: 20px; height: 20px; border-radius: 50%;
      background: white; border: 4px solid #1a1a2e;
    }
    .login-title { font-size: 1.75rem; font-weight: 800; color: #1a1a2e; margin: 0 0 0.25rem; }
    .login-subtitle { color: #888; font-size: 0.9rem; margin: 0 0 1.5rem; }
    .divider { height: 1px; background: #f0f0f0; margin: 0 0 1.5rem; }
    .login-desc { color: #666; font-size: 0.9rem; margin: 0 0 1.5rem; }

    .google-btn-container {
      display: flex; justify-content: center; min-height: 44px;
    }
    .loading-state {
      display: flex; align-items: center; justify-content: center;
      gap: 0.75rem; color: #888; font-size: 0.9rem; margin-top: 1rem;
    }
    .mini-spin {
      width: 20px; height: 20px; border-radius: 50%;
      border: 3px solid #f0f0f0; border-top-color: #e63946;
      animation: spin 0.8s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error-msg { color: #e63946; font-size: 0.85rem; margin-top: 0.75rem; }

    .login-deco { position: absolute; inset: 0; pointer-events: none; }
    .deco-circle {
      position: absolute; border-radius: 50%;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    }
    .c1 { width: 400px; height: 400px; top: -100px; right: -100px; }
    .c2 { width: 300px; height: 300px; bottom: -80px; left: -80px; }
    .c3 { width: 200px; height: 200px; top: 40%; left: 5%; }
  `]
})
export class LoginComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);

  loading = signal(false);
  error = signal('');

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/pokemon']);
      return;
    }
    this.initGoogleSignIn();
  }

  private initGoogleSignIn() {
    const clientId = (window as any).__GOOGLE_CLIENT_ID__;
    if (!clientId || typeof google === 'undefined') {
      setTimeout(() => this.initGoogleSignIn(), 300);
      return;
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => this.handleCredential(response)
    });

    google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'outline', size: 'large', width: 300, text: 'signin_with', locale: 'es' }
    );
  }

  private handleCredential(response: any) {
    this.loading.set(true);
    this.error.set('');

    this.auth.loginWithGoogle(response.credential).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/pokemon']);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    });
  }
}
