import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AuthResponse, AuthUser } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = 'http://localhost:5279/api/auth';

  currentUser = signal<AuthUser | null>(this.loadUser());
  token = signal<string | null>(this.loadToken());

  loginWithGoogle(idToken: string) {
    return this.http.post<AuthResponse>(`${this.base}/google`, { idToken }).pipe(
      tap(res => {
        localStorage.setItem('pokemon_token', res.token);
        localStorage.setItem('pokemon_user', JSON.stringify(res.user));
        this.token.set(res.token);
        this.currentUser.set(res.user);
      })
    );
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
    if (this.isTokenExpired(t)) {
      this.logout();
      return false;
    }
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
    } catch {
      return true;
    }
  }
}
