import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';

type EstadoVerificacao = 'enviamos' | 'confirmar' | 'ativada' | 'expirado' | 'ja-usado' | 'invalido';

@Component({
  selector: 'app-verificar-email',
  imports: [FormsModule, RouterLink],
  templateUrl: './verificar-email.html',
  styleUrl: './verificar-email.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificarEmail {
  private readonly auth = inject(AuthService);
  private readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');
  private readonly destroyRef = inject(DestroyRef);

  protected readonly estado = signal<EstadoVerificacao>(this.token ? 'confirmar' : 'enviamos');
  protected readonly email = signal(this.auth.emailParaVerificar());
  protected readonly ocupado = signal(false);
  protected readonly erro = signal('');
  protected readonly mensagem = signal('');
  protected readonly tentou = signal(false);
  protected readonly informarEmail = signal(!this.email());

  protected verificar(): void {
    if (this.ocupado() || !this.token) return;
    this.ocupado.set(true);
    this.erro.set('');
    this.auth.verificar(this.token).pipe(
      finalize(() => this.ocupado.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (resultado) => {
        this.estado.set(resultado.estado);
        this.focarTitulo();
      },
      error: (erro: HttpErrorResponse) => {
        if (erro.status === 400 || erro.status === 404) this.estado.set('invalido');
        else if (erro.status === 410) this.estado.set('expirado');
        else this.erro.set('Não foi possível confirmar seu e-mail agora. Tente novamente.');
      },
    });
  }

  protected reenviar(form?: NgForm): void {
    if (this.ocupado()) return;
    this.tentou.set(true);
    this.erro.set('');
    this.mensagem.set('');
    if (!this.email() || form?.invalid) {
      this.informarEmail.set(true);
      form?.control.markAllAsTouched();
      return;
    }
    this.ocupado.set(true);
    this.auth.reenviar(this.email().trim()).pipe(
      finalize(() => this.ocupado.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.mensagem.set('Se houver uma conta aguardando confirmação para esse e-mail, um novo link será enviado. Confira também a caixa de spam.');
      },
      error: (erro: HttpErrorResponse) => {
        this.erro.set(erro.status === 429
          ? 'Aguarde um pouco antes de pedir outro link.'
          : 'Não foi possível reenviar agora. Seu e-mail foi mantido; tente novamente.');
      },
    });
  }

  private focarTitulo(): void {
    setTimeout(() => document.getElementById('titulo-verificacao')?.focus());
  }
}
