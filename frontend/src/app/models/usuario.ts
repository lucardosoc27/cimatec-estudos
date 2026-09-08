export type Papel = 'aluno' | 'mentor';

export type SituacaoVerificacao = 'pendente' | 'verificado' | 'recusado';

/**
 * O usuário logado. É o ÚNICO modelo que carrega e-mail, e ele só vem do servidor
 * para o próprio dono da conta. Nunca aparece em lista pública.
 */
export interface Usuario {
  id: string;
  nome: string;
  emailInstitucional: string;
  curso: string;
  /** null = egresso (já concluiu o curso). */
  semestre: number | null;
  /** Lista, não valor único: um veterano pode pedir ajuda em uma matéria e ensinar outra. */
  papeis: Papel[];
  verificacao: SituacaoVerificacao;
  /** Data e hora (ISO) em que o usuário deu o consentimento LGPD no cadastro. */
  consentimentoLgpdEm: string;
}
