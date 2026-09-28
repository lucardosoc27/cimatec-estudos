import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/**
 * Foto ou inicial de uma pessoa. É decoração para o leitor de tela (aria-hidden e alt vazio):
 * em todos os usos o nome já está escrito ao lado, e ler "B, Bernardo" ou "Bernardo, Bernardo"
 * só atrapalha. Se um dia o avatar aparecer SEM o nome ao lado, ele precisa voltar a ter texto.
 */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <span class="avatar" [style.background]="fundo()" [style.width.px]="tamanho()" [style.height.px]="tamanho()" [style.font-size.px]="tamanho() * .46">
      @if (foto() && falhou() !== foto()) {
        <img [src]="foto()" alt="" (error)="falhou.set(foto())" />
      } @else {
        <span>{{ inicial() }}</span>
      }
    </span>
  `,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; vertical-align: middle; }
    /* Sem foto: a inicial, branca e grande (46% do círculo), sobre um dos cinco azuis da marca
       (--cor-avatar-1 a 5 em styles.scss; contrastes medidos lá). Antes era 38% e, na vitrine
       pública, cinza neutro (DECISOES.md, 2026-09-28). */
    .avatar { display: grid; place-items: center; overflow: hidden; border-radius: 50%; color: var(--cor-superficie); font-weight: 700; line-height: 1; }
    img { width: 100%; height: 100%; object-fit: cover; }
  `,
})
export class Avatar {
  readonly nome = input.required<string>();
  readonly foto = input<string | null | undefined>(null);
  readonly tamanho = input(48);
  protected readonly falhou = signal<string | null | undefined>(undefined);
  protected readonly inicial = computed(() => this.nome().trim().charAt(0).toLocaleUpperCase('pt-BR'));
  /**
   * Um dos cinco tons, escolhido a partir das letras do nome: variação leve entre pessoas, e
   * sempre o mesmo tom para a mesma pessoa, em qualquer tela. Cada letra pesa pela posição
   * (vezes 31, como no hashCode do Java); a soma simples dava o mesmo tom a Bruno, Bernardo e Diego.
   */
  protected readonly fundo = computed(() => {
    const valor = [...this.nome().trim()].reduce((total, letra) => (total * 31 + letra.charCodeAt(0)) % 2147483647, 0);
    return `var(--cor-avatar-${(valor % 5) + 1})`;
  });
}
