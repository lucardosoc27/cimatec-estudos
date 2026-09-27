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
  /** O que a região aria-live do app.html lê em voz alta a cada troca de tela. */
  protected readonly anuncio = inject(TituloComAnuncio).anuncio;
  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed()).subscribe(e => {
      this.autenticacao.set(/^\/(entrar|cadastro)(\?|$)/.test(e.urlAfterRedirects));
    });
  }
}
