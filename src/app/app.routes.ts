import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    title: 'Home',
    loadComponent: () => import('./components/home/home.component'),
  },
  { path: '**', redirectTo: 'home' },
];
