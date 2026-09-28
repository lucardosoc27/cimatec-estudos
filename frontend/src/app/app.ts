import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { Cabecalho } from './core/layout/cabecalho/cabecalho';
import { Rodape } from './core/layout/rodape/rodape';
import { TituloComAnuncio } from './core/titulo-com-anuncio';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Cabecalho, Rodape],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  protected readonly autenticacao = signal(false);
  /** Página inicial: faixas de ponta a ponta e rodapé completo, como na maquete (docs/telas/00-landing). */
  protected readonly landing = signal(false);
  /** O que a região aria-live do app.html lê em voz alta a cada troca de tela. */
  protected readonly anuncio = inject(TituloComAnuncio).anuncio;
  private caminhoAnterior: string | null = null;
  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed()).subscribe(e => {
      this.autenticacao.set(/^\/(entrar|cadastro)(\?|$)/.test(e.urlAfterRedirects));
      this.landing.set(/^\/(\?|#|$)/.test(e.urlAfterRedirects));
      const caminho = e.urlAfterRedirects.split(/[?#]/)[0];
      const trocouDeTela = this.caminhoAnterior !== null && caminho !== this.caminhoAnterior;
      this.caminhoAnterior = caminho;
      // Quando o botão ou link usado para trocar de tela some, o foco cai no <body> e quem usa
      // teclado recomeça do topo da página. Nesse caso, e SÓ nesse caso, o foco vai para o
      // começo do conteúdo (#conteudo). Telas que já põem o foco em algo (a pilha de cartões,
      // por exemplo) não são tocadas, porque aí o foco não está no <body>.
      if (trocouDeTela) {
        setTimeout(() => {
          const ativo = document.activeElement;
          if (!ativo || ativo === document.body) document.getElementById('conteudo')?.focus({ preventScroll: true });
        }, 50);
      }
    });
  }
}
