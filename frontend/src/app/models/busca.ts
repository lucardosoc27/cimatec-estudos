import type { ParamMap, Params } from '@angular/router';

import { Modalidade, ROTULO_MODALIDADE, ROTULO_TURNO, Turno } from './disponibilidade';

/** O que o aluno pediu na tela 2. Vive na URL, para "voltar" nunca perder o preenchimento. */
export interface CriteriosBusca {
  materiaId: string;
  turnos: Turno[];
  /** Ausente = qualquer modalidade. */
  modalidade?: Modalidade;
}

export const TURNOS = Object.keys(ROTULO_TURNO) as Turno[];
export const MODALIDADES = Object.keys(ROTULO_MODALIDADE) as Modalidade[];

/** Ex.: { materia: 'poo', turnos: 'tarde,noite', modalidade: 'online' }. */
export function paraQueryParams(criterios: CriteriosBusca): Params {
  const params: Params = { materia: criterios.materiaId, turnos: criterios.turnos.join(',') };
  if (criterios.modalidade) {
    params['modalidade'] = criterios.modalidade;
  }
  return params;
}

/**
 * Leitura defensiva da URL: qualquer pessoa pode editá-la, então valor fora do domínio
 * é descartado em vez de virar estado. Devolve parcial porque a tela 2 aceita URL incompleta.
 */
export function deQueryParams(params: ParamMap): Partial<CriteriosBusca> {
  const materiaId = params.get('materia') ?? undefined;

  const turnos = (params.get('turnos') ?? '')
    .split(',')
    .filter((t): t is Turno => TURNOS.includes(t as Turno));

  const bruta = params.get('modalidade');
  const modalidade = MODALIDADES.includes(bruta as Modalidade) ? (bruta as Modalidade) : undefined;

  return { materiaId, turnos, modalidade };
}

/**
 * As telas 3 e 4 só têm o que recomendar com matéria e ao menos um turno; modalidade
 * continua opcional. Usada nas duas para decidir se manda de volta para a tela 2.
 */
export function criteriosValidos(lidos: Partial<CriteriosBusca>): CriteriosBusca | null {
  if (!lidos.materiaId || !lidos.turnos || lidos.turnos.length === 0) {
    return null;
  }
  return { materiaId: lidos.materiaId, turnos: lidos.turnos, modalidade: lidos.modalidade };
}

/** Os critérios atuais em forma de query params, ou objeto vazio enquanto não há nenhum. */
export function paramsDeCriterios(criterios: CriteriosBusca | null): Params {
  return criterios ? paraQueryParams(criterios) : {};
}
