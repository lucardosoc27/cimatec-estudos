import { criteriosValidos, deQueryParams, paramsDeCriterios, paraQueryParams } from './busca';

/** ParamMap é só uma interface; um objeto com `get` basta para o teste. */
function paramMap(valores: Record<string, string>) {
  return {
    get: (chave: string) => valores[chave] ?? null,
    has: (chave: string) => chave in valores,
    getAll: (chave: string) => (chave in valores ? [valores[chave]] : []),
    keys: Object.keys(valores),
  };
}

describe('paraQueryParams', () => {
  it('omite modalidade quando é "tanto faz"', () => {
    expect(paraQueryParams({ materiaId: 'poo', turnos: ['tarde', 'noite'] }))
      .toEqual({ materia: 'poo', turnos: 'tarde,noite' });
  });

  it('inclui modalidade quando escolhida', () => {
    expect(paraQueryParams({ materiaId: 'poo', turnos: ['manha'], modalidade: 'online' }))
      .toEqual({ materia: 'poo', turnos: 'manha', modalidade: 'online' });
  });
});

describe('deQueryParams', () => {
  it('faz a volta completa do que paraQueryParams gerou', () => {
    const ida = paraQueryParams({ materiaId: 'poo', turnos: ['tarde'], modalidade: 'presencial' });
    expect(deQueryParams(paramMap(ida))).toEqual({ materiaId: 'poo', turnos: ['tarde'], modalidade: 'presencial' });
  });

  it('descarta turno e modalidade fora do domínio', () => {
    expect(deQueryParams(paramMap({ turnos: 'tarde,xyz', modalidade: 'telepatia' })))
      .toEqual({ materiaId: undefined, turnos: ['tarde'], modalidade: undefined });
  });

  it('devolve turnos vazio quando a URL não tem nada', () => {
    expect(deQueryParams(paramMap({}))).toEqual({ materiaId: undefined, turnos: [], modalidade: undefined });
  });
});

describe('criteriosValidos', () => {
  it('aceita matéria e ao menos um turno, sem exigir modalidade', () => {
    expect(criteriosValidos({ materiaId: 'poo', turnos: ['tarde'] }))
      .toEqual({ materiaId: 'poo', turnos: ['tarde'], modalidade: undefined });
  });

  it('rejeita quando falta matéria', () => {
    expect(criteriosValidos({ turnos: ['tarde'] })).toBeNull();
  });

  it('rejeita quando não há nenhum turno', () => {
    expect(criteriosValidos({ materiaId: 'poo', turnos: [] })).toBeNull();
  });
});

describe('paramsDeCriterios', () => {
  it('converte critérios em query params', () => {
    expect(paramsDeCriterios({ materiaId: 'poo', turnos: ['tarde'] }))
      .toEqual({ materia: 'poo', turnos: 'tarde' });
  });

  it('devolve objeto vazio quando não há critérios', () => {
    expect(paramsDeCriterios(null)).toEqual({});
  });
});
