import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Início · Cimatec Estudos',
    loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
  },
  {
    path: 'pedir-ajuda',
    title: 'Pedir ajuda · Cimatec Estudos',
    loadComponent: () => import('./features/pedir-ajuda/pedir-ajuda').then((m) => m.PedirAjuda),
  },
];
