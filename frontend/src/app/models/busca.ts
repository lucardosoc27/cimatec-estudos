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
