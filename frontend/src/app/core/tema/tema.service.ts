import { Injectable, signal } from '@angular/core';

/** "sistema" = seguir o claro ou escuro do aparelho; os outros dois são escolha da pessoa. */
export type EscolhaDeTema = 'sistema' | 'claro' | 'escuro';

/** A única coisa que o site guarda no navegador (localStorage). O script do index.html lê a mesma chave. */
const CHAVE = 'tema';

/**
 * Escolha de tema claro ou escuro. Quem pinta a tela é o CSS (styles.scss): este serviço só põe ou tira o
 * atributo data-tema no <html> e guarda a escolha. O mesmo atributo é posto antes da primeira pintura pelo
 * script do index.html, para a tela não piscar clara antes de escurecer; aqui ele só é lido.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  /** signal: o rodapé mostra a opção marcada e se atualiza sozinho quando ela muda. */
  readonly escolha = signal<EscolhaDeTema>(this.lerEscolha());

  escolher(tema: EscolhaDeTema): void {
    this.escolha.set(tema);
    const raiz = document.documentElement;
    if (tema === 'sistema') raiz.removeAttribute('data-tema');
    else raiz.setAttribute('data-tema', tema);
    // O localStorage pode estar bloqueado (janela anônima, site sem permissão): aí a escolha vale só
    // até fechar a página, e nada quebra.
    try {
      if (tema === 'sistema') localStorage.removeItem(CHAVE);
      else localStorage.setItem(CHAVE, tema);
    } catch { /* sem armazenamento: segue sem guardar */ }
  }

  private lerEscolha(): EscolhaDeTema {
    const atributo = document.documentElement.getAttribute('data-tema');
    return atributo === 'claro' || atributo === 'escuro' ? atributo : 'sistema';
  }
}
