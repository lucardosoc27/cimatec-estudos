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
  {
    path: 'mentores',
    title: 'Mentores recomendados · Cimatec Estudos',
    loadComponent: () => import('./features/mentores/mentores').then((m) => m.Mentores),
  },
  {
    path: 'mentores/:id',
    title: 'Perfil do mentor · Cimatec Estudos',
    loadComponent: () => import('./features/mentor-perfil/mentor-perfil').then((m) => m.MentorPerfil),
  },
  {
    path: 'pedidos/:id',
    title: 'Seu pedido · Cimatec Estudos',
    loadComponent: () => import('./features/pedido-detalhe/pedido-detalhe').then((m) => m.PedidoDetalhe),
  },
];
