/** Curso e semestre do mentor, como aparece no cartão: "5º semestre · POO" ou "Egresso · POO". */
export function cursoSemestre(mentor: { semestre: number | null; curso: string }): string {
  const semestre = mentor.semestre === null ? 'Egresso' : `${mentor.semestre}º semestre`;
  return `${semestre} · ${mentor.curso}`;
}
