import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, map, switchMap } from 'rxjs';

import { HorarioLivre } from '../../models/disponibilidade';
import { Materia } from '../../models/materia';
import { Mentor, MentorRecomendado } from '../../models/mentor';
import { Pedido } from '../../models/pedido';
import { MateriasService } from '../../services/materias.service';
import { MentoresService } from '../../services/mentores.service';
import { PedidoRascunhoService } from '../../services/pedido-rascunho.service';
import { PedidoDuplicadoError, PedidosService } from '../../services/pedidos.service';
import { Avatar } from '../../shared/avatar/avatar';
import { Icone } from '../../shared/icone/icone';
import { DiaEDataPipe } from '../../shared/dia-e-data.pipe';
import { EstadoTela } from '../../shared/estado-tela';
import { proximaData } from '../../shared/util/datas';
import { descreverHorario, separarHorarios } from '../../shared/util/recomendacao';

interface OpcaoHorario { horario: HorarioLivre; data: string; }
class HorarioIndisponivelError extends Error {}

@Component({
  selector: 'app-mentor-perfil', imports: [RouterLink, Avatar, DiaEDataPipe, Icone],
  templateUrl: './mentor-perfil.html', styleUrl: './mentor-perfil.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentorPerfil {
  private readonly mentoresService = inject(MentoresService);
  private readonly materiasService = inject(MateriasService);
  private readonly pedidosService = inject(PedidosService);
  private readonly rascunhos = inject(PedidoRascunhoService);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mentorId = this.rota.snapshot.paramMap.get('id') ?? '';
  protected readonly estado = signal<EstadoTela>('carregando');
  protected readonly mentor = signal<Mentor | null>(null);
  protected readonly materia = signal<Materia | null>(null);
  protected readonly materias = signal<Materia[]>([]);
  protected readonly pedidoEmAberto = signal<Pedido | null>(null);
  protected readonly recomendado = signal<MentorRecomendado | null>(null);
  protected readonly formulario = this.rascunhos.rascunho;
  protected readonly horarioId = computed(() => this.formulario()?.horarioId ?? null);
  protected readonly ocupados = signal<string[]>([]);
  protected readonly tentouEnviar = signal(false);
  protected readonly enviando = signal(false);
  protected readonly erroEnvio = signal<'horario-indisponivel' | 'conexao' | null>(null);
  protected readonly materiasEnsinadas = computed(() => this.materias().filter(m => this.mentor()?.materias.includes(m.id)));
  protected readonly horarios = computed<OpcaoHorario[]>(() => {
    const mentor = this.mentor();
    const criterios = this.rascunhos.criterios();
    if (!mentor || !criterios) return [];
    return separarHorarios(mentor.horariosLivres, criterios).compativeis.map(horario => ({ horario, data: proximaData(horario.dia, horario.hora) })).sort((a, b) => a.data.localeCompare(b.data) || a.horario.hora.localeCompare(b.horario.hora));
  });
  protected readonly dias = computed(() => [...new Set(this.horarios().map(h => h.data))].map(data => ({ data, horarios: this.horarios().filter(h => h.data === data) })));
  protected readonly etiquetas = computed(() => {
    const item = this.recomendado();
    if (!item) return [];
    const primeiro = item.horariosCompativeis[0];
    const modalidades = new Set(item.horariosCompativeis.map(h => h.modalidade));
    return ['mesma matéria', ...(primeiro ? [descreverHorario(primeiro)] : []), modalidades.size > 1 ? 'presencial ou online' : modalidades.has('online') ? 'online' : 'presencial'];
  });

  constructor() {
    if (!this.mentorId || !this.rascunhos.criterios()) { this.router.navigate(['/pedir-ajuda'], { replaceUrl: true }); return; }
    if (this.formulario()?.mentorId !== this.mentorId) this.rascunhos.atualizar({ mentorId: this.mentorId, horarioId: null });
    this.carregar();
  }

  protected carregar(): void {
    const criterios = this.rascunhos.criterios();
    if (!criterios) return;
    this.estado.set('carregando');
    forkJoin({
      mentor: this.mentoresService.buscarPorId(this.mentorId),
      materias: this.materiasService.listar(),
      emAberto: this.pedidosService.buscarEmAberto(this.mentorId, criterios.materiaId),
      recomendacao: this.mentoresService.recomendar(criterios),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ mentor, materias, emAberto, recomendacao }) => {
        const materia = materias.find(m => m.id === criterios.materiaId);
        if (!mentor || !materia || !mentor.materias.includes(materia.id)) { this.estado.set('vazio'); return; }
        this.mentor.set(mentor);
        this.materia.set(materia);
        this.materias.set(materias);
        this.pedidoEmAberto.set(emAberto ?? null);
        this.recomendado.set(recomendacao?.recomendados.find(r => r.mentor.id === mentor.id) ?? null);
        this.estado.set('sucesso');
      },
      error: () => this.estado.set('erro'),
    });
  }

  protected escolherHorario(id: string): void {
    if (this.ocupados().includes(id)) return;
    this.rascunhos.atualizar({ horarioId: id });
    this.erroEnvio.set(null);
  }

  protected intervalo(hora: string): string {
    const [h, m] = hora.split(':').map(Number);
    const formato = (hh: number) => `${hh}h${m ? String(m).padStart(2, '0') : ''}`;
    return `${formato(h)}–${formato((h + 1) % 24)}`;
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.tentouEnviar.set(true);
    const mentor = this.mentor();
    const materia = this.materia();
    const escolhida = this.horarios().find(o => o.horario.id === this.horarioId());
    if (!mentor || !materia || !escolhida || this.enviando() || this.ocupados().includes(escolhida.horario.id) || this.pedidoEmAberto()) return;
    this.enviando.set(true);
    this.erroEnvio.set(null);
    this.mentoresService.buscarPorId(mentor.id).pipe(
      map(atual => {
        const horario = atual?.horariosLivres.find(h => h.id === escolhida.horario.id);
        if (!horario) throw new HorarioIndisponivelError();
        return horario;
      }),
      switchMap(horario => this.pedidosService.criar({
        mentorId: mentor.id, mentorNome: mentor.nome, mentorFoto: mentor.foto, mentorCurso: mentor.curso,
        materiaId: materia.id, materiaNome: materia.nome, data: escolhida.data, hora: horario.hora,
        horarioId: horario.id, modalidade: horario.modalidade,
        local: horario.modalidade === 'online' ? 'Online' : 'CIMATEC - Orlando Gomes',
        necessidade: this.formulario()?.necessidade ?? undefined,
      })),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: pedido => {
        this.rascunhos.guardarPedido(pedido.id);
        this.router.navigate(['/pedidos', pedido.id]);
      },
      error: (erro: unknown) => {
        this.enviando.set(false);
        if (erro instanceof PedidoDuplicadoError) this.pedidoEmAberto.set(erro.pedidoExistente);
        else if (erro instanceof HorarioIndisponivelError || (erro instanceof Error && erro.name === 'HorarioOcupadoError')) {
          this.ocupados.update(ids => [...ids, escolhida.horario.id]);
          this.rascunhos.atualizar({ horarioId: null });
          this.tentouEnviar.set(false);
          this.erroEnvio.set('horario-indisponivel');
        } else this.erroEnvio.set('conexao');
      },
    });
  }
}
