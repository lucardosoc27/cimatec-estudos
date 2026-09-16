import { deQueryParams, paraQueryParams } from './busca';

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
