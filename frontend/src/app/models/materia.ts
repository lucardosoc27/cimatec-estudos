export interface Materia {
  /** Identificador curto e estável, usado na URL e nos outros JSON. Ex.: 'poo'. */
  id: string;
  nome: string;
  curso: string;
  /** Semestre em que a matéria é ofertada no curso. */
  semestre: number;
}
