import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../../services/auth.service';

/** Conveniência de navegação. A autorização real é feita pelo Spring em cada endpoint. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.carregarSessao().pipe(
    map((usuario) => usuario ? true : router.createUrlTree(['/entrar'], { queryParams: { voltar: state.url } })),
    catchError(() => of(router.createUrlTree(['/entrar'], { queryParams: { voltar: state.url, falha: 'sessao' } }))),
  );
};

export const visitanteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.carregarSessao().pipe(
    map((usuario) => usuario ? router.createUrlTree(['/inicio']) : true),
    // Uma indisponibilidade não impede ler a landing nem tentar entrar novamente.
    catchError(() => of(true)),
  );
};
