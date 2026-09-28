import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Perguntas frequentes da página inicial. Componente à parte da landing, como a vitrine, para o
 * CSS de cada um caber com folga no limite de 8 kB por componente do build (angular.json). É só
 * texto fixo: sem dado, sem estado. O <details> nativo já abre e fecha por teclado.
 */
@Component({
  selector: 'app-perguntas',
  templateUrl: './perguntas.html',
  styleUrl: './perguntas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Perguntas {}
