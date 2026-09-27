/** Curso e semestre do mentor, como aparece no cartão: "5º semestre · POO" ou "Egresso · POO". */
export function cursoSemestre(mentor: { semestre: number | null; curso: string }): string {
  const semestre = mentor.semestre === null ? 'Egresso' : `${mentor.semestre}º semestre`;
  return `${semestre} · ${mentor.curso}`;
}

/** "segunda-feira, 28/09" → "Segunda-feira, 28/09". Só a primeira letra: em português o que vem
 *  depois do hífen continua minúsculo, e é por isso que o text-transform: capitalize não serve. */
export function maiusculaInicial(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase('pt-BR') + texto.slice(1);
}
