import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private http = inject(HttpClient);
  private base = 'http://localhost:5279/api/auth';

  isDark = signal<boolean>(this._loadInitial());

  constructor() {
    // Apply/remove the 'dark' class on <html> whenever the signal changes
    effect(() => {
      document.documentElement.classList.toggle('dark', this.isDark());
    });
  }

  /** Called by AuthService.setTokenAndUser so the server value always wins */
  applyUserPreference(darkMode: boolean) {
    this.isDark.set(darkMode);
  }

  toggle(isLoggedIn: boolean) {
    const newVal = !this.isDark();
    this.isDark.set(newVal);

    // Keep the cached user object in sync so it survives a page reload
    try {
      const raw = localStorage.getItem('pokemon_user');
      if (raw) {
        localStorage.setItem('pokemon_user', JSON.stringify({ ...JSON.parse(raw), darkMode: newVal }));
      }
    } catch { /* ignore parse errors */ }

    // Persist to the database (fire-and-forget)
    if (isLoggedIn) {
      this.http.patch(`${this.base}/theme`, { darkMode: newVal }).subscribe();
    }
  }

  private _loadInitial(): boolean {
    try {
      const raw = localStorage.getItem('pokemon_user');
      if (raw) return JSON.parse(raw).darkMode ?? false;
    } catch { /* ignore */ }
    // Fallback: honour the OS preference on first visit
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
