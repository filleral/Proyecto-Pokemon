import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthResponse, AuthUser, UpdateProfileRequest } from '../models/auth.model';
import { ThemeService } from './theme.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);
  private theme  = inject(ThemeService);
  private base   = 'http://localhost:5279/api/auth';

  currentUser  = signal<AuthUser | null>(this.loadUser());
  token        = signal<string | null>(this.loadToken());
  justUpgraded = signal(false); // triggers the welcome-premium popup

  role      = computed(() => this.currentUser()?.role ?? 'free');
  isPremium = computed(() => { const r = this.role(); return r === 'premium' || r === 'admin'; });
  isAdmin   = computed(() => this.role() === 'admin');

  loginWithGoogle(idToken: string) {
    return this.http.post<AuthResponse>(`${this.base}/google`, { idToken }).pipe(
      tap(res => this.setTokenAndUser(res))
    );
  }

  updateProfile(data: UpdateProfileRequest) {
    return this.http.patch<AuthResponse>(`${this.base}/profile`, data).pipe(
      tap(res => this.setTokenAndUser(res))
    );
  }

  uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<AuthResponse>(`${this.base}/avatar`, fd).pipe(
      tap(res => this.setTokenAndUser(res))
    );
  }

  /** Reads the real role from the DB and refreshes the local token/user.
   *  Call on app startup so a role changed in the DB takes effect immediately. */
  refreshFromServer() {
    if (!this.isLoggedIn()) return;
    const previousRole = this.currentUser()?.role ?? 'free';

    this.http.get<AuthResponse>(`${this.base}/me`).subscribe({
      next: res => {
        this.setTokenAndUser(res);
        if (previousRole !== 'premium' && previousRole !== 'admin' &&
            (res.user.role === 'premium' || res.user.role === 'admin')) {
          this.justUpgraded.set(true);
        }
      },
      error: () => { /* silently ignore — server may be offline */ }
    });
  }

  setTokenAndUser(res: AuthResponse) {
    localStorage.setItem('pokemon_token', res.token);
    localStorage.setItem('pokemon_user', JSON.stringify(res.user));
    this.token.set(res.token);
    this.currentUser.set(res.user);
    // Always let the server value win for theme preference
    this.theme.applyUserPreference(res.user.darkMode);
  }

  logout() {
    localStorage.removeItem('pokemon_token');
    localStorage.removeItem('pokemon_user');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    const t = this.token();
    if (!t) return false;
    if (this.isTokenExpired(t)) { this.logout(); return false; }
    return true;
  }

  private loadToken(): string | null {
    const t = localStorage.getItem('pokemon_token');
    if (!t) return null;
    if (this.isTokenExpired(t)) {
      localStorage.removeItem('pokemon_token');
      localStorage.removeItem('pokemon_user');
      return null;
    }
    return t;
  }

  private loadUser(): AuthUser | null {
    const stored = localStorage.getItem('pokemon_user');
    return stored ? JSON.parse(stored) : null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() / 1000 > payload.exp;
    } catch { return true; }
  }
}
