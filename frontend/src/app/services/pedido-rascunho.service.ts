import { Injectable, computed, signal } from '@angular/core';

import { CriteriosBusca } from '../models/busca';
import { Modalidade, Turno } from '../models/disponibilidade';

export interface PedidoRascunho {
  curso: string;
  /** Filtro da busca, nunca enviado como dado de cadastro. */
  semestre: number;
  materiaId: string | null;
  necessidade: string | null;
  turnos: Turno[];
  modalidade: Modalidade | 'ambos';
  mentorId: string | null;
  horarioId: string | null;
}

@Injectable({ providedIn: 'root' })
export class PedidoRascunhoService {
  private readonly atual = signal<PedidoRascunho | null>(null);
  readonly rascunho = this.atual.asReadonly();
  private readonly enviados = new Map<string, PedidoRascunho>();

  readonly criterios = computed<CriteriosBusca | null>(() => {
    const r = this.atual();
    if (!r?.materiaId || !r.turnos.length) return null;
    return { materiaId: r.materiaId, turnos: r.turnos, modalidade: r.modalidade === 'ambos' ? undefined : r.modalidade };
  });

  definir(rascunho: PedidoRascunho): void {
    this.atual.set({ ...rascunho, turnos: [...rascunho.turnos] });
  }

  atualizar(campos: Partial<PedidoRascunho>): void {
    const atual = this.atual();
    if (atual) this.definir({ ...atual, ...campos });
  }

  /** Guarda os critérios de um pedido para uma nova busca após recusa/expiração. */
  guardarPedido(id: string): void {
    const atual = this.atual();
    if (atual) this.enviados.set(id, { ...atual, turnos: [...atual.turnos], mentorId: null, horarioId: null });
    this.atual.set(null);
  }

  restaurarPedido(id: string): boolean {
    const salvo = this.enviados.get(id);
    if (!salvo) return false;
    this.definir(salvo);
    return true;
  }

  /** Chamado no logout: nenhum rascunho ou pedido permanece entre contas. */
  limpar(): void {
    this.atual.set(null);
    this.enviados.clear();
  }
}
