import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'pokemon', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'pokemon',
    canActivate: [authGuard],
    loadComponent: () => import('./features/pokemon-list/pokemon-list.component').then(m => m.PokemonListComponent)
  },
  {
    path: 'pokemon/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/pokemon-detail/pokemon-detail.component').then(m => m.PokemonDetailComponent)
  },
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () => import('./features/favorites/favorites.component').then(m => m.FavoritesComponent)
  },
  {
    path: 'teams',
    canActivate: [authGuard],
    loadComponent: () => import('./features/teams/teams.component').then(m => m.TeamsComponent)
  },
  {
    path: 'progress',
    canActivate: [authGuard],
    loadComponent: () => import('./features/progress-list/progress-list.component').then(m => m.ProgressListComponent)
  },
  {
    path: 'progress/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/progress-detail/progress-detail.component').then(m => m.ProgressDetailComponent)
  },
  {
    path: 'items',
    canActivate: [authGuard],
    loadComponent: () => import('./features/items/items.component').then(m => m.ItemsComponent)
  },
  {
    path: 'subscription',
    canActivate: [authGuard],
    loadComponent: () => import('./features/subscription/subscription.component').then(m => m.SubscriptionComponent)
  },
];
