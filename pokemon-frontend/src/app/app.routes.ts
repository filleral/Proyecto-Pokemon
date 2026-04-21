import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'pokemon', pathMatch: 'full' },
  {
    path: 'pokemon',
    loadComponent: () => import('./features/pokemon-list/pokemon-list.component').then(m => m.PokemonListComponent)
  },
  {
    path: 'pokemon/:id',
    loadComponent: () => import('./features/pokemon-detail/pokemon-detail.component').then(m => m.PokemonDetailComponent)
  },
  {
    path: 'favorites',
    loadComponent: () => import('./features/favorites/favorites.component').then(m => m.FavoritesComponent)
  },
  {
    path: 'teams',
    loadComponent: () => import('./features/teams/teams.component').then(m => m.TeamsComponent)
  },
];
