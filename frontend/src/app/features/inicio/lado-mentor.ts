import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ROTULO_MODALIDADE } from '../../models/disponibilidade';
import { Pedido, ROTULO_STATUS } from '../../models/pedido';
import { AuthService } from '../../services/auth.service';
import { HorarioOcupadoError, PedidoEncerradoError, PedidosService } from '../../services/pedidos.service';
import { Avatar } from '../../shared/avatar/avatar';
import { DiaEDataPipe } from '../../shared/dia-e-data.pipe';
import { EstadoTela } from '../../shared/estado-tela';
import { Status } from '../../shared/status/status';

/**
 * As duas seções do Início que só quem é mentor vê: "Pedidos que você recebeu" e "Suas próximas
 * sessões". Aceitar e recusar são pedidos ao servidor; quem revalida o horário e decide é ele.
 */
@Component({
  selector: 'app-lado-mentor',
  imports: [DatePipe, Avatar, DiaEDataPipe, Status],
  templateUrl: './lado-mentor.html',
  styleUrl: './lado-mentor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LadoMentor {
  private readonly pedidosService = inject(PedidosService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  /** A própria mentora: o segundo avatar do par "Sessão marcada". */
  protected readonly eu = inject(AuthService).usuario;
  protected readonly rotuloModalidade = ROTULO_MODALIDADE;

  protected readonly estado = signal<EstadoTela>('carregando');
  private readonly recebidos = signal<Pedido[]>([]);

  // As duas seções saem da mesma lista. Trocar o status de um pedido nela (aceito) já o tira de
  // uma seção e o põe na outra: computed recalcula sozinho, sem mover nada à mão.
  protected readonly pendentes = computed(() => this.recebidos().filter((p) => p.status === 'aguardando'));
  protected readonly sessoes = computed(() =>
    this.recebidos()
      .filter((p) => p.status === 'aceito')
      .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)),
  );

  /** Pedido com requisição em voo: os botões dele ficam ocupados. */
  protected readonly respondendo = signal<string | null>(null);
  /** Pedido cuja recusa está esperando o "Sim, recusar". */
  protected readonly confirmandoRecusa = signal<string | null>(null);
  /** Erro de um cartão, que continua como estava: nada do pedido se perde. */
  protected readonly erro = signal<{ id: string; mensagem: string } | null>(null);
  /** Aceitos nesta visita: mostram o par de avatares e "Sessão marcada". A animação vem depois. */
  protected readonly recemAceitos = signal<ReadonlySet<string>>(new Set());
  /** Texto anunciado pelo leitor de tela depois de aceitar ou recusar. */
  protected readonly aviso = signal('');

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.estado.set('carregando');
    this.pedidosService.listarRecebidos().subscribe({
      next: (lista) => {
        this.recebidos.set(lista);
        this.estado.set('sucesso');
      },
      error: () => this.estado.set('erro'),
    });
  }

  protected aceitar(pedido: Pedido): void {
    if (this.respondendo()) return;
    this.respondendo.set(pedido.id);
    this.erro.set(null);
    this.pedidosService
      .aceitar(pedido.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (aceito) => {
          this.respondendo.set(null);
          this.trocar(aceito);
          this.recemAceitos.update((ids) => new Set(ids).add(aceito.id));
          this.aviso.set(`Sessão marcada com ${aceito.alunoNome}.`);
          // O cartão mudou de seção: o foco vai atrás dele, senão cairia no começo da página.
          this.focarAposRender('sessao-' + aceito.id);
        },
        error: (erro: unknown) => {
          this.respondendo.set(null);
          if (erro instanceof HorarioOcupadoError) {
            this.erro.set({ id: pedido.id, mensagem: 'Você já tem uma sessão aceita nesse mesmo dia e horário. O pedido continua aqui: recuse ou decida depois.' });
          } else if (erro instanceof PedidoEncerradoError) {
            this.encerrado(erro.pedidoAtual);
          } else {
            this.erro.set({ id: pedido.id, mensagem: 'Não foi possível aceitar agora. Tente de novo.' });
          }
        },
      });
  }

  protected pedirConfirmacaoRecusa(pedido: Pedido): void {
    this.confirmandoRecusa.set(pedido.id);
    this.erro.set(null);
    this.focarAposRender('confirmar-' + pedido.id);
  }

  protected voltarDaRecusa(pedido: Pedido): void {
    if (this.respondendo()) return;
    this.confirmandoRecusa.set(null);
    this.erro.set(null);
    // Foco volta ao botão que abriu a confirmação.
    this.focarAposRender('recusar-' + pedido.id);
  }

  protected recusar(pedido: Pedido): void {
    if (this.respondendo()) return;
    this.respondendo.set(pedido.id);
    this.erro.set(null);
    this.pedidosService
      .recusar(pedido.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (recusado) => {
          this.respondendo.set(null);
          this.confirmandoRecusa.set(null);
          this.trocar(recusado);
          this.aviso.set(`Pedido de ${recusado.alunoNome} recusado.`);
          this.focarAposRender('titulo-recebidos');
        },
        error: (erro: unknown) => {
          this.respondendo.set(null);
          if (erro instanceof PedidoEncerradoError) {
            this.confirmandoRecusa.set(null);
            this.encerrado(erro.pedidoAtual);
          } else {
            this.erro.set({ id: pedido.id, mensagem: 'Não foi possível recusar agora. Tente de novo.' });
          }
        },
      });
  }

  /** O pedido mudou antes do clique (expirou, o aluno cancelou): sai da lista e a tela explica. */
  private encerrado(atual: Pedido): void {
    this.trocar(atual);
    this.aviso.set(`O pedido de ${atual.alunoNome} já estava encerrado: ${ROTULO_STATUS[atual.status]}.`);
    this.focarAposRender('titulo-recebidos');
  }

  private trocar(novo: Pedido): void {
    this.recebidos.update((lista) => lista.map((p) => (p.id === novo.id ? novo : p)));
  }

  /** O alvo só existe no DOM depois que o Angular renderiza o novo estado dos signals. */
  private focarAposRender(id: string): void {
    afterNextRender(() => document.getElementById(id)?.focus(), { injector: this.injector });
  }
}
