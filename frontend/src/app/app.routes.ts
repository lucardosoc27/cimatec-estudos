import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Início · Cimatec Estudos',
    loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
  },
];
