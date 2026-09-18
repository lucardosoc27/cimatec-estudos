import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ROTULO_MODALIDADE } from '../../models/disponibilidade';
import { PRAZO_RESPOSTA_HORAS, Pedido, ROTULO_STATUS, podeSerCancelado } from '../../models/pedido';
import { PedidoEncerradoError, PedidosService } from '../../services/pedidos.service';
import { EstadoTela } from '../../shared/estado-tela';

@Component({
  selector: 'app-pedido-detalhe',
  imports: [DatePipe, RouterLink],
  templateUrl: './pedido-detalhe.html',
  styleUrl: './pedido-detalhe.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoDetalhe {
  private readonly pedidosService = inject(PedidosService);
  private readonly rota = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  private readonly pedidoId: string;
  /** Verdadeiro só na navegação que vem do envio na tela 4. Não muda enquanto a tela está aberta. */
  private readonly recemEnviado: boolean;

  protected readonly estado = signal<EstadoTela>('carregando');
  protected readonly pedido = signal<Pedido | null>(null);

  // Estado do cancelamento, separado do carregamento: erro ao cancelar não pode apagar o pedido da tela.
  protected readonly confirmando = signal(false);
  /** Segunda etapa do cancelamento de sessão aceita: o aluno marca que sabe que o horário estava reservado. */
  protected readonly cienteDaReserva = signal(false);
  protected readonly cancelando = signal(false);
  protected readonly erroCancelamento = signal<'ciencia' | 'falha' | null>(null);
  /** O pedido já estava encerrado quando o aluno tentou cancelar: a tela mostra o status atual e explica. */
  protected readonly cancelamentoNaoAconteceu = signal(false);

  // viewChild é a versão em signal do @ViewChild: devolve o elemento marcado com #nome no template,
  // ou undefined enquanto ele não está no DOM (os três ficam dentro de @if).
  private readonly botaoCancelar = viewChild<ElementRef<HTMLElement>>('botaoCancelar');
  private readonly tituloConfirmacao = viewChild<ElementRef<HTMLElement>>('tituloConfirmacao');
  private readonly statusPedido = viewChild<ElementRef<HTMLElement>>('statusPedido');

  protected readonly rotuloStatus = ROTULO_STATUS;
  protected readonly rotuloModalidade = ROTULO_MODALIDADE;
  protected readonly prazoRespostaHoras = PRAZO_RESPOSTA_HORAS;

  /** "Pedido enviado" só logo após o envio e enquanto ainda aguarda; depois de cancelar vira "Seu pedido". */
  protected readonly titulo = computed(() =>
    this.recemEnviado && this.pedido()?.status === 'aguardando' ? 'Pedido enviado' : 'Seu pedido',
  );

  protected readonly podeCancelar = computed(() => {
    const status = this.pedido()?.status;
    return status !== undefined && podeSerCancelado(status);
  });

  constructor() {
    // Snapshot basta: a tela abre por navegação e nunca troca de pedido sem sair. Compare com mentores.ts.
    this.pedidoId = this.rota.snapshot.paramMap.get('id') ?? '';
    // `history.state` é o objeto que a tela 4 passou em `navigate(..., { state })`. Fica no histórico
    // do navegador, fora da URL, mas o navegador o mantém no F5. Por isso a bandeira é apagada logo
    // após a leitura: o título "Pedido enviado" aparece uma vez, e recarregar volta a "Seu pedido".
    this.recemEnviado = history.state?.recemEnviado === true;
    if (this.recemEnviado) {
      history.replaceState({ ...history.state, recemEnviado: false }, '');
    }
    this.carregar();
  }

  protected carregar(): void {
    this.estado.set('carregando');
    // O Observable do HttpClient completa após a resposta: não precisa de unsubscribe.
    this.pedidosService.buscarPorId(this.pedidoId).subscribe({
      next: (pedido) => {
        if (!pedido) {
          this.estado.set('vazio');
          return;
        }
        this.pedido.set(pedido);
        this.estado.set('sucesso');
      },
      error: () => this.estado.set('erro'),
    });
  }

  protected abrirConfirmacao(): void {
    this.confirmando.set(true);
    this.erroCancelamento.set(null);
    this.cancelamentoNaoAconteceu.set(false);
    this.focarAposRender(this.tituloConfirmacao);
  }

  protected fecharConfirmacao(): void {
    if (this.cancelando()) {
      // Requisição em voo: fechar agora deixaria o resultado chegar numa tela sem a confirmação aberta.
      return;
    }
    this.confirmando.set(false);
    this.cienteDaReserva.set(false);
    this.erroCancelamento.set(null);
    // Foco volta para onde o aluno estava: o botão que abriu a confirmação.
    this.focarAposRender(this.botaoCancelar);
  }

  protected alternarCiencia(evento: Event): void {
    this.cienteDaReserva.set((evento.target as HTMLInputElement).checked);
    if (this.erroCancelamento() === 'ciencia') {
      this.erroCancelamento.set(null);
    }
  }

  protected confirmarCancelamento(): void {
    const pedido = this.pedido();
    if (!pedido || this.cancelando()) {
      return;
    }
    if (pedido.status === 'aceito' && !this.cienteDaReserva()) {
      // Segunda etapa não cumprida: avisa em texto, sem desabilitar o botão (botão desabilitado some do teclado).
      this.erroCancelamento.set('ciencia');
      return;
    }
    this.cancelando.set(true);
    this.erroCancelamento.set(null);

    this.pedidosService
      .cancelar(pedido.id)
      // Se o aluno sair da tela antes da resposta, cancela a assinatura: nada abaixo roda em componente destruído.
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cancelado) => {
          this.pedido.set(cancelado);
          this.encerrarConfirmacao();
        },
        error: (erro: unknown) => {
          this.cancelando.set(false);
          if (erro instanceof PedidoEncerradoError) {
            // O pedido mudou entre a carga e o clique: mostra o status atual e avisa que nada foi cancelado.
            this.pedido.set(erro.pedidoAtual);
            this.cancelamentoNaoAconteceu.set(true);
            this.encerrarConfirmacao();
          } else {
            // Falhou por outro motivo: a confirmação continua aberta, com a caixa como o aluno deixou.
            this.erroCancelamento.set('falha');
          }
        },
      });
  }

  /** Fecha a confirmação e leva o foco ao status, que é o que mudou. O botão de cancelar não existe mais. */
  private encerrarConfirmacao(): void {
    this.confirmando.set(false);
    this.cienteDaReserva.set(false);
    this.cancelando.set(false);
    this.focarAposRender(this.statusPedido);
  }

  /**
   * O elemento alvo só entra (ou volta) no DOM depois que o Angular renderiza o novo estado dos signals.
   * afterNextRender roda uma vez, logo após essa renderização; o injector diz a qual componente ele pertence.
   */
  private focarAposRender(alvo: () => ElementRef<HTMLElement> | undefined): void {
    afterNextRender(() => alvo()?.nativeElement.focus(), { injector: this.injector });
  }
}
