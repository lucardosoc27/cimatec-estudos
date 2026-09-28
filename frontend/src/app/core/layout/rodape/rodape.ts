import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icone } from '../../../shared/icone/icone';

/**
 * Rodapé. Na página inicial, a versão completa da maquete (docs/telas/00-landing), em três colunas;
 * nas outras telas, a versão compacta de sempre. Da maquete ficaram de fora, de propósito, a coluna
 * "Matérias frequentes" (lista inventada, e o projeto não mede frequência) e os selos "Iniciativa
 * voluntária" e "100% Gratuito" (DECISOES.md, 2026-09-28). No lugar da coluna de matérias entrou
 * "Acesso", com o Portfólio do projeto.
 */
@Component({
  selector: 'app-rodape',
  imports: [RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<footer>
    @if (completo()) {
      <div class="rodape rodape--completo">
        <div class="colunas grid gap-8 md:grid-cols-3">
          <div>
            <p class="marca flex items-center gap-2"><app-icone nome="livro" class="marca__icone" /> Cimatec Estudos</p>
            <p class="sobre">Projeto acadêmico desenvolvido por estudantes do SENAI CIMATEC. Plataforma voluntária e solidária para apoiar o aprendizado entre colegas.</p>
          </div>
          <nav aria-labelledby="rodape-acesso">
            <h2 id="rodape-acesso">Acesso</h2>
            <ul><li><a routerLink="/entrar">Entrar</a></li><li><a routerLink="/cadastro">Criar conta</a></li><li><a routerLink="/projeto">Portfólio do projeto</a></li></ul>
          </nav>
          <nav aria-labelledby="rodape-convivencia">
            <h2 id="rodape-convivencia">Convivência &amp; Privacidade</h2>
            <ul><li><a routerLink="/termos">Termos de Uso</a></li><li><a routerLink="/termos" fragment="privacidade">Política de Privacidade</a></li><li><a routerLink="/" fragment="perguntas">Dúvidas Frequentes</a></li></ul>
          </nav>
        </div>
        <p class="linha-final">© 2026 Cimatec Estudos. Projeto acadêmico desenvolvido por estudantes do SENAI CIMATEC.</p>
      </div>
    } @else {
      <div class="rodape flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p>© 2026 Cimatec Estudos • Projeto acadêmico desenvolvido por estudantes do SENAI CIMATEC.</p>
        <nav aria-label="Informações legais" class="flex flex-wrap gap-x-6 gap-y-2"><a routerLink="/termos">Termos de Uso</a><a routerLink="/termos" fragment="privacidade">Política de Privacidade</a></nav>
      </div>
    }
  </footer>`,
  styles: `
    :host { display: block; margin-top: auto; }
    footer { background: var(--cor-texto); color: var(--cor-borda-suave); }
    .rodape { max-width: 1280px; padding: 24px; margin: auto; }
    p { max-width: 760px; font-size: .875rem; }
    nav { flex-shrink: 0; }
    a, a:hover { display: inline-flex; align-items: center; min-height: 44px; color: var(--cor-borda-suave); font-size: .875rem; }
    a:focus-visible { outline-color: var(--cor-marca-ciano); }
    /* Versão completa: texto claro 11,76:1 e títulos brancos 16,27:1 sobre o azul-noite; ícone ciano 8,97:1. */
    .rodape--completo { max-width: 1240px; padding: 48px 32px 32px; }
    .marca { color: var(--cor-superficie); font-size: 1.125rem; font-weight: 800; }
    .marca__icone { color: var(--cor-marca-ciano); font-size: 1.4rem; }
    .sobre { margin-top: 12px; line-height: 1.6; }
    h2 { color: var(--cor-superficie); font-size: .875rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    ul { margin: 8px 0 0; padding: 0; list-style: none; }
    /* Links em lista, não dentro de frase: sem sublinhado, que volta no hover (como na maquete). */
    ul a { min-height: 36px; text-decoration: none; }
    ul a:hover { color: var(--cor-superficie); text-decoration: underline; }
    .linha-final { max-width: none; margin-top: 32px; padding-top: 24px; border-top: 1px solid color-mix(in srgb, var(--cor-borda-suave) 20%, var(--cor-texto)); }
  `,
})
export class Rodape {
  /** Versão completa, da maquete: só na página inicial (App decide pela rota). */
  readonly completo = input(false);
}
