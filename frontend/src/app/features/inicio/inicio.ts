import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ROTULO_MODALIDADE } from '../../models/disponibilidade';
import { Pedido } from '../../models/pedido';
import { PedidosService } from '../../services/pedidos.service';
import { EstadoTela } from '../../shared/estado-tela';
import { Status } from '../../shared/status/status';

@Component({
  selector: 'app-inicio',
  imports: [DatePipe, RouterLink, Status],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inicio {
  private readonly pedidosService = inject(PedidosService);

  protected readonly estado = signal<EstadoTela>('carregando');
  protected readonly pedidos = signal<Pedido[]>([]);

  protected readonly rotuloModalidade = ROTULO_MODALIDADE;

  constructor() {
    this.carregar();
  }

  /** Público para o botão "Tentar de novo" do estado de erro. */
  protected carregar(): void {
    this.estado.set('carregando');
    // O Observable do HttpClient completa após a resposta: não precisa de unsubscribe.
    this.pedidosService.listar().subscribe({
      next: (lista) => {
        this.pedidos.set(lista);
        this.estado.set(lista.length === 0 ? 'vazio' : 'sucesso');
      },
      error: () => this.estado.set('erro'),
    });
  }
}
