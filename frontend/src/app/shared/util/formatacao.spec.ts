import { cursoSemestre } from './formatacao';

describe('cursoSemestre', () => {
  it('mostra o número do semestre com o curso', () => {
    expect(cursoSemestre({ semestre: 5, curso: 'Desenvolvimento de Sistemas' }))
      .toBe('5º semestre · Desenvolvimento de Sistemas');
  });

  it('mostra "Egresso" quando o semestre é null', () => {
    expect(cursoSemestre({ semestre: null, curso: 'Análise e Desenvolvimento' }))
      .toBe('Egresso · Análise e Desenvolvimento');
  });
});
