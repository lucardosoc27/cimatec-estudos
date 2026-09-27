import { formatDate } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

import { maiusculaInicial } from './util/formatacao';

/**
 * "Segunda-feira, 28/09": o dia e a data que abrem uma linha. É o único lugar que formata assim.
 * No meio da frase ("o mentor tem até segunda-feira…") continua o DatePipe, em minúscula.
 */
@Pipe({ name: 'diaEData' })
export class DiaEDataPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(data: string | Date): string {
    return maiusculaInicial(formatDate(data, 'EEEE, dd/MM', this.locale));
  }
}
