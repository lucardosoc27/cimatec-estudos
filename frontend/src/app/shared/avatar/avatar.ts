import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="avatar" [style.width.px]="tamanho()" [style.height.px]="tamanho()" [style.font-size.px]="tamanho() * .38">
      @if (foto() && falhou() !== foto()) {
        <img [src]="foto()" [alt]="nome()" (error)="falhou.set(foto())" />
      } @else {
        <span [attr.aria-label]="nome()">{{ inicial() }}</span>
      }
    </span>
  `,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; vertical-align: middle; }
    .avatar { display: grid; place-items: center; overflow: hidden; border-radius: 50%; background: var(--cor-primaria); color: var(--cor-superficie); font-weight: 700; }
    img { width: 100%; height: 100%; object-fit: cover; }
  `,
})
export class Avatar {
  readonly nome = input.required<string>();
  readonly foto = input<string | null | undefined>(null);
  readonly tamanho = input(48);
  protected readonly falhou = signal<string | null | undefined>(undefined);
  protected readonly inicial = computed(() => this.nome().trim().charAt(0).toLocaleUpperCase('pt-BR'));
}
