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
  /** O semestre pertence ao filtro de matérias, não ao cadastro. */
  foto: string | null;
  termosVersao: string;
  /** Lista, não valor único: um veterano pode pedir ajuda em uma matéria e ensinar outra. */
  papeis: Papel[];
  verificacao: SituacaoVerificacao;
  consentimentos: Consentimentos;
}

/**
 * Cada consentimento guarda a data e hora (ISO) em que foi dado; null = não deu.
 * A data registra quando a escolha foi feita. Não substitui um histórico de consentimentos.
 */
export interface Consentimentos {
  /** Obrigatório no cadastro: sem ele a conta não existe. */
  termosEPoliticaEm: string;
  /**
   * Foto visível só para quem está logado. Não vale para a vitrine pública, que é
   * outro consentimento e nunca mostra foto, mesmo com este ligado.
   */
  fotoParaLogadosEm: string | null;
  /**
   * Aparecer na vitrine pública da landing, com primeiro nome, curso, matérias e descrição.
   * Sem foto: DECISOES.md, entrada de 2026-09-22.
   */
  vitrinePublicaEm: string | null;
}
