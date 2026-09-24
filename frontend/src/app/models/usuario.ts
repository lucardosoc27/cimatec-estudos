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
  consentimentos: Consentimentos;
}

/**
 * Cada consentimento guarda a data e hora (ISO) em que foi dado; null = não deu.
 * Guardar a data em vez de um booleano é o que a LGPD pede: provar QUANDO o titular consentiu.
 */
export interface Consentimentos {
  /** Obrigatório no cadastro: sem ele a conta não existe. */
  termosEPoliticaEm: string;
  /**
   * Foto visível só para quem está logado. Não vale para a vitrine pública, que usa sempre
   * iniciais (DECISOES.md, 2026-09-22); o nome existe para impedir essa confusão.
   */
  fotoParaLogadosEm: string | null;
  /** Aparecer na vitrine pública da landing, só com iniciais. */
  vitrinePublicaEm: string | null;
}
