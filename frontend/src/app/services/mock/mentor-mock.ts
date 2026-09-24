import { Mentor } from '../../models/mentor';
import { Consentimentos } from '../../models/usuario';

/** Forma de um mentor em `assets/mentores.json`. `respostaSimulada` substitui o lado do mentor, que não existe no MVP. */
export interface MentorMock extends Mentor {
  respostaSimulada: { acao: 'aceita' | 'recusa' | 'nenhuma'; aposSegundos?: number };
  /** Fica só no "servidor": o aluno que busca não recebe as datas de consentimento de ninguém. */
  consentimentos: Consentimentos;
}
