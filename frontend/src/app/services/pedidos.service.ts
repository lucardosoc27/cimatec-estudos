import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { Pedido, PRAZO_RESPOSTA_HORAS } from '../models/pedido';
import { proximaData, somarHoras } from '../shared/util/datas';
import { PedidoMock } from './mock/pedido-mock';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly http = inject(HttpClient);

  /** Quando a API existir, vira algo como '/api/pedidos'. É a única linha que muda. */
  private readonly url = 'assets/pedidos.json';

  /** Pedidos do aluno logado, do mais recente para o mais antigo. */
  listar(): Observable<Pedido[]> {
    return this.http.get<PedidoMock[]>(this.url).pipe(
      map((lista) => {
        const agora = new Date();
        return lista
          .map((mock) => this.converterMock(mock, agora))
          .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
      }),
    );
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
