import { CriteriosBusca } from '../../models/busca';
import { HorarioLivre, ROTULO_DIA, Turno } from '../../models/disponibilidade';
import { Materia } from '../../models/materia';
import { MateriaAlternativa, Mentor, MentorRecomendado } from '../../models/mentor';

const PREPOSICAO_TURNO: Record<Turno, string> = { manha: 'de manhã', tarde: 'à tarde', noite: 'à noite' };

/** 'livre terça à tarde'. */
export function descreverHorario(h: HorarioLivre): string {
  return `livre ${ROTULO_DIA[h.dia]} ${PREPOSICAO_TURNO[h.turno]}`;
}

function atendeModalidade(h: HorarioLivre, criterios: CriteriosBusca): boolean {
  return !criterios.modalidade || h.modalidade === criterios.modalidade;
}

function horarioCompativel(h: HorarioLivre, criterios: CriteriosBusca): boolean {
  return criterios.turnos.includes(h.turno) && atendeModalidade(h, criterios);
}

function sessoesNaMateria(mentor: Mentor, materiaId: string): number {
  return mentor.selos.find((s) => s.materiaId === materiaId)?.sessoesConcluidas ?? 0;
}

/** Monta os motivos no formato do caderno: "mesma matéria • livre terça à tarde • 9 sessões concluídas". */
function montarRecomendado(mentor: Mentor, horarios: HorarioLivre[], materiaId: string): MentorRecomendado {
  const descricoes = [...new Set(horarios.map(descreverHorario))];
  const sessoes = sessoesNaMateria(mentor, materiaId);
  const motivoSessoes =
    sessoes === 0
      ? 'mentor novo nesta matéria'
      : `${sessoes} ${sessoes === 1 ? 'sessão concluída' : 'sessões concluídas'} nesta matéria`;

  return {
    mentor,
    motivos: ['mesma matéria', ...descricoes, motivoSessoes],
    horariosCompativeis: horarios,
  };
}

/**
 * Separa os mentores da matéria em "recomendados" (têm horário nos turnos pedidos) e
 * "outros turnos" (têm a matéria, mas só em turno diferente).
 *
 * No MVP a fonte do filtro de verificado é `MentoresService.listarVerificados`; a checagem
 * aqui é defensiva, para a regra "não verificado nunca aparece" valer mesmo se a função
 * receber uma lista crua. Coberta por teste.
 *
 * Ordenação: mais horários compatíveis primeiro, depois mais sessões concluídas nesta
 * matéria, depois nome. Assumindo má-fé: `sessoesConcluidas` vem do servidor e só conta
 * sessão confirmada pelos dois lados; no mock é um número editável, e nada aqui no cliente
 * consegue impedir isso. A garantia é do servidor, não desta função.
 */
export function recomendarMentores(
  mentores: Mentor[],
  criterios: CriteriosBusca,
): { recomendados: MentorRecomendado[]; outrosTurnos: MentorRecomendado[] } {
  const recomendados: MentorRecomendado[] = [];
  const outrosTurnos: MentorRecomendado[] = [];

  for (const mentor of mentores) {
    if (!mentor.verificado || !mentor.materias.includes(criterios.materiaId)) {
      continue;
    }
    const compativeis = mentor.horariosLivres.filter((h) => horarioCompativel(h, criterios));
    if (compativeis.length > 0) {
      recomendados.push(montarRecomendado(mentor, compativeis, criterios.materiaId));
      continue;
    }
    const naModalidade = mentor.horariosLivres.filter((h) => atendeModalidade(h, criterios));
    if (naModalidade.length > 0) {
      outrosTurnos.push(montarRecomendado(mentor, naModalidade, criterios.materiaId));
    }
  }

  const porRelevancia = (a: MentorRecomendado, b: MentorRecomendado) =>
    b.horariosCompativeis.length - a.horariosCompativeis.length ||
    sessoesNaMateria(b.mentor, criterios.materiaId) - sessoesNaMateria(a.mentor, criterios.materiaId) ||
    a.mentor.nome.localeCompare(b.mentor.nome);

  return { recomendados: recomendados.sort(porRelevancia), outrosTurnos: outrosTurnos.sort(porRelevancia) };
}

/**
 * "Matérias parecidas" = outras matérias do mesmo semestre em que existe mentor livre
 * nos turnos pedidos. Só devolve as que têm resultado, para não levar a outra lista vazia.
 */
export function materiasAlternativas(
  mentores: Mentor[],
  materias: Materia[],
  materia: Materia,
  criterios: CriteriosBusca,
): MateriaAlternativa[] {
  return materias
    .filter((m) => m.semestre === materia.semestre && m.id !== materia.id)
    .map((m) => ({
      materia: m,
      quantidadeMentores: recomendarMentores(mentores, { ...criterios, materiaId: m.id }).recomendados.length,
    }))
    .filter((a) => a.quantidadeMentores > 0);
}
