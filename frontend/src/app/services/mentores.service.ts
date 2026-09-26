import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import { CriteriosBusca } from '../models/busca';
import { Mentor, Recomendacao } from '../models/mentor';
import { materiasAlternativas, recomendarMentores } from '../shared/util/recomendacao';
import { MateriasService } from './materias.service';

@Injectable({ providedIn: 'root' })
export class MentoresService {
  private readonly http = inject(HttpClient);
  private readonly materiasService = inject(MateriasService);

  /** Endpoint privado: a sessão é enviada pelo navegador na mesma origem. */
  private readonly url = '/api/mentores';

  /** O servidor filtra verificação, consentimento e horários ocupados. */
  listarVerificados(): Observable<Mentor[]> { return this.http.get<Mentor[]>(this.url); }

  /**
   * Tela 4. Quando a API existir, vira GET /api/mentores/:id, e o servidor responde 404
   * para mentor não verificado. Emite `undefined` quando não encontra.
   */
  buscarPorId(id: string): Observable<Mentor | undefined> {
    return this.listarVerificados().pipe(map((lista) => lista.find((m) => m.id === id)));
  }

  /**
   * Tela 3. Quando a API existir, vira um GET /api/mentores/recomendados?materia=...
   * e a função pura `recomendarMentores` some junto com o mock.
   * Emite `undefined` quando a matéria não existe.
   */
  recomendar(criterios: CriteriosBusca): Observable<Recomendacao | undefined> {
    // forkJoin espera as duas requisições completarem e entrega as duas respostas juntas,
    // num objeto com as mesmas chaves. É o Promise.all do RxJS. Se uma falhar, o todo falha.
    return forkJoin({
      mentores: this.listarVerificados(),
      materias: this.materiasService.listar(),
    }).pipe(
      map(({ mentores, materias }) => {
        const materia = materias.find((m) => m.id === criterios.materiaId);
        if (!materia) {
          return undefined;
        }
        return {
          materia,
          ...recomendarMentores(mentores, criterios),
          alternativas: materiasAlternativas(mentores, materias, materia, criterios),
        };
      }),
    );
  }
}
