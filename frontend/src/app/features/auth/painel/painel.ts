import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icone } from '../../../shared/icone/icone';

/**
 * Painel azul das telas de entrar e cadastro: a marca, a animação do encontro, o título e os dois
 * destaques. Componente à parte do formulário porque é uma unidade inteira (não depende de nada do
 * formulário) e para o CSS de cada um caber com folga no limite de 8 kB por componente do build.
 */
@Component({
  selector: 'app-painel-acesso',
  imports: [RouterLink, Icone],
  templateUrl: './painel.html',
  styleUrl: './painel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PainelAcesso {
  /** Liga a classe que toca a animação do encontro. Começa ligada: a animação roda ao abrir a tela. */
  protected readonly animar = signal(true);

  /**
   * Toca a animação de novo (clique, toque, Enter ou ponteiro em cima). Desliga a classe e religa
   * logo depois: sem essa pausa, o navegador não percebe a troca e não recomeça a animação.
   */
  protected repetirAnimacao(): void {
    this.animar.set(false);
    setTimeout(() => this.animar.set(true), 30);
  }
}
