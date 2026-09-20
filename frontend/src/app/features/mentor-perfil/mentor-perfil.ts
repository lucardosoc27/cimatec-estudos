import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { forkJoin, map, switchMap } from 'rxjs';

import { CriteriosBusca, criteriosValidos, deQueryParams, paramsDeCriterios } from '../../models/busca';
import { HorarioLivre, ROTULO_MODALIDADE } from '../../models/disponibilidade';
import { Materia } from '../../models/materia';
import { Mentor } from '../../models/mentor';
import { PRAZO_RESPOSTA_HORAS, Pedido, ROTULO_STATUS } from '../../models/pedido';
import { MateriasService } from '../../services/materias.service';
import { MentoresService } from '../../services/mentores.service';
import { PedidoDuplicadoError, PedidosService } from '../../services/pedidos.service';
import { EstadoTela } from '../../shared/estado-tela';
import { proximaData } from '../../shared/util/datas';
import { cursoSemestre } from '../../shared/util/formatacao';
import { separarHorarios } from '../../shared/util/recomendacao';

/** Horário do mentor com a próxima data concreta, para a tela mostrar "terça, 22/09". */
interface OpcaoHorario {
  horario: HorarioLivre;
  data: string;
}

/** Lançado na revalidação do envio, quando o horário escolhido saiu da lista de livres. */
class HorarioIndisponivelError extends Error {
  constructor(readonly mentorAtual: Mentor | undefined) {
    super('O horário escolhido não está mais livre.');
  }
}

@Component({
  selector: 'app-mentor-perfil',
  imports: [DatePipe, RouterLink],
  templateUrl: './mentor-perfil.html',
  styleUrl: './mentor-perfil.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorPerfil {
  private readonly mentoresService = inject(MentoresService);
  private readonly materiasService = inject(MateriasService);
  private readonly pedidosService = inject(PedidosService);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly mentorId: string;

  protected readonly estado = signal<EstadoTela>('carregando');
  protected readonly mentor = signal<Mentor | null>(null);
  protected readonly materia = signal<Materia | null>(null);
  protected readonly materias = signal<Materia[]>([]);
  protected readonly criterios = signal<CriteriosBusca | null>(null);
  /** Pedido aguardando resposta com este mentor nesta matéria. Se existir, a tela não deixa pedir de novo. */
  protected readonly pedidoEmAberto = signal<Pedido | null>(null);

  // Estado do formulário de horário, separado do estado de carregamento:
  // erro no envio não pode apagar o perfil já carregado nem o horário escolhido.
  protected readonly horarioId = signal<string | null>(null);
  protected readonly tentouEnviar = signal(false);
  protected readonly enviando = signal(false);
  protected readonly erroEnvio = signal<'horario-indisponivel' | 'conexao' | null>(null);

  protected readonly rotuloModalidade = ROTULO_MODALIDADE;
  protected readonly rotuloStatus = ROTULO_STATUS;
  protected readonly prazoRespostaHoras = PRAZO_RESPOSTA_HORAS;

  /** Os mesmos critérios em forma de query params, para "Voltar" e "Ver outros mentores". */
  protected readonly queryParams = computed<Params>(() => paramsDeCriterios(this.criterios()));

  protected readonly cursoSemestre = cursoSemestre;

  /** Selos do mentor com o nome da matéria no lugar do id. */
  protected readonly selos = computed(() =>
    (this.mentor()?.selos ?? []).map((selo) => ({
      nome: this.materias().find((m) => m.id === selo.materiaId)?.nome ?? selo.materiaId,
      sessoes: selo.sessoesConcluidas,
    })),
  );

  /** Horários do mentor separados e já com a próxima data concreta. Recalculado só quando mentor ou critérios mudam. */
  protected readonly horarios = computed(() => {
    const mentor = this.mentor();
    const criterios = this.criterios();
    if (!mentor || !criterios) {
      return { compativeis: [] as OpcaoHorario[], outros: [] as OpcaoHorario[] };
    }
    const comData = (h: HorarioLivre): OpcaoHorario => ({ horario: h, data: proximaData(h.dia, h.hora) });
    const { compativeis, outros } = separarHorarios(mentor.horariosLivres, criterios);
    return { compativeis: compativeis.map(comData), outros: outros.map(comData) };
  });

  constructor() {
    // Foto da URL (snapshot) basta: esta tela abre por navegação vinda da tela 3 e nunca
    // é reaberta com outro mentor enquanto está na tela. Compare com mentores.ts.
    const id = this.rota.snapshot.paramMap.get('id');
    const criterios = criteriosValidos(deQueryParams(this.rota.snapshot.queryParamMap));
    if (!id || !criterios) {
      // Sem matéria e turno não dá para destacar horários nem montar o pedido: a tela 2 explica o que falta.
      this.router.navigate(['/pedir-ajuda'], { queryParams: this.rota.snapshot.queryParams, replaceUrl: true });
      this.mentorId = '';
      return;
    }
    this.mentorId = id;
    this.criterios.set(criterios);
    this.carregar();
  }

  protected carregar(): void {
    const criterios = this.criterios();
    if (!criterios) {
      return;
    }
    this.estado.set('carregando');
    // forkJoin: as três requisições em paralelo, uma única resposta com as três. Se uma falhar, cai no `error`.
    // Todas completam sozinhas (HttpClient), então não precisa de unsubscribe.
    forkJoin({
      mentor: this.mentoresService.buscarPorId(this.mentorId),
      materias: this.materiasService.listar(),
      emAberto: this.pedidosService.buscarEmAberto(this.mentorId, criterios.materiaId),
    }).subscribe({
      next: ({ mentor, materias, emAberto }) => {
        const materia = materias.find((m) => m.id === criterios.materiaId);
        this.materias.set(materias);
        if (!mentor || !materia || !mentor.materias.includes(materia.id)) {
          // Mentor inexistente, não verificado ou que não ensina esta matéria: para o aluno é tudo "não encontrado".
          this.estado.set('vazio');
          return;
        }
        this.mentor.set(mentor);
        this.materia.set(materia);
        this.pedidoEmAberto.set(emAberto ?? null);
        this.estado.set('sucesso');
      },
      error: () => this.estado.set('erro'),
    });
  }

  protected escolherHorario(id: string): void {
    this.horarioId.set(id);
    this.erroEnvio.set(null);
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.tentouEnviar.set(true);
    const mentor = this.mentor();
    const materia = this.materia();
    const horarioId = this.horarioId();
    // A opção que o aluno viu na tela, com a data que ele leu. O pedido leva essa data, não uma recalculada.
    const escolhida = [...this.horarios().compativeis, ...this.horarios().outros].find((o) => o.horario.id === horarioId);
    if (!mentor || !materia || !escolhida || this.enviando()) {
      return;
    }
    this.enviando.set(true);
    this.erroEnvio.set(null);

    this.mentoresService
      .buscarPorId(mentor.id)
      .pipe(
        // Revalida no envio: busca o mentor de novo e confere se o horário continua livre.
        // No mock ele sempre continua; na fase 2 é o servidor que decide, e esta checagem vira só UX.
        map((atual) => {
          const horario = atual?.horariosLivres.find((h) => h.id === escolhida.horario.id);
          if (!horario) {
            throw new HorarioIndisponivelError(atual);
          }
          return horario;
        }),
        // switchMap encadeia: o horário validado vira a entrada da segunda chamada, que cria o pedido.
        // Sem ele, seria um subscribe dentro do outro.
        switchMap((horario) =>
          this.pedidosService.criar({
            mentorId: mentor.id,
            mentorNome: mentor.nome,
            materiaId: materia.id,
            materiaNome: materia.nome,
            data: escolhida.data,
            hora: horario.hora,
            modalidade: horario.modalidade,
          }),
        ),
        // Se o aluno sair da tela antes da resposta, cancela: senão o navigate abaixo o puxaria de volta.
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        // `state` vai para o histórico do navegador, não para a URL: a tela 5 lê em `history.state`
        // e mostra "Pedido enviado". Ela mesma apaga a bandeira depois de ler, senão o F5 repetiria o título.
        next: (pedido) => this.router.navigate(['/pedidos', pedido.id], { state: { recemEnviado: true } }),
        error: (erro: unknown) => {
          this.enviando.set(false);
          if (erro instanceof PedidoDuplicadoError) {
            // Mesmo aviso do carregamento: a tela esconde o formulário e aponta para o pedido existente.
            this.pedidoEmAberto.set(erro.pedidoExistente);
          } else if (erro instanceof HorarioIndisponivelError) {
            if (!erro.mentorAtual) {
              // Mentor sumiu entre a carga e o envio (removido ou desverificado): mesmo "não encontrado" da carga.
              this.estado.set('vazio');
              return;
            }
            this.mentor.set(erro.mentorAtual);
            this.horarioId.set(null);
            // Zera a tentativa para não empilhar "escolha um horário" com este aviso: um alerta por vez.
            this.tentouEnviar.set(false);
            this.erroEnvio.set('horario-indisponivel');
          } else {
            this.erroEnvio.set('conexao');
          }
        },
      });
  }
}
