import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { CURSOS } from '../../models/curso';
import { Materia } from '../../models/materia';
import { MateriasService } from '../../services/materias.service';
import { Avatar } from '../../shared/avatar/avatar';

interface MentorPublico {
  id: string;
  nome: string;
  curso: string;
  foto: string | null;
  descricao: string;
  materias?: string[];
}

type Estado = 'carregando' | 'sucesso' | 'erro';

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
  readonly mentoresVisiveis = computed(() => {
    const mentores = this.mentores();
    return Array.from({ length: Math.min(3, mentores.length) }, (_, posicao) =>
      mentores[(this.indice() + posicao) % mentores.length],
    );
  });
  readonly filtros = computed(() => ({
    materia: this.materiaSelecionada() || null,
    turnos: this.turno() || null,
  }));

  constructor() {
    this.carregarMaterias();
    this.carregarVitrine();
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

  mover(direcao: number): void {
    const quantidade = this.mentores().length;
    if (quantidade > 1) this.indice.update(indice => (indice + direcao + quantidade) % quantidade);
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
