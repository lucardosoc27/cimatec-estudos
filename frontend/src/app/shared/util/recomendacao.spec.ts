import { HorarioLivre } from '../../models/disponibilidade';
import { Materia } from '../../models/materia';
import { Mentor } from '../../models/mentor';
import { descreverHorario, idDoMentorComSelo, materiasAlternativas, recomendarMentores, separarHorarios } from './recomendacao';

function horario(id: string, dia: HorarioLivre['dia'], turno: HorarioLivre['turno'], modalidade: HorarioLivre['modalidade']): HorarioLivre {
  const hora = { manha: '09:00', tarde: '14:00', noite: '19:00' }[turno];
  return { id, dia, hora, turno, modalidade };
}

function mentor(parcial: Partial<Mentor> & { id: string; nome: string }): Mentor {
  return {
    curso: 'Desenvolvimento de Sistemas',
    semestre: 4,
    verificado: true,
    materias: ['poo'],
    descricao: '',
    sessoesConcluidas: 0,
    selos: [],
    horariosLivres: [],
    ...parcial,
  };
}

const ana = mentor({
  id: 'ana', nome: 'Ana',
  selos: [{ materiaId: 'poo', sessoesConcluidas: 9 }],
  horariosLivres: [horario('a1', 'ter', 'tarde', 'online'), horario('a2', 'ter', 'tarde', 'presencial'), horario('a3', 'qui', 'noite', 'online')],
});
const bruno = mentor({
  id: 'bruno', nome: 'Bruno',
  selos: [{ materiaId: 'poo', sessoesConcluidas: 3 }],
  horariosLivres: [horario('b1', 'seg', 'manha', 'presencial')],
});
const carla = mentor({
  id: 'carla', nome: 'Carla',
  materias: ['poo', 'banco-dados'],
  selos: [{ materiaId: 'poo', sessoesConcluidas: 4 }],
  horariosLivres: [horario('c1', 'ter', 'tarde', 'online')],
});
const naoVerificada = mentor({
  id: 'edu', nome: 'Eduarda', verificado: false,
  horariosLivres: [horario('e1', 'ter', 'tarde', 'online')],
});
const outraMateria = mentor({
  id: 'diego', nome: 'Diego', materias: ['logica'],
  horariosLivres: [horario('d1', 'ter', 'tarde', 'online')],
});
const todos = [ana, bruno, carla, naoVerificada, outraMateria];

describe('descreverHorario', () => {
  it('escreve o dia e o turno por extenso', () => {
    expect(descreverHorario(horario('x', 'ter', 'tarde', 'online'))).toBe('livre terça à tarde');
    expect(descreverHorario(horario('x', 'seg', 'manha', 'online'))).toBe('livre segunda de manhã');
  });
});

describe('recomendarMentores', () => {
  it('nunca inclui mentor não verificado, nem em outros turnos', () => {
    const r = recomendarMentores(todos, { materiaId: 'poo', turnos: ['tarde'] });
    const ids = [...r.recomendados, ...r.outrosTurnos].map((x) => x.mentor.id);
    expect(ids.includes('edu')).toBe(false);
  });

  it('ignora mentor de outra matéria', () => {
    const r = recomendarMentores(todos, { materiaId: 'poo', turnos: ['tarde'] });
    const ids = [...r.recomendados, ...r.outrosTurnos].map((x) => x.mentor.id);
    expect(ids.includes('diego')).toBe(false);
  });

  it('manda matéria certa com turno errado só para outrosTurnos', () => {
    const r = recomendarMentores(todos, { materiaId: 'poo', turnos: ['tarde'] });
    expect(r.recomendados.map((x) => x.mentor.id)).toEqual(['ana', 'carla']);
    expect(r.outrosTurnos.map((x) => x.mentor.id)).toEqual(['bruno']);
  });

  it('filtra por modalidade quando escolhida e aceita as duas quando ausente', () => {
    const presencial = recomendarMentores(todos, { materiaId: 'poo', turnos: ['tarde'], modalidade: 'presencial' });
    expect(presencial.recomendados.map((x) => x.mentor.id)).toEqual(['ana']);
    const qualquer = recomendarMentores(todos, { materiaId: 'poo', turnos: ['tarde'] });
    expect(qualquer.recomendados[0].horariosCompativeis.length).toBe(2);
  });

  it('ordena por horários compatíveis, depois sessões na matéria, depois nome', () => {
    const r = recomendarMentores(todos, { materiaId: 'poo', turnos: ['tarde', 'noite'] });
    // ana: 3 horários; carla: 1
    expect(r.recomendados.map((x) => x.mentor.id)).toEqual(['ana', 'carla']);

    const empate = recomendarMentores(
      [mentor({ id: 'z', nome: 'Zeca', horariosLivres: [horario('z1', 'ter', 'tarde', 'online')] }),
       mentor({ id: 'a', nome: 'Alice', horariosLivres: [horario('a1', 'ter', 'tarde', 'online')] })],
      { materiaId: 'poo', turnos: ['tarde'] },
    );
    expect(empate.recomendados.map((x) => x.mentor.id)).toEqual(['a', 'z']);
  });

  it('monta os motivos no formato do caderno', () => {
    const r = recomendarMentores([ana], { materiaId: 'poo', turnos: ['tarde'] });
    expect(r.recomendados[0].motivos).toEqual(['mesma matéria', 'livre terça à tarde', '9 sessões concluídas nesta matéria']);
  });

  it('marca mentor sem selo na matéria como novo', () => {
    const novo = mentor({ id: 'n', nome: 'Nina', horariosLivres: [horario('n1', 'ter', 'tarde', 'online')] });
    const r = recomendarMentores([novo], { materiaId: 'poo', turnos: ['tarde'] });
    expect(r.recomendados[0].motivos[2]).toBe('mentor novo nesta matéria');
  });
});

describe('idDoMentorComSelo', () => {
  const selo = (mentores: Mentor[]) =>
    idDoMentorComSelo(recomendarMentores(mentores, { materiaId: 'poo', turnos: ['tarde'] }).recomendados, 'poo');

  it('dá o selo ao primeiro quando ele vence por horários compatíveis', () => {
    // ana: 2 horários à tarde; carla: 1
    expect(selo([carla, ana])).toBe('ana');
  });

  it('dá o selo ao primeiro quando empata nos horários e vence por sessões na matéria', () => {
    const muitas = mentor({ id: 'm', nome: 'Zeca', selos: [{ materiaId: 'poo', sessoesConcluidas: 5 }], horariosLivres: [horario('m1', 'ter', 'tarde', 'online')] });
    const poucas = mentor({ id: 'p', nome: 'Alice', selos: [{ materiaId: 'poo', sessoesConcluidas: 2 }], horariosLivres: [horario('p1', 'ter', 'tarde', 'online')] });
    expect(selo([poucas, muitas])).toBe('m');
  });

  it('não dá selo quando só o nome separa os dois primeiros', () => {
    const zeca = mentor({ id: 'z', nome: 'Zeca', horariosLivres: [horario('z1', 'ter', 'tarde', 'online')] });
    const alice = mentor({ id: 'a', nome: 'Alice', horariosLivres: [horario('a1', 'ter', 'tarde', 'online')] });
    expect(selo([zeca, alice])).toBeNull();
  });

  it('não dá selo quando há um recomendado só', () => {
    expect(selo([ana])).toBeNull();
  });

  it('não dá selo quando não há recomendados', () => {
    expect(idDoMentorComSelo([], 'poo')).toBeNull();
  });
});

describe('materiasAlternativas', () => {
  const materias: Materia[] = [
    { id: 'poo', nome: 'POO', curso: 'DS', semestre: 2 },
    { id: 'banco-dados', nome: 'Banco de Dados', curso: 'DS', semestre: 2 },
    { id: 'ingles', nome: 'Inglês', curso: 'DS', semestre: 2 },
    { id: 'logica', nome: 'Lógica', curso: 'DS', semestre: 1 },
  ];

  it('devolve só matérias do mesmo semestre com mentor livre, excluindo a própria', () => {
    const r = materiasAlternativas(todos, materias, materias[0], { materiaId: 'poo', turnos: ['tarde'] });
    expect(r).toEqual([{ materia: materias[1], quantidadeMentores: 1 }]);
  });
});

describe('separarHorarios', () => {
  it('separa por turno e modalidade e mantém os demais em "outros"', () => {
    const r = separarHorarios(ana.horariosLivres, { materiaId: 'poo', turnos: ['tarde'], modalidade: 'online' });
    expect(r.compativeis.map((h) => h.id)).toEqual(['a1']);
    expect(r.outros.map((h) => h.id)).toEqual(['a2', 'a3']);
  });

  it('ordena por dia da semana e depois por hora', () => {
    const desordenados = [horario('q', 'qui', 'noite', 'online'), { ...horario('s2', 'seg', 'manha', 'online'), hora: '10:00' }, horario('s1', 'seg', 'manha', 'online')];
    const r = separarHorarios(desordenados, { materiaId: 'poo', turnos: ['manha', 'noite'] });
    expect(r.compativeis.map((h) => h.id)).toEqual(['s1', 's2', 'q']);
  });
});
