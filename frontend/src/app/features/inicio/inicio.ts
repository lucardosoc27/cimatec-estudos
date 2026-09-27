import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

import { ROTULO_MODALIDADE } from '../../models/disponibilidade';
import { Pedido } from '../../models/pedido';
import { AuthService } from '../../services/auth.service';
import { PedidosService } from '../../services/pedidos.service';
import { Avatar } from '../../shared/avatar/avatar';
import { DiaEDataPipe } from '../../shared/dia-e-data.pipe';
import { EstadoTela } from '../../shared/estado-tela';
import { LadoMentor } from './lado-mentor';
import { Status } from '../../shared/status/status';

@Component({
  selector: 'app-inicio',
  imports: [DatePipe, RouterLink, Avatar, DiaEDataPipe, LadoMentor, Status],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inicio {
  private readonly pedidosService = inject(PedidosService);
  private readonly auth = inject(AuthService);

  // O guard já carregou a sessão; computed recalcula se o nome mudar em Minha conta.
  protected readonly primeiroNome = computed(() => this.auth.usuario()?.nome.trim().split(/\s+/)[0] ?? '');
  protected readonly ehMentor = computed(() => this.auth.usuario()?.papeis.includes('mentor') ?? false);

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
