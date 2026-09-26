import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rodape',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<footer><div class="rodape flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
    <p>© 2026 Cimatec Estudos • Projeto acadêmico desenvolvido por estudantes do SENAI CIMATEC.</p>
    <nav aria-label="Informações legais" class="flex flex-wrap gap-x-6 gap-y-2"><a routerLink="/termos">Termos de Uso</a><a routerLink="/termos" fragment="privacidade">Política de Privacidade</a></nav>
  </div></footer>`,
  styles: `
    :host { display: block; margin-top: auto; }
    footer { background: var(--cor-texto); color: var(--cor-borda-suave); }
    .rodape { max-width: 1280px; padding: 24px; margin: auto; }
    p { max-width: 760px; font-size: .875rem; }
    nav { flex-shrink: 0; }
    a, a:hover { display: inline-flex; align-items: center; min-height: 44px; color: var(--cor-borda-suave); font-size: .875rem; }
    a:focus-visible { outline-color: var(--cor-marca-ciano); }
  `,
})
export class Rodape {}
