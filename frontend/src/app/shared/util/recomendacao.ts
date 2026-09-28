import { CriteriosBusca } from '../../models/busca';
import { DiaSemana, HorarioLivre, ROTULO_DIA, Turno } from '../../models/disponibilidade';
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

const ORDEM_DIA = Object.keys(ROTULO_DIA) as DiaSemana[];

function horarioCompativel(h: HorarioLivre, criterios: CriteriosBusca): boolean {
  return criterios.turnos.includes(h.turno) && atendeModalidade(h, criterios);
}

function porDiaEHora(a: HorarioLivre, b: HorarioLivre): number {
  return ORDEM_DIA.indexOf(a.dia) - ORDEM_DIA.indexOf(b.dia) || a.hora.localeCompare(b.hora);
}

/**
 * Tela 4: todos os horários do mentor, em ordem de dia e hora, separados entre os que
 * batem com o que o aluno pediu e os demais. Os demais também aparecem, porque o aluno
 * pode ter chegado por "disponíveis em outros turnos" e escolher um deles de propósito.
 */
export function separarHorarios(
  horarios: HorarioLivre[],
  criterios: CriteriosBusca,
): { compativeis: HorarioLivre[]; outros: HorarioLivre[] } {
  const compativeis: HorarioLivre[] = [];
  const outros: HorarioLivre[] = [];
  for (const h of [...horarios].sort(porDiaEHora)) {
    (horarioCompativel(h, criterios) ? compativeis : outros).push(h);
  }
  return { compativeis, outros };
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

/** Critérios que vêm de cálculo: mais horários compatíveis, depois mais sessões concluídas na matéria. */
function compararPorCriterios(a: MentorRecomendado, b: MentorRecomendado, materiaId: string): number {
  return (
    b.horariosCompativeis.length - a.horariosCompativeis.length ||
    sessoesNaMateria(b.mentor, materiaId) - sessoesNaMateria(a.mentor, materiaId)
  );
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
 * matéria, depois nome. Assumindo má-fé: `sessoesConcluidas` terá de vir do servidor contando
 * só sessão confirmada pelos dois lados, o que ainda não existe; no mock é um número editável,
 * e nada aqui no cliente consegue impedir isso. A garantia é do servidor, não desta função.
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
    compararPorCriterios(a, b, criterios.materiaId) || a.mentor.nome.localeCompare(b.mentor.nome);

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
