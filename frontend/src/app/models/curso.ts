export interface Curso {
  nome: string;
  semestres: number;
}

/** Cursos técnicos da unidade CIMATEC, na ordem definida para os formulários. */
export const CURSOS: readonly Curso[] = [
  { nome: 'Desenvolvimento de Sistemas', semestres: 4 },
  { nome: 'Redes de Computadores', semestres: 3 },
  { nome: 'Biotecnologia', semestres: 4 },
  { nome: 'Química', semestres: 4 },
  { nome: 'Petroquímica', semestres: 4 },
  { nome: 'Eletromecânica', semestres: 4 },
  { nome: 'Edificações', semestres: 4 },
  { nome: 'Mecânica', semestres: 4 },
  { nome: 'Multimídia', semestres: 3 },
];
