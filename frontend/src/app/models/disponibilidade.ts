/** Dia da semana em que um mentor pode ter horário. Domingo fica de fora: não há aula. */
export type DiaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab';

export type Turno = 'manha' | 'tarde' | 'noite';

export type Modalidade = 'presencial' | 'online';

/**
 * Horário semanal recorrente de um mentor.
 * A data concreta (por exemplo, "terça 15/09") é calculada no momento do envio do pedido.
 */
export interface HorarioLivre {
  id: string;
  dia: DiaSemana;
  /** Formato 'HH:mm'. */
  hora: string;
  /** Redundante em relação a `hora`, de propósito: legível no mock e usado no filtro da tela 2. */
  turno: Turno;
  modalidade: Modalidade;
}

/*
 * Rótulos por extenso. `Record<Tipo, string>` obriga a ter um rótulo para CADA valor do tipo:
 * se alguém adicionar um turno novo e esquecer o rótulo, o projeto não compila.
 */
export const ROTULO_DIA: Record<DiaSemana, string> = {
  seg: 'segunda',
  ter: 'terça',
  qua: 'quarta',
  qui: 'quinta',
  sex: 'sexta',
  sab: 'sábado',
};

export const ROTULO_TURNO: Record<Turno, string> = {
  manha: 'manhã',
  tarde: 'tarde',
  noite: 'noite',
};

export const ROTULO_MODALIDADE: Record<Modalidade, string> = {
  presencial: 'presencial',
  online: 'online',
};
