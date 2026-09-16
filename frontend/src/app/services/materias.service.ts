import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Materia } from '../models/materia';

@Injectable({ providedIn: 'root' })
export class MateriasService {
  private readonly http = inject(HttpClient);

  /** Quando a API existir, vira '/api/materias'. */
  private readonly url = 'assets/materias.json';

  listar(): Observable<Materia[]> {
    return this.http.get<Materia[]>(this.url);
  }
}
