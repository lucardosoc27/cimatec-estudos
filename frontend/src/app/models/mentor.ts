import { HorarioLivre } from './disponibilidade';

/** Selo público por matéria: quantas sessões concluídas e confirmadas pelos dois lados. */
export interface SeloMateria {
  materiaId: string;
  sessoesConcluidas: number;
}

/**
 * Visão PÚBLICA do mentor: é o que qualquer aluno recebe ao fazer uma busca.
 * Por isso não tem e-mail, telefone nem nota numérica. O contato só chega dentro de
 * `Pedido.contatoMentor`, e apenas quando o pedido foi aceito.
 */
export interface Mentor {
  id: string;
  nome: string;
  curso: string;
  /** null = egresso. */
  semestre: number | null;
  /** Mentor não verificado nunca aparece nas recomendações. */
  verificado: boolean;
  /** Ids de `Materia`. */
  materias: string[];
  descricao: string;
  /** Total de sessões concluídas e confirmadas pelos dois lados. */
  sessoesConcluidas: number;
  selos: SeloMateria[];
  horariosLivres: HorarioLivre[];
}

/**
 * O que a tela 3 exibe: o mentor mais o motivo de ele ter sido recomendado.
 * Montado pelo service a partir do que o aluno pediu na tela 2.
 */
export interface MentorRecomendado {
  mentor: Mentor;
  /** Ex.: ['mesma matéria', 'livre terça à tarde', '8 sessões concluídas']. */
  motivos: string[];
  horariosCompativeis: HorarioLivre[];
}
