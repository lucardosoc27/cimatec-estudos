import { DiaSemana } from '../../models/disponibilidade';

/** Índice de cada dia no padrão de `Date.getDay()`, em que domingo é 0. */
const INDICE_DIA: Record<DiaSemana, number> = { seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };

/**
 * Próxima data ('YYYY-MM-DD') em que cai o dia da semana informado, contando a partir de `referencia`.
 * Se `referencia` já for esse dia e a hora ainda não passou, devolve o próprio dia.
 */
export function proximaData(dia: DiaSemana, hora: string, referencia: Date = new Date()): string {
  const [hh, mm] = hora.split(':').map(Number);
  const candidata = new Date(referencia);
  candidata.setHours(hh, mm, 0, 0);

  let diasAFrente = (INDICE_DIA[dia] - referencia.getDay() + 7) % 7;
  if (diasAFrente === 0 && candidata.getTime() <= referencia.getTime()) {
    diasAFrente = 7;
  }
  candidata.setDate(candidata.getDate() + diasAFrente);
  return formatarDataLocal(candidata);
}

/**
 * 'YYYY-MM-DD' no fuso local. Não usar `toISOString().slice(0, 10)`: ele converte para UTC,
 * e às 22h em Salvador (UTC-3) já seria o dia seguinte.
 */
export function formatarDataLocal(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const diaMes = String(d.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${diaMes}`;
}

export function somarHoras(d: Date, horas: number): Date {
  return new Date(d.getTime() + horas * 60 * 60 * 1000);
}

/** `data` ('YYYY-MM-DD') e `hora` ('HH:mm') como um só Date no fuso local, para comparar com "agora". */
export function dataHora(data: string, hora: string): Date {
  const [ano, mes, dia] = data.split('-').map(Number);
  const [hh, mm] = hora.split(':').map(Number);
  return new Date(ano, mes - 1, dia, hh, mm, 0, 0);
}
