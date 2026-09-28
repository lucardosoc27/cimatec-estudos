import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Nomes dos ícones desenhados no projeto. */
export type NomeIcone =
  | 'escola' | 'relogio' | 'busca' | 'estrela' | 'pausa' | 'continuar' | 'seta-esquerda' | 'seta-direita'
  | 'mao-coracao' | 'livro'
  | 'codigo' | 'rede' | 'frasco' | 'bequer' | 'gota' | 'raio' | 'predio' | 'engrenagem' | 'video';

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
        @case ('busca') { <circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/> }
        @case ('estrela') { <circle cx="12" cy="12" r="9.5"/><path d="m12 7 1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5L12 7Z"/> }
        @case ('pausa') { <rect x="6.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="3.5" height="14" rx="1" fill="currentColor" stroke="none"/> }
        @case ('continuar') { <path d="M7 4.5v15l12-7.5L7 4.5Z" fill="currentColor" stroke="none"/> }
        @case ('seta-esquerda') { <path d="m14.5 6-6 6 6 6"/> }
        @case ('seta-direita') { <path d="m9.5 6 6 6-6 6"/> }
        @case ('mao-coracao') { <path d="M12 5.5c-1.3-2-4.5-1.5-4.5 1 0 1.9 2.6 3.4 4.5 4.8 1.9-1.4 4.5-2.9 4.5-4.8 0-2.5-3.2-3-4.5-1Z"/><path d="M2.5 16.5h3l3-1.5H13a1.8 1.8 0 0 1 0 3.5H9.5M5.5 21l2.5-1h6l6.5-4a1.6 1.6 0 0 0-2-2.5l-3.5 2"/> }
        @case ('livro') { <path d="M12 6.5C9.5 4.8 6.5 4.5 3 5v13.5c3.5-.5 6.5-.2 9 1.5 2.5-1.7 5.5-2 9-1.5V5c-3.5-.5-6.5-.2-9 1.5Zm0 0V20"/> }
        @case ('codigo') { <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 5l-3 14"/> }
        @case ('rede') { <circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/> }
        @case ('frasco') { <path d="M9.5 3h5M10.5 3v5.5L5 18.3A1.8 1.8 0 0 0 6.6 21h10.8a1.8 1.8 0 0 0 1.6-2.7L13.5 8.5V3M7.5 15h9"/> }
        @case ('bequer') { <path d="M5 3h14M6.5 3v14.5A3.5 3.5 0 0 0 10 21h4a3.5 3.5 0 0 0 3.5-3.5V3M6.5 10h11"/><circle cx="10.5" cy="15" r=".8" fill="currentColor"/><circle cx="14" cy="17" r=".8" fill="currentColor"/> }
        @case ('gota') { <path d="M12 3s6.5 6.8 6.5 11.3a6.5 6.5 0 0 1-13 0C5.5 9.8 12 3 12 3Z"/> }
        @case ('raio') { <path d="M13.5 2.5 4.5 14h7l-1 7.5 9-11.5h-7l1-7.5Z"/> }
        @case ('predio') { <path d="M3 21h18M5 21V5.5L13 3v18M13 21h6V9.5L13 8M8.5 8v.01M8.5 12v.01M8.5 16v.01M16 13v.01M16 17v.01"/> }
        @case ('engrenagem') { <circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/> }
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
