import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { Modalidade } from '../models/disponibilidade';
import { Pedido } from '../models/pedido';

/** O servidor valida os ids e calcula nomes, status, prazos e contato. */
export interface NovoPedido {
  mentorId: string;
  mentorNome: string;
  materiaId: string;
  materiaNome: string;
  data: string;
  hora: string;
  modalidade: Modalidade;
  horarioId?: string;
  necessidade?: string;
  mentorFoto?: string | null;
  local?: string;
  mentorCurso?: string;
  alunoCurso?: string;
}
export class PedidoDuplicadoError extends Error {
  constructor(readonly pedidoExistente: Pedido) { super('Já existe um pedido aguardando resposta para este mentor nesta matéria.'); }
}
export class PedidoEncerradoError extends Error {
  constructor(readonly pedidoAtual: Pedido) { super('Este pedido já está encerrado.'); }
}
/** Aceite recusado pelo servidor: a mentora já tem outra sessão aceita no mesmo dia e hora. */
export class HorarioOcupadoError extends Error {
  constructor() { super('Já existe uma sessão aceita nesse horário.'); }
}
@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly http = inject(HttpClient);
  private readonly url = '/api/pedidos';
  listar(): Observable<Pedido[]> { return this.http.get<Pedido[]>(this.url); }
  listarRecebidos(): Observable<Pedido[]> { return this.http.get<Pedido[]>(this.url + '/recebidos'); }
  buscarEmAberto(mentorId: string, materiaId: string): Observable<Pedido | undefined> {
    return this.listar().pipe(map(lista => lista.find(p => p.status === 'aguardando' && p.mentorId === mentorId && p.materiaId === materiaId)));
  }
  criar(novo: NovoPedido): Observable<Pedido> {
    const { mentorId, materiaId, horarioId, data, hora, modalidade, necessidade } = novo;
    return this.http.post<Pedido>(this.url, { mentorId, materiaId, horarioId, data, hora, modalidade, necessidade }).pipe(catchError(erro => {
      if (erro instanceof HttpErrorResponse && erro.status === 409 && erro.error?.codigo === 'PEDIDO_DUPLICADO' && erro.error.pedido) return throwError(() => new PedidoDuplicadoError(erro.error.pedido));
      return throwError(() => erro);
    }));
  }
  buscarPorId(id: string): Observable<Pedido | undefined> {
    return this.http.get<Pedido>(this.url + '/' + encodeURIComponent(id)).pipe(catchError(erro => erro.status === 404 ? of(undefined) : throwError(() => erro)));
  }
  aceitar(id: string): Observable<Pedido> {
    return this.acao(id, 'aceitar').pipe(catchError(erro => {
      if (erro.status === 409 && erro.error?.codigo === 'HORARIO_OCUPADO') return throwError(() => new HorarioOcupadoError());
      return throwError(() => erro);
    }));
  }
  recusar(id: string): Observable<Pedido> { return this.acao(id, 'recusar'); }
  cancelar(id: string): Observable<Pedido> { return this.acao(id, 'cancelar'); }
  /** As três ações devolvem 409 PEDIDO_ENCERRADO quando o pedido mudou antes do clique (expirou, foi cancelado). */
  private acao(id: string, acao: string): Observable<Pedido> {
    return this.http.patch<Pedido>(this.url + '/' + encodeURIComponent(id) + '/' + acao, {}).pipe(catchError(erro => {
      if (erro.status === 409 && erro.error?.codigo === 'PEDIDO_ENCERRADO' && erro.error.pedido) return throwError(() => new PedidoEncerradoError(erro.error.pedido));
      return throwError(() => erro);
    }));
  }
}
