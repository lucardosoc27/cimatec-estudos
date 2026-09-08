import { DiaSemana, Modalidade } from '../../models/disponibilidade';
import { StatusPedido } from '../../models/pedido';

/**
 * Forma de um pedido dentro de `assets/pedidos.json`.
 * O mock não tem relógio, então descreve o tempo de forma relativa ("criado há 3 horas")
 * e o horário por dia da semana. `PedidosService` converte isso para `Pedido`, com datas
 * absolutas. Esta pasta inteira some quando a API real existir.
 */
export interface PedidoMock {
  id: string;
  alunoId: string;
  mentorId: string;
  mentorNome: string;
  materiaId: string;
  materiaNome: string;
  dia: DiaSemana;
  hora: string;
  modalidade: Modalidade;
  status: StatusPedido;
  criadoHaHoras: number;
  contatoMentor?: { email: string };
}
