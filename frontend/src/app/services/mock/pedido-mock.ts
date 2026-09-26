import { DiaSemana } from '../../models/disponibilidade';
import { Pedido } from '../../models/pedido';

/**
 * Forma de um pedido dentro de `assets/pedidos.json`.
 * O mock não tem relógio, então descreve o tempo de forma relativa ("criado há 3 horas")
 * e o horário por dia da semana. O interceptor do mock converte isso para `Pedido`, com datas
 * absolutas. Esta pasta inteira some quando a API real existir.
 */
export interface PedidoMock extends Omit<Pedido, 'data' | 'criadoEm' | 'expiraEm'> {
  dia: DiaSemana;
  criadoHaHoras: number;
}
