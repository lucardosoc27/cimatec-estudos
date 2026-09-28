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
  /**
   * Desde quando a pessoa aceita receber pedidos de ajuda (ISO); null = não recebe. É ela que
   * faz o servidor incluir 'mentor' em `papeis`.
   */
  mentoriaDesde: string | null;
}

/**
 * Cada consentimento guarda a data e hora (ISO) em que foi dado; null = não deu.
 * A data registra quando a escolha foi feita. Não substitui um histórico de consentimentos.
 */
export interface Consentimentos {
  /** Obrigatório no cadastro: sem ele a conta não existe. */
  termosEPoliticaEm: string;
  /**
   * Mostrar a foto a quem está logado. Também é condição para a foto aparecer na vitrine
   * pública: lá ela só aparece com este E o vitrinePublicaEm (DECISOES.md, 2026-09-28).
   */
  fotoParaLogadosEm: string | null;
  /**
   * Aparecer na vitrine pública da landing, com primeiro nome, curso, matérias e descrição, e
   * com a foto se fotoParaLogadosEm também estiver dado. Revisto em 2026-09-28: até então a
   * vitrine nunca mostrava foto (DECISOES.md, 2026-09-22 e 2026-09-28).
   */
  vitrinePublicaEm: string | null;
}
