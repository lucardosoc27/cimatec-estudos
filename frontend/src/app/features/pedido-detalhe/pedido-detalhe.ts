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
import { Avatar } from '../../shared/avatar/avatar';
import { DiaEDataPipe } from '../../shared/dia-e-data.pipe';
import { EstadoTela } from '../../shared/estado-tela';
import { Icone, NomeIcone } from '../../shared/icone/icone';
import { Status } from '../../shared/status/status';

/** Uma etapa da linha "Enviado → Aguardando resposta → Aceito". O estado decide a cor e o ícone. */
interface Etapa {
  rotulo: string;
  estado: 'feita' | 'atual' | 'pendente' | 'aceita' | 'encerrada';
  icone: NomeIcone;
}

/** O que o leitor de tela ouve depois do rótulo: a cor e o ícone da etapa não chegam a quem não vê. */
const DESCRICAO_ETAPA: Record<Etapa['estado'], string> = {
  feita: 'concluída', atual: 'etapa atual', pendente: 'ainda não aconteceu', aceita: 'concluída', encerrada: 'pedido encerrado',
};

@Component({
  selector: 'app-pedido-detalhe',
  imports: [DatePipe, RouterLink, Avatar, DiaEDataPipe, Icone, Status],
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
  /** Segunda etapa do cancelamento de sessão aceita: o aluno marca que sabe que o horário estava reservado. */
  protected readonly cienteDaReserva = signal(false);
  protected readonly cancelando = signal(false);
  protected readonly erroCancelamento = signal<'ciencia' | 'falha' | null>(null);
  /** O pedido já estava encerrado quando o aluno tentou cancelar: a tela mostra o status atual e explica. */
  protected readonly cancelamentoNaoAconteceu = signal(false);

  /** Resultado do "Copiar e-mail", anunciado em texto ao lado do botão. */
  protected readonly copia = signal<'copiado' | 'falhou' | null>(null);

  // viewChild é a versão em signal do @ViewChild: devolve o elemento marcado com #nome no template,
  // ou undefined enquanto ele não está no DOM (todos ficam dentro de @if).
  private readonly botaoCancelar = viewChild<ElementRef<HTMLElement>>('botaoCancelar');
  private readonly tituloConfirmacao = viewChild<ElementRef<HTMLElement>>('tituloConfirmacao');
  private readonly statusPedido = viewChild<ElementRef<HTMLElement>>('statusPedido');
  /** A janela de confirmação é um <dialog> nativo: showModal() prende o foco nela e o Esc fecha. */
  private readonly janela = viewChild<ElementRef<HTMLDialogElement>>('janela');
  protected readonly descricaoEtapa = DESCRICAO_ETAPA;

  protected readonly rotuloStatus = ROTULO_STATUS;
  protected readonly rotuloModalidade = ROTULO_MODALIDADE;
  protected readonly prazoRespostaHoras = PRAZO_RESPOSTA_HORAS;

  /**
   * "Pedido enviado para <nome>" só logo após o envio e enquanto ainda aguarda; nas outras vezes,
   * "Pedido para <nome>". Sem artigo ("para a Ana"): o sistema não sabe o gênero de quem ensina.
   */
  protected readonly titulo = computed(() => {
    const pedido = this.pedido();
    if (!pedido) return 'Seu pedido';
    return `${this.recemEnviado && pedido.status === 'aguardando' ? 'Pedido enviado' : 'Pedido'} para ${pedido.mentorNome}`;
  });

  /**
   * Etapas do pedido. Aguardando: a do meio é a atual. Aceito: as três concluídas. Expirado, recusado
   * ou cancelado: a espera parou no meio (sem destaque) e a última etapa diz como o pedido terminou.
   */
  protected readonly etapas = computed<Etapa[]>(() => {
    const status = this.pedido()?.status;
    if (!status) return [];
    const enviado: Etapa = { rotulo: 'Enviado', estado: 'feita', icone: 'verificado' };
    if (status === 'aguardando') {
      return [enviado, { rotulo: 'Aguardando resposta', estado: 'atual', icone: 'relogio' }, { rotulo: 'Aceito', estado: 'pendente', icone: 'verificado' }];
    }
    if (status === 'aceito') {
      return [enviado, { rotulo: 'Aguardando resposta', estado: 'feita', icone: 'verificado' }, { rotulo: 'Aceito', estado: 'aceita', icone: 'verificado' }];
    }
    return [enviado, { rotulo: 'Aguardando resposta', estado: 'pendente', icone: 'relogio' }, { rotulo: ROTULO_STATUS[status], estado: 'encerrada', icone: 'fechar-circulo' }];
  });

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
    this.cienteDaReserva.set(false);
    this.erroCancelamento.set(null);
    this.cancelamentoNaoAconteceu.set(false);
    this.janela()?.nativeElement.showModal();
    // O foco começa no título da janela, e não no primeiro botão, que é o "Sim, cancelar".
    this.tituloConfirmacao()?.nativeElement.focus();
  }

  protected fecharConfirmacao(): void {
    if (this.cancelando()) {
      // Requisição em voo: fechar agora deixaria o resultado chegar numa tela sem a confirmação aberta.
      return;
    }
    this.janela()?.nativeElement.close();
  }

  /**
   * Roda sempre que a janela fecha, pelo botão ou pelo Esc. O foco volta para onde o aluno estava: o
   * botão que abriu a confirmação. Se o pedido foi cancelado, esse botão não existe mais, e o foco vai
   * para o status, que é o que mudou.
   */
  protected aoFecharJanela(): void {
    this.cienteDaReserva.set(false);
    this.erroCancelamento.set(null);
    afterNextRender(() => (this.botaoCancelar() ?? this.statusPedido())?.nativeElement.focus(), { injector: this.injector });
  }

  /** Copia o e-mail do mentor. Pode falhar (página sem HTTPS, permissão negada): aí a tela avisa em texto. */
  protected copiarEmail(email: string): void {
    this.copia.set(null);
    if (!navigator.clipboard) {
      this.copia.set('falhou');
      return;
    }
    navigator.clipboard.writeText(email).then(() => this.copia.set('copiado'), () => this.copia.set('falhou'));
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

  /**
   * Fecha a janela depois da resposta do servidor. O foco vai para o status em aoFecharJanela, porque o
   * botão de cancelar sumiu. afterNextRender (lá) espera o Angular redesenhar o pedido novo antes de focar.
   */
  private encerrarConfirmacao(): void {
    this.cancelando.set(false);
    this.janela()?.nativeElement.close();
  }
}
