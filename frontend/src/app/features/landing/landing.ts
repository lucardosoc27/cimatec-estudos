import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { CURSOS } from '../../models/curso';
import { Materia } from '../../models/materia';
import { MateriasService } from '../../services/materias.service';
import { Avatar } from '../../shared/avatar/avatar';
import { Icone, NomeIcone } from '../../shared/icone/icone';
import { Perguntas } from './perguntas/perguntas';
import { Vitrine } from './vitrine/vitrine';

interface Depoimento {
  nome: string;
  curso: string;
  foto: string;
  texto: string;
  /** Exemplo contado por quem ajuda, e não por quem pediu ajuda: ganha a pílula "Mentor voluntário". */
  mentor?: boolean;
}

type Estado = 'carregando' | 'sucesso' | 'erro';

/** Ícone de cada curso nos chips de matéria (a matéria herda o ícone do curso dela). */
const ICONE_DO_CURSO: Record<string, NomeIcone> = {
  'Desenvolvimento de Sistemas': 'codigo',
  'Redes de Computadores': 'rede',
  'Biotecnologia': 'frasco',
  'Química': 'bequer',
  'Petroquímica': 'gota',
  'Eletromecânica': 'raio',
  'Edificações': 'predio',
  'Mecânica': 'engrenagem',
  'Multimídia': 'video',
};

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Avatar, Icone, Vitrine, Perguntas],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  private readonly materiasService = inject(MateriasService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cursos = CURSOS;
  readonly curso = signal(CURSOS[0].nome);
  readonly materiaSelecionada = signal('');
  readonly turno = signal('');
  readonly materias = signal<Materia[]>([]);
  readonly estadoMaterias = signal<Estado>('carregando');
  readonly materiasDoCurso = computed(() => this.materias().filter(materia => materia.curso === this.curso()));
  readonly iconeDoCurso = computed<NomeIcone>(() => ICONE_DO_CURSO[this.curso()] ?? 'livro');
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
      nome: 'Cibele', curso: 'Desenvolvimento de Sistemas', foto: 'assets/ilustracoes/depoimento-cibele.png', mentor: true,
      texto: 'Comecei ajudando colegas em Lógica de Programação só para revisar o que eu já sabia. Hoje é uma das partes do curso que eu mais gosto de fazer.',
    },
  ];

  constructor() {
    this.carregarMaterias();
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

  primeiroNome(nome: string): string {
    return nome.trim().split(/\s+/)[0] || 'Mentor';
  }
}
