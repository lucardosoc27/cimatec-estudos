import { Modalidade } from './disponibilidade';

/**
 * "Enviado" não é um estado persistido: é o título da tela 5 logo após o envio.
 * Ver DECISOES.md, entrada de 2026-09-07.
 */
export type StatusPedido = 'aguardando' | 'aceito' | 'recusado' | 'expirado' | 'cancelado';

/** Status sempre por extenso na tela. Nunca comunicado só por cor. */
export const ROTULO_STATUS: Record<StatusPedido, string> = {
  aguardando: 'Aguardando resposta',
  aceito: 'Aceito',
  recusado: 'Recusado',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
};

/** Só aguardando e aceito podem ser cancelados; os outros três já estão encerrados. */
export function podeSerCancelado(status: StatusPedido): boolean {
  return status === 'aguardando' || status === 'aceito';
}

/** Prazo para o mentor responder. Depois disso o pedido expira. */
export const PRAZO_RESPOSTA_HORAS = 48;

export interface Pedido {
  id: string;
  alunoId: string;
  alunoNome?: string;
  alunoCurso?: string;
  alunoFoto?: string | null;
  mentorId: string;
  /** Desnormalizado para a tela 1 mostrar o pedido sem uma segunda chamada. */
  mentorNome: string;
  mentorCurso?: string;
  mentorFoto?: string | null;
  necessidade?: string;
  horarioId?: string;
  local?: string;
  materiaId: string;
  /** Idem `mentorNome`. */
  materiaNome: string;
  /** Data concreta da sessão pedida, 'YYYY-MM-DD'. Calculada no envio. */
  data: string;
  /** 'HH:mm'. */
  hora: string;
  modalidade: Modalidade;
  status: StatusPedido;
  /** ISO 8601. */
  criadoEm: string;
  /** ISO 8601: `criadoEm` + 48 h. */
  expiraEm: string;
  /** Só existe quando `status === 'aceito'`. Antes disso o servidor não envia. */
  contatoMentor?: { email: string };
}
