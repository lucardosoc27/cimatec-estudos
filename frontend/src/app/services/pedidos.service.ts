import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';

import { Modalidade } from '../models/disponibilidade';
import { Pedido, PRAZO_RESPOSTA_HORAS } from '../models/pedido';
import { proximaData, somarHoras } from '../shared/util/datas';
import { PedidoMock } from './mock/pedido-mock';

/** Aluno logado no mock. Na fase 2 vem da sessão, nunca do cliente. */
const ALUNO_LOGADO = 'aluno-1';

/** O que a tela 4 manda. O resto (id, status, datas de controle) é o servidor quem define. */
export interface NovoPedido {
  mentorId: string;
  mentorNome: string;
  materiaId: string;
  materiaNome: string;
  data: string;
  hora: string;
  modalidade: Modalidade;
}

/** Erro tipado: a tela distingue "já existe pedido" de "sem conexão" sem comparar texto. Na fase 2 é o HTTP 409. */
export class PedidoDuplicadoError extends Error {
  constructor(readonly pedidoExistente: Pedido) {
    super('Já existe um pedido aguardando resposta para este mentor nesta matéria.');
  }
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly http = inject(HttpClient);

  /** Quando a API existir, vira algo como '/api/pedidos'. É a única linha que muda. */
  private readonly url = 'assets/pedidos.json';

  /**
   * Decisão de 2026-09-17: o JSON é só leitura, então os pedidos criados vivem aqui, em
   * memória, e somem ao recarregar a página. O service é singleton (providedIn: 'root'),
   * por isso a lista sobrevive à troca de tela. Some junto com o mock.
   */
  private lista: Pedido[] | null = null;

  /** Pedidos do aluno logado, do mais recente para o mais antigo. */
  listar(): Observable<Pedido[]> {
    if (this.lista) {
      // `of` embrulha um valor pronto num Observable, para quem chama não saber se veio do cache ou do HTTP.
      return of(this.ordenar(this.lista));
    }
    return this.http.get<PedidoMock[]>(this.url).pipe(
      map((mocks) => {
        const agora = new Date();
        this.lista = mocks.map((mock) => this.converterMock(mock, agora));
        return this.ordenar(this.lista);
      }),
    );
  }

  /** Pedido "em aberto" = aguardando resposta. Aceito é sessão marcada e não impede outro pedido. */
  buscarEmAberto(mentorId: string, materiaId: string): Observable<Pedido | undefined> {
    return this.listar().pipe(
      map((lista) =>
        lista.find((p) => p.status === 'aguardando' && p.mentorId === mentorId && p.materiaId === materiaId),
      ),
    );
  }

  /**
   * Cria o pedido. Recusa duplicado em aberto lançando `PedidoDuplicadoError`.
   * Um `throw` dentro de `map` vira o `error` do Observable: é o mesmo caminho pelo qual
   * um 409 do servidor chegaria, então a tela não muda na fase 2.
   * Aqui isso é interface: quem pode editar o JS consegue pular a checagem. A regra de verdade é do servidor.
   */
  criar(novo: NovoPedido): Observable<Pedido> {
    return this.buscarEmAberto(novo.mentorId, novo.materiaId).pipe(
      map((existente) => {
        if (existente) {
          throw new PedidoDuplicadoError(existente);
        }
        const agora = new Date();
        const pedido: Pedido = {
          id: `p-${agora.getTime()}`,
          alunoId: ALUNO_LOGADO,
          ...novo,
          status: 'aguardando',
          criadoEm: agora.toISOString(),
          expiraEm: somarHoras(agora, PRAZO_RESPOSTA_HORAS).toISOString(),
        };
        this.lista!.push(pedido);
        return pedido;
      }),
    );
  }

  private ordenar(lista: Pedido[]): Pedido[] {
    return [...lista].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  /** Transforma o tempo relativo do mock em datas absolutas. Some junto com o mock. */
  private converterMock(mock: PedidoMock, agora: Date): Pedido {
    const { dia, criadoHaHoras, ...campos } = mock;
    const criadoEm = somarHoras(agora, -criadoHaHoras);
    return {
      ...campos,
      data: proximaData(dia, campos.hora, agora),
      criadoEm: criadoEm.toISOString(),
      expiraEm: somarHoras(criadoEm, PRAZO_RESPOSTA_HORAS).toISOString(),
    };
  }
}
