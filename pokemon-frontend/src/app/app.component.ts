import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SidebarComponent } from './shared/components/sidebar.component';
import { TopbarComponent } from './shared/components/topbar.component';
import { AuthService } from './core/services/auth.service';

const PAGE_TITLES: Record<string, string> = {
  '/pokemon':   'Pokédex',
  '/favorites': 'Favoritos',
  '/teams':     'Mis Equipos',
  '/progress':  'Mi Progreso',
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
  `,
  styles: [`
    .app-main {
      margin-left: 220px;
      padding-top: 60px;
      min-height: 100vh;
      background: #f7f7f9;
    }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
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
}
