import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CURSOS } from '../../models/curso';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  imports: [FormsModule, RouterLink],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Auth {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cursos = CURSOS;
  protected readonly cadastro = signal(this.route.snapshot.routeConfig?.path === 'cadastro');
  protected readonly nome = signal('');
  protected readonly curso = signal('');
  protected readonly email = signal('');
  protected readonly senha = signal('');
  protected readonly confirmacao = signal('');
  protected readonly termos = signal(false);
  protected readonly foto = signal(false);
  protected readonly vitrine = signal(false);
  protected readonly mostrarSenha = signal(false);
  protected readonly tentou = signal(false);
  protected readonly enviando = signal(false);
  protected readonly erro = signal(this.route.snapshot.queryParamMap.get('falha') === 'sessao'
    ? 'Não foi possível conferir sua sessão. Verifique a conexão e tente entrar novamente.' : '');
  protected readonly recuperacao = signal(false);
  protected readonly animar = signal(true);
  protected readonly bloqueadoAte = signal(0);
  protected readonly segundos = signal(0);
  protected readonly tentativas = signal(0);
  protected readonly regras = computed(() => [
    { texto: '8 caracteres ou mais', atendida: this.senha().length >= 8 },
    { texto: 'Pelo menos uma letra', atendida: /[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(this.senha()) },
    { texto: 'Pelo menos um número', atendida: /\d/.test(this.senha()) },
  ]);
  protected readonly senhaValida = computed(() => this.regras().every((regra) => regra.atendida));
  protected readonly voltar = this.route.snapshot.queryParamMap.get('voltar');

  constructor() {
    const relogio = setInterval(() => {
      this.segundos.set(Math.max(0, Math.ceil((this.bloqueadoAte() - Date.now()) / 1000)));
    }, 1000);
    this.destroyRef.onDestroy(() => clearInterval(relogio));
  }

  protected enviar(form: NgForm): void {
    if (this.enviando() || this.segundos() > 0) return;
    this.tentou.set(true);
    this.erro.set('');
    if (form.invalid || (this.cadastro() && (!this.senhaValida() || this.senha() !== this.confirmacao()))) {
      form.control.markAllAsTouched();
      this.erro.set('Confira os campos indicados antes de continuar.');
      this.focarErro();
      return;
    }

    this.enviando.set(true);
    if (this.cadastro()) {
      this.auth.cadastrar({
        nome: this.nome().trim(), curso: this.curso(), email: this.email().trim(), senha: this.senha(),
        termosEPolitica: this.termos(), fotoParaLogados: this.foto(), vitrinePublica: this.vitrine(),
      }).pipe(finalize(() => this.enviando.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => { void this.router.navigate(['/verificar-email']); },
        error: (erro: HttpErrorResponse) => {
          this.erro.set(erro.status === 0 || erro.status >= 500
            ? 'Não foi possível criar sua conta agora. Seus dados foram mantidos; tente novamente.'
            : erro.error?.message || 'Confira seus dados e tente criar a conta novamente.');
          this.focarErro();
        },
      });
      return;
    }

    this.auth.entrar({ email: this.email().trim(), senha: this.senha() }).pipe(
      finalize(() => this.enviando.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        const destino = this.voltar?.startsWith('/') && !this.voltar.startsWith('//') ? this.voltar : '/inicio';
        void this.router.navigateByUrl(destino);
      },
      error: (erro: HttpErrorResponse) => {
        if (erro.status === 429) {
          const espera = Number(erro.headers.get('Retry-After'));
          const segundos = Number.isFinite(espera) && espera > 0 ? Math.min(espera, 3600) : 60;
          this.bloqueadoAte.set(Date.now() + segundos * 1000);
          this.segundos.set(segundos);
          this.erro.set('Muitas tentativas. Aguarde antes de tentar novamente.');
        } else if (erro.status === 0 || erro.status >= 500) {
          this.erro.set('Não foi possível entrar agora. Verifique sua conexão e tente novamente.');
        } else {
          this.tentativas.update((valor) => valor + 1);
          this.erro.set('e-mail ou senha inválidos');
        }
        this.focarErro();
      },
    });
  }

  protected repetirAnimacao(): void {
    this.animar.set(false);
    setTimeout(() => this.animar.set(true), 30);
  }

  private focarErro(): void {
    setTimeout(() => document.getElementById('auth-erro')?.focus());
  }
}
