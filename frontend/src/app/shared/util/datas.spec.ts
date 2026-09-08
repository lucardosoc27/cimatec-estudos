import { proximaData, formatarDataLocal, somarHoras } from './datas';

describe('proximaData', () => {
  // segunda-feira, 7 de setembro de 2026, 10:00
  const segunda = new Date(2026, 8, 7, 10, 0);

  it('devolve o próximo dia da semana dentro da mesma semana', () => {
    expect(proximaData('qua', '14:00', segunda)).toBe('2026-09-09');
  });

  it('devolve o próprio dia quando a hora ainda não passou', () => {
    expect(proximaData('seg', '14:00', segunda)).toBe('2026-09-07');
  });

  it('pula para a semana seguinte quando a hora já passou', () => {
    expect(proximaData('seg', '09:00', segunda)).toBe('2026-09-14');
  });

  it('vira o mês quando necessário', () => {
    expect(proximaData('sab', '09:00', new Date(2026, 8, 28, 10, 0))).toBe('2026-10-03');
  });
});

describe('formatarDataLocal', () => {
  it('não muda o dia perto da meia-noite no fuso local', () => {
    expect(formatarDataLocal(new Date(2026, 8, 7, 23, 30))).toBe('2026-09-07');
  });
});

describe('somarHoras', () => {
  it('soma 48 horas', () => {
    const inicio = new Date(2026, 8, 7, 10, 0);
    expect(somarHoras(inicio, 48)).toEqual(new Date(2026, 8, 9, 10, 0));
  });
});
