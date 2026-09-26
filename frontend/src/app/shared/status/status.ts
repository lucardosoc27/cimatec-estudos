import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ROTULO_STATUS, StatusPedido } from '../../models/pedido';

@Component({
  selector: 'app-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="status" [attr.data-status]="status()"><span aria-hidden="true">{{ icone() }}</span> {{ rotulo() }}</span>`,
})
export class Status {
  readonly status = input.required<StatusPedido>();
  readonly recebido = input(false);
  protected readonly rotulo = computed(() => this.recebido() && this.status() === 'aguardando' ? 'Aguarda sua resposta' : ROTULO_STATUS[this.status()]);
  protected readonly icone = computed(() => this.status() === 'aceito' ? '✓' : this.status() === 'aguardando' ? '◷' : '–');
}
