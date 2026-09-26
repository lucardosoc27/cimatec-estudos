import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, of, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { Usuario } from '../models/usuario';

export interface Cadastro {
  nome: string;
  email: string;
  senha: string;
  curso: string;
  termosEPolitica: boolean;
  fotoParaLogados: boolean;
  vitrinePublica: boolean;
}

export type ResultadoVerificacao = {
  estado: 'ativada' | 'expirado' | 'ja-usado' | 'invalido';
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private consultaSessao?: Observable<Usuario | null>;

  readonly usuario = signal<Usuario | null>(null);
  readonly carregado = signal(false);
  readonly emailParaVerificar = signal('');

  /** Só os dados de apresentação ficam na memória. A sessão pertence ao cookie HttpOnly. */
  carregarSessao(): Observable<Usuario | null> {
    if (this.carregado()) return of(this.usuario());
    if (this.consultaSessao) return this.consultaSessao;

    this.consultaSessao = this.http.get<Usuario>('/api/auth/eu').pipe(
      catchError((erro: HttpErrorResponse) =>
        erro.status === 401 ? of(null) : throwError(() => erro),
      ),
      tap((usuario) => {
        this.usuario.set(usuario);
        this.carregado.set(true);
      }),
      finalize(() => { this.consultaSessao = undefined; }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    return this.consultaSessao;
  }

  entrar(credenciais: { email: string; senha: string }): Observable<Usuario> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<Usuario>('/api/auth/login', credenciais)),
      tap((usuario) => {
        this.usuario.set(usuario);
        this.carregado.set(true);
      }),
    );
  }

  cadastrar(cadastro: Cadastro): Observable<void> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<void>('/api/auth/cadastro', cadastro)),
      tap(() => this.emailParaVerificar.set(cadastro.email)),
    );
  }

  verificar(token: string): Observable<ResultadoVerificacao> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<ResultadoVerificacao>('/api/auth/verificacao', { token })),
    );
  }

  reenviar(email: string): Observable<void> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<void>('/api/auth/reenviar', { email })),
      tap(() => this.emailParaVerificar.set(email)),
    );
  }

  sair(): Observable<void> {
    return this.csrf().pipe(
      switchMap(() => this.http.post<void>('/api/auth/logout', {})),
      tap(() => this.limparSessao()),
    );
  }

  atualizarConta(dados: { nome: string; curso: string }): Observable<Usuario> {
    return this.csrf().pipe(
      switchMap(() => this.http.patch<Usuario>('/api/conta', dados)),
      tap((usuario) => this.usuario.set(usuario)),
    );
  }

  atualizarConsentimentos(dados: { fotoParaLogados?: boolean; vitrinePublica?: boolean }): Observable<Usuario> {
    return this.csrf().pipe(
      switchMap(() => this.http.patch<Usuario>('/api/conta/consentimentos', dados)),
      tap((usuario) => this.usuario.set(usuario)),
    );
  }

  excluirConta(senha: string): Observable<void> {
    return this.csrf().pipe(
      switchMap(() => this.http.delete<void>('/api/conta', { body: { senha } })),
      tap(() => this.limparSessao()),
    );
  }

  limparSessao(): void {
    this.usuario.set(null);
    this.carregado.set(true);
    this.emailParaVerificar.set('');
  }

  /** O Angular envia X-XSRF-TOKEN nas mutações de URL relativa automaticamente. */
  private csrf(): Observable<unknown> {
    return this.http.get('/api/auth/csrf');
  }
}
