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
    <span class="avatar" [class.avatar--neutro]="tom() === 'neutro'" [style.width.px]="tamanho()" [style.height.px]="tamanho()" [style.font-size.px]="tamanho() * .38">
      @if (foto() && falhou() !== foto()) {
        <img [src]="foto()" alt="" (error)="falhou.set(foto())" />
      } @else {
        <span>{{ inicial() }}</span>
      }
    </span>
  `,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; vertical-align: middle; }
    .avatar { display: grid; place-items: center; overflow: hidden; border-radius: 50%; background: var(--cor-primaria); color: var(--cor-superficie); font-weight: 700; }
    /* Neutro: mentor da vitrine pública que ainda não tem retrato. É um espaço reservado
       ("a foto substitui depois sem mudar o layout"), não a identidade de quem está logado
       — por isso um tom cinza, à parte do azul da marca. Contraste do texto: 7,53:1. */
    .avatar--neutro { background: var(--cor-neutro); }
    img { width: 100%; height: 100%; object-fit: cover; }
  `,
})
export class Avatar {
  readonly nome = input.required<string>();
  readonly foto = input<string | null | undefined>(null);
  readonly tamanho = input(48);
  readonly tom = input<'padrao' | 'neutro'>('padrao');
  protected readonly falhou = signal<string | null | undefined>(undefined);
  protected readonly inicial = computed(() => this.nome().trim().charAt(0).toLocaleUpperCase('pt-BR'));
}
