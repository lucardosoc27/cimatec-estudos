import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { ROTULO_TURNO } from '../../models/disponibilidade';
import { MentorRecomendado, Recomendacao } from '../../models/mentor';
import { MentoresService } from '../../services/mentores.service';
import { PedidoRascunhoService } from '../../services/pedido-rascunho.service';
import { Avatar } from '../../shared/avatar/avatar';
import { Icone } from '../../shared/icone/icone';
import { EstadoTela } from '../../shared/estado-tela';
import { descreverHorario } from '../../shared/util/recomendacao';

@Component({
  selector: 'app-mentores', imports: [RouterLink, Avatar, Icone],
  templateUrl: './mentores.html', styleUrl: './mentores.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Mentores {
  private readonly mentoresService = inject(MentoresService);
  private readonly rascunhos = inject(PedidoRascunhoService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly nomeMentor = viewChild<ElementRef<HTMLElement>>('nomeMentor');
  private toqueInicial: number | null = null;
  protected readonly estado = signal<EstadoTela>('carregando');
  protected readonly resultado = signal<Recomendacao | null>(null);
  protected readonly exibicao = signal<'pilha' | 'lista'>('pilha');
  protected readonly indice = signal(0);
  protected readonly atual = computed(() => this.resultado()?.recomendados[this.indice()] ?? null);
  protected readonly resumo = computed(() => {
    const r = this.rascunhos.rascunho();
    return r ? `${r.turnos.map(t => ROTULO_TURNO[t]).join(', ')} · ${r.modalidade === 'ambos' ? 'Ambos' : r.modalidade === 'online' ? 'Online' : 'Presencial'}` : '';
  });

  constructor() {
    if (!this.rascunhos.criterios()) { this.router.navigate(['/pedir-ajuda'], { replaceUrl: true }); return; }
    this.carregar();
  }

  protected carregar(): void {
    const criterios = this.rascunhos.criterios();
    if (!criterios) return;
    this.estado.set('carregando');
    this.mentoresService.recomendar(criterios).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: resultado => {
        if (!resultado) { this.router.navigate(['/pedir-ajuda'], { replaceUrl: true }); return; }
        this.resultado.set(resultado);
        this.indice.set(0);
        this.estado.set(resultado.recomendados.length ? 'sucesso' : 'vazio');
      },
      error: () => this.estado.set('erro'),
    });
  }

  protected motivo(item: MentorRecomendado): string {
    const horario = item.horariosCompativeis[0];
    return `Ensina ${this.resultado()?.materia.nome}${horario ? ` • ${descreverHorario(horario)}` : ''}`;
  }

  protected etiquetas(item: MentorRecomendado): string[] {
    const horario = item.horariosCompativeis[0];
    const modalidades = new Set(item.horariosCompativeis.map(h => h.modalidade));
    return ['mesma matéria', ...(horario ? [descreverHorario(horario)] : []), modalidades.size > 1 ? 'presencial ou online' : modalidades.has('online') ? 'online' : 'presencial'];
  }

  protected mover(direcao: number): void {
    const total = this.resultado()?.recomendados.length ?? 0;
    this.indice.update(indice => Math.max(0, Math.min(total - 1, indice + direcao)));
    afterNextRender(() => this.nomeMentor()?.nativeElement.focus(), { injector: this.injector });
  }

  protected verPerfil(id: string): void {
    this.rascunhos.atualizar({ mentorId: id, horarioId: this.rascunhos.rascunho()?.mentorId === id ? this.rascunhos.rascunho()?.horarioId ?? null : null });
    this.router.navigate(['/mentores', id]);
  }

  protected iniciarToque(evento: TouchEvent): void { this.toqueInicial = evento.changedTouches[0]?.clientX ?? null; }
  protected terminarToque(evento: TouchEvent): void {
    if (this.toqueInicial === null) return;
    const distancia = (evento.changedTouches[0]?.clientX ?? this.toqueInicial) - this.toqueInicial;
    this.toqueInicial = null;
    if (Math.abs(distancia) > 70) this.mover(distancia < 0 ? 1 : -1);
  }
}
