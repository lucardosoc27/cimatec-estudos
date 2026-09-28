import { Routes } from '@angular/router';
import { authGuard, visitanteGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', title: 'Cimatec Estudos · Mentoria entre alunos', canActivate: [visitanteGuard], loadComponent: () => import('./features/landing/landing').then(m => m.Landing) },
  { path: 'entrar', title: 'Entrar · Cimatec Estudos', canActivate: [visitanteGuard], loadComponent: () => import('./features/auth/auth').then(m => m.Auth) },
  { path: 'cadastro', title: 'Criar conta · Cimatec Estudos', canActivate: [visitanteGuard], loadComponent: () => import('./features/auth/auth').then(m => m.Auth) },
  { path: 'verificar-email', title: 'Verificar e-mail · Cimatec Estudos', loadComponent: () => import('./features/auth/verificar-email').then(m => m.VerificarEmail) },
  { path: 'termos', title: 'Termos e Privacidade · Cimatec Estudos', loadComponent: () => import('./features/termos/termos').then(m => m.Termos) },
  // Portfólio do PROJETO (o que é, o problema, as telas, o que vem depois). Público, sem guard.
  // Não é o portfólio de cada aluno das telas 9 e 10, por isso /projeto e não /portfolio.
  { path: 'projeto', title: 'Portfólio do projeto · Cimatec Estudos', loadComponent: () => import('./features/projeto/projeto').then(m => m.Projeto) },
  {
    path: '', canActivateChild: [authGuard], children: [
      { path: 'inicio', title: 'Início · Cimatec Estudos', loadComponent: () => import('./features/inicio/inicio').then(m => m.Inicio) },
      { path: 'pedir-ajuda', title: 'Pedir ajuda · Cimatec Estudos', loadComponent: () => import('./features/pedir-ajuda/pedir-ajuda').then(m => m.PedirAjuda) },
      { path: 'mentores', title: 'Mentores para você · Cimatec Estudos', loadComponent: () => import('./features/mentores/mentores').then(m => m.Mentores) },
      { path: 'mentores/:id', title: 'Perfil do mentor · Cimatec Estudos', loadComponent: () => import('./features/mentor-perfil/mentor-perfil').then(m => m.MentorPerfil) },
      { path: 'pedidos/:id', title: 'Seu pedido · Cimatec Estudos', loadComponent: () => import('./features/pedido-detalhe/pedido-detalhe').then(m => m.PedidoDetalhe) },
      { path: 'conta', title: 'Minha conta · Cimatec Estudos', loadComponent: () => import('./features/conta/conta').then(m => m.Conta) },
    ],
  },
  { path: '**', redirectTo: '' },
];
