import { Mentor } from '../../models/mentor';
import { Consentimentos } from '../../models/usuario';

/** Forma de um mentor em `assets/mentores.json`. `respostaSimulada` substitui o lado do mentor, que não existe no MVP. */
export interface MentorMock extends Mentor {
  respostaSimulada: { acao: 'aceita' | 'recusa' | 'nenhuma'; aposSegundos?: number };
  /** Fica só no "servidor": o aluno que busca não recebe as datas de consentimento de ninguém. */
  consentimentos: Consentimentos;
  /**
   * O mesmo retrato em 224 px, para onde a foto aparece pequena (vitrine e cartão de pedido, 56 px
   * na tela). `foto` é o de 960 px, para o cartão da pilha (480 px) e o perfil. Quem escolhe o
   * tamanho é o "servidor", por rota: a tela continua recebendo uma URL só, como o `Mentor` pede.
   */
  fotoPequena: string | null;
}
