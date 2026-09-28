import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Nomes dos ícones desenhados no projeto. */
export type NomeIcone =
  | 'escola' | 'relogio' | 'busca' | 'estrela' | 'pausa' | 'continuar' | 'seta-esquerda' | 'seta-direita'
  | 'mao-coracao' | 'livro' | 'aspas' | 'verificado' | 'calendario' | 'info' | 'bandeja-entrada' | 'bandeja-saida' | 'pilha' | 'lista' | 'local' | 'prancheta'
  | 'codigo' | 'rede' | 'frasco' | 'bequer' | 'gota' | 'raio' | 'predio' | 'engrenagem' | 'video'
  | 'cadeado' | 'envelope' | 'copiar' | 'fechar-circulo';

/**
 * Ícones em SVG escritos à mão, dentro do projeto: nenhuma fonte de ícone nem nada que dependa de
 * internet (se uma fonte externa falhasse, apareceria o nome do ícone em texto cru no lugar).
 * Todos desenham com currentColor, então herdam a cor do texto em volta, e são decoração
 * (aria-hidden): o texto ao lado é quem diz o que é. O tamanho vem de quem usa (1em por padrão).
 */
@Component({
  selector: 'app-icone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      @switch (nome()) {
        @case ('escola') { <path d="M2 9.5 12 5l10 4.5L12 14 2 9.5Z"/><path d="M6 11.5v4.5c3.5 2.3 8.5 2.3 12 0v-4.5M22 9.5V15"/> }
        @case ('relogio') { <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/> }
        @case ('calendario') { <rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/> }
        @case ('info') { <circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.01"/> }
        @case ('bandeja-entrada') { <path d="M3.5 13.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4.5M3.5 13.5h4.5l1.5 2.5h5l1.5-2.5h4.5M12 3.5v8M8.5 8l3.5 3.5L15.5 8"/> }
        @case ('bandeja-saida') { <path d="M3.5 13.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4.5M3.5 13.5h4.5l1.5 2.5h5l1.5-2.5h4.5M12 11.5v-8M8.5 7 12 3.5 15.5 7"/> }
        @case ('pilha') { <rect x="6.5" y="3.5" width="11" height="17" rx="2"/><path d="M3 7v10M21 7v10"/> }
        @case ('lista') { <path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/> }
        @case ('local') { <path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/> }
        @case ('prancheta') { <rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5v-1h6v1M9 10h6M9 14h6"/> }
        @case ('verificado') { <circle cx="12" cy="12" r="9"/><path d="m8.5 12.3 2.4 2.4 4.6-4.9"/> }
        @case ('busca') { <circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/> }
        @case ('estrela') { <circle cx="12" cy="12" r="9.5"/><path d="m12 7 1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5L12 7Z"/> }
        @case ('pausa') { <rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/> }
        @case ('continuar') { <path d="M7 4.5v15l12-7.5L7 4.5Z" fill="currentColor" stroke="none"/> }
        @case ('seta-esquerda') { <path d="m14.5 6-6 6 6 6"/> }
        @case ('seta-direita') { <path d="m9.5 6 6 6-6 6"/> }
        @case ('mao-coracao') { <path d="M12 5.5c-1.3-2-4.5-1.5-4.5 1 0 1.9 2.6 3.4 4.5 4.8 1.9-1.4 4.5-2.9 4.5-4.8 0-2.5-3.2-3-4.5-1Z"/><path d="M2.5 16.5h3l3-1.5H13a1.8 1.8 0 0 1 0 3.5H9.5M5.5 21l2.5-1h6l6.5-4a1.6 1.6 0 0 0-2-2.5l-3.5 2"/> }
        @case ('aspas') { <path d="M4 18.5c0-5 2-8.5 6-11l1.2 1.6C8.8 11 8 12.7 8 14.5h2.5V20H4v-1.5ZM13.5 18.5c0-5 2-8.5 6-11l1.2 1.6c-2.4 1.9-3.2 3.6-3.2 5.4H20V20h-6.5v-1.5Z" fill="currentColor" stroke="none"/> }
        @case ('livro') { <path d="M12 6.5C9.5 4.8 6.5 4.5 3 5v13.5c3.5-.5 6.5-.2 9 1.5 2.5-1.7 5.5-2 9-1.5V5c-3.5-.5-6.5-.2-9 1.5Zm0 0V20"/> }
        @case ('codigo') { <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/> }
        @case ('rede') { <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/> }
        @case ('frasco') { <path d="M9.5 3h5M10.5 3v5.5L5 18.3A1.8 1.8 0 0 0 6.6 21h10.8a1.8 1.8 0 0 0 1.6-2.7L13.5 8.5V3M7.5 15h9"/> }
        @case ('bequer') { <path d="M5 3h14M6.5 3v14.5A3.5 3.5 0 0 0 10 21h4a3.5 3.5 0 0 0 3.5-3.5V3M6.5 10h11"/><circle cx="10.5" cy="15" r=".8" fill="currentColor"/><circle cx="14" cy="17" r=".8" fill="currentColor"/> }
        @case ('gota') { <path d="M12 3s6.5 6.8 6.5 11.3a6.5 6.5 0 0 1-13 0C5.5 9.8 12 3 12 3Z"/> }
        @case ('raio') { <path d="M13.5 2.5 4.5 14h7l-1 7.5 9-11.5h-7l1-7.5Z"/> }
        @case ('predio') { <path d="M3 21h18M5 21V5.5L13 3v18M13 21h6V9.5L13 8M8.5 8v.01M8.5 12v.01M8.5 16v.01M16 13v.01M16 17v.01"/> }
        @case ('engrenagem') { <circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/> }
        @case ('cadeado') { <rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3M12 14.5v2"/> }
        @case ('envelope') { <rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/> }
        @case ('copiar') { <rect x="8.5" y="8.5" width="11.5" height="12" rx="2"/><path d="M15.5 8.5V5.5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2V15a2 2 0 0 0 2 2h2.5"/> }
        @case ('fechar-circulo') { <circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/> }
        @case ('video') { <rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m10.5 9.2 4.5 2.8-4.5 2.8V9.2Z" fill="currentColor"/> }
      }
    </svg>
  `,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; width: 1em; height: 1em; }
    svg { width: 100%; height: 100%; }
  `,
})
export class Icone {
  readonly nome = input.required<NomeIcone>();
}
