import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    title: 'Home',
    loadComponent: () => import('./home/home.component'),
  },
  { path: '**', redirectTo: 'home' },
];
