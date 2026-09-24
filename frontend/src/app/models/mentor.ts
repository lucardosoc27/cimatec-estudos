import { HorarioLivre } from './disponibilidade';
import { Materia } from './materia';

/**
 * Selo público por matéria: quantas sessões concluídas. A confirmação pelos dois lados é
 * regra do projeto, mas ainda não existe no dado; até existir, a interface diz "concluídas".
 */
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
  /** null = sem foto ou sem consentimento; a tela cai no avatar de iniciais. */
  foto: string | null;
  /** Total de sessões concluídas (ainda sem confirmação pelos dois lados; ver `SeloMateria`). */
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
  /** Ex.: ['mesma matéria', 'livre terça à tarde', '8 sessões concluídas nesta matéria']. */
  motivos: string[];
  horariosCompativeis: HorarioLivre[];
}

/** Outra matéria do mesmo semestre em que há mentor livre nos turnos pedidos. */
export interface MateriaAlternativa {
  materia: Materia;
  quantidadeMentores: number;
}

/** Resposta completa da tela 3. Quando a API existir, é o JSON de GET /api/mentores/recomendados. */
export interface Recomendacao {
  materia: Materia;
  recomendados: MentorRecomendado[];
  /** Mentores da matéria sem horário nos turnos pedidos. Só aparecem na lista vazia. */
  outrosTurnos: MentorRecomendado[];
  alternativas: MateriaAlternativa[];
}
