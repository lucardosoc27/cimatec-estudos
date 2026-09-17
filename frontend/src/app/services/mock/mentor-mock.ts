import { Mentor } from '../../models/mentor';

/** Forma de um mentor em `assets/mentores.json`. `respostaSimulada` substitui o lado do mentor, que não existe no MVP. */
export interface MentorMock extends Mentor {
  respostaSimulada: { acao: 'aceita' | 'recusa' | 'nenhuma'; aposSegundos?: number };
}
