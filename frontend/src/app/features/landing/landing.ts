import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { CURSOS } from '../../models/curso';
import { Materia } from '../../models/materia';
import { MateriasService } from '../../services/materias.service';
import { Avatar } from '../../shared/avatar/avatar';

/**
 * O que a vitrine pública recebe de cada mentor. A foto vem null para quem não deu os dois
 * consentimentos (foto e vitrine), e aí o avatar mostra a inicial (DECISOES.md, 2026-09-28).
 */
interface MentorPublico {
  id: string;
  nome: string;
  foto: string | null;
  curso: string;
  descricao: string;
  materias?: string[];
}

interface Depoimento {
  nome: string;
  curso: string;
  foto: string;
  texto: string;
}

type Estado = 'carregando' | 'sucesso' | 'erro';

/** Tempo que cada grupo de mentores fica na tela antes de o carrossel avançar sozinho. */
const INTERVALO_DO_CARROSSEL_MS = 6000;

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Avatar],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  private readonly http = inject(HttpClient);
  private readonly materiasService = inject(MateriasService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cursos = CURSOS;
  readonly curso = signal(CURSOS[0].nome);
  readonly materiaSelecionada = signal('');
  readonly turno = signal('');
  readonly materias = signal<Materia[]>([]);
  readonly estadoMaterias = signal<Estado>('carregando');
  readonly materiasDoCurso = computed(() => this.materias().filter(materia => materia.curso === this.curso()));
  readonly mentores = signal<MentorPublico[]>([]);
  readonly estadoVitrine = signal<Estado>('carregando');
  readonly indice = signal(0);
  /**
   * Os mentores na tela agora. A chave junta o índice ao id: a cada troca os cartões são criados
   * de novo, e é a criação que dispara a transição de entrada no CSS (landing.scss). Com só o id,
   * o Angular reaproveitaria os cartões e a troca seria um corte seco.
   */
  readonly mentoresVisiveis = computed(() => {
    const mentores = this.mentores();
    return Array.from({ length: Math.min(3, mentores.length) }, (_, posicao) => {
      const mentor = mentores[(this.indice() + posicao) % mentores.length];
      return { ...mentor, chave: `${this.indice()}-${mentor.id}` };
    });
  });

  // Avanço automático. Anda sozinho só quando nada disso segura: a pessoa apertou Pausar (ou pediu
  // menos movimento no sistema), o ponteiro está sobre a vitrine, ou o foco está dentro dela.
  /** Começa pausado para quem pediu menos movimento (prefers-reduced-motion). */
  readonly pausadoPelaPessoa = signal(matchMedia('(prefers-reduced-motion: reduce)').matches);
  readonly ponteiroSobre = signal(false);
  readonly focoDentro = signal(false);
  readonly avancando = computed(() =>
    !this.pausadoPelaPessoa() && !this.ponteiroSobre() && !this.focoDentro()
    && this.estadoVitrine() === 'sucesso' && this.mentores().length > 1);
  /** 1 = para a frente, -1 = para trás: decide de que lado os cartões entram. */
  readonly direcao = signal<1 | -1>(1);
  /** Falso até a primeira troca: na carga da página os cartões aparecem sem animação. */
  readonly jaMoveu = signal(false);
  private ultimoAvanco = Date.now();
  readonly filtros = computed(() => ({
    materia: this.materiaSelecionada() || null,
    turnos: this.turno() || null,
  }));

  /** Exemplos ilustrativos escritos pela equipe, não depoimentos reais. Fixos, sem estado de carregamento. */
  readonly depoimentos: readonly Depoimento[] = [
    {
      nome: 'Rodrigo', curso: 'Edificações', foto: 'assets/ilustracoes/rodrigo.png',
      texto: 'Travei em Fundamentos de Topografia e quase desisti antes da prova. Uma colega do curso me mostrou como organizar os dados numa sessão só, e o resto fez sentido.',
    },
    {
      nome: 'Carolina', curso: 'Redes de Computadores', foto: 'assets/ilustracoes/depoimento-carolina.png',
      texto: 'Configuração de Servidores de Rede parecia impossível sozinha. Depois de uma sessão com uma colega mais experiente, entendi a lógica e terminei o laboratório.',
    },
    {
      nome: 'Cibele', curso: 'Desenvolvimento de Sistemas', foto: 'assets/ilustracoes/depoimento-cibele.png',
      texto: 'Comecei ajudando colegas em Lógica de Programação só para revisar o que eu já sabia. Hoje é uma das partes do curso que eu mais gosto de fazer.',
    },
  ];

  constructor() {
    this.carregarMaterias();
    this.carregarVitrine();
    // Um relógio de meio segundo, e não um setInterval de 6 s: assim o tempo só corre enquanto o
    // carrossel pode andar. Parado (pausa, ponteiro, foco, aba escondida), o prazo recomeça, e
    // ele não pula de cartão no instante em que o ponteiro sai.
    const relogio = setInterval(() => {
      if (!this.avancando() || document.hidden) {
        this.ultimoAvanco = Date.now();
        return;
      }
      if (Date.now() - this.ultimoAvanco >= INTERVALO_DO_CARROSSEL_MS) this.mover(1);
    }, 500);
    this.destroyRef.onDestroy(() => clearInterval(relogio));
  }

  selecionarCurso(nome: string): void {
    this.curso.set(nome);
    this.materiaSelecionada.set('');
  }

  selecionarMateria(evento: Event): void {
    this.materiaSelecionada.set((evento.target as HTMLSelectElement).value);
  }

  selecionarTurno(evento: Event): void {
    this.turno.set((evento.target as HTMLSelectElement).value);
  }

  carregarMaterias(): void {
    this.estadoMaterias.set('carregando');
    this.materiasService.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: materias => {
        this.materias.set(materias);
        this.estadoMaterias.set('sucesso');
      },
      error: () => this.estadoMaterias.set('erro'),
    });
  }

  carregarVitrine(): void {
    this.estadoVitrine.set('carregando');
    // A API filtra o consentimento público e já omite os dados privados do mentor.
    this.http.get<MentorPublico[]>('/api/vitrine').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: mentores => {
        this.mentores.set(mentores);
        this.indice.set(0);
        this.estadoVitrine.set('sucesso');
      },
      error: () => this.estadoVitrine.set('erro'),
    });
  }

  mover(direcao: 1 | -1): void {
    const quantidade = this.mentores().length;
    if (quantidade < 2) return;
    this.direcao.set(direcao);
    this.jaMoveu.set(true);
    this.indice.update(indice => (indice + direcao + quantidade) % quantidade);
    this.ultimoAvanco = Date.now(); // troca manual também recomeça a contagem
  }

  alternarPausa(): void {
    this.pausadoPelaPessoa.update(pausado => !pausado);
  }

  /** O foco saiu da vitrine de verdade, e não só passou de um botão para outro dentro dela. */
  focoSaiu(evento: FocusEvent): void {
    const vitrine = evento.currentTarget as HTMLElement;
    if (!vitrine.contains(evento.relatedTarget as Node | null)) this.focoDentro.set(false);
  }

  teclaCarrossel(evento: KeyboardEvent): void {
    if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return;
    evento.preventDefault();
    this.mover(evento.key === 'ArrowRight' ? 1 : -1);
  }

  primeiroNome(nome: string): string {
    return nome.trim().split(/\s+/)[0] || 'Mentor';
  }
}
