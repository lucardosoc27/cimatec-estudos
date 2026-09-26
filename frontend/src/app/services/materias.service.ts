import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Materia } from '../models/materia';

@Injectable({ providedIn: 'root' })
export class MateriasService {
  private readonly http = inject(HttpClient);

  /** Catálogo de matérias: não contém dados pessoais. */
  private readonly url = '/api/materias';

  listar(): Observable<Materia[]> {
    return this.http.get<Materia[]>(this.url);
  }
}
