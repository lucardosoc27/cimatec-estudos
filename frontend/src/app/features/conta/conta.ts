import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { HttpErrorResponse } from '@angular/common/http';

import { CURSOS } from '../../models/curso';
import { AuthService } from '../../services/auth.service';
import { MentoresService } from '../../services/mentores.service';

type Consentimento = 'fotoParaLogados' | 'vitrinePublica';

/**
 * Minha conta: existe para os direitos do titular (ver, corrigir, retirar consentimento, excluir)
 * terem um caminho no sistema. Quem decide e grava é o servidor; esta tela só pede.
 */
@Component({
  selector: 'app-conta',
  imports: [DatePipe, RouterLink],
  templateUrl: './conta.html',
  styleUrl: './conta.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Conta {
  private readonly auth = inject(AuthService);
  private readonly mentores = inject(MentoresService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // O guard já carregou a sessão: o usuário vem do signal do serviço, sem nova requisição.
  protected readonly usuario = this.auth.usuario;
  protected readonly cursos = CURSOS;

  // Seus dados. Cópia editável: um erro ao salvar não apaga o que foi digitado.
  protected readonly nome = signal(this.usuario()?.nome ?? '');
  protected readonly curso = signal(this.usuario()?.curso ?? '');
  protected readonly tentouSalvar = signal(false);
  protected readonly salvando = signal(false);
  protected readonly resultadoDados = signal<'salvo' | 'erro' | null>(null);

  // Consentimentos: qual chave está gravando e se a última falhou.
  protected readonly gravando = signal<Consentimento | null>(null);
  protected readonly erroConsentimento = signal(false);

  // Mentoria: separada dos consentimentos, porque não é dado pessoal exposto, é um papel.
  protected readonly gravandoMentoria = signal(false);
  protected readonly erroMentoria = signal(false);
  // Com a chave ligada: a pessoa já aparece na busca? Depende de ter matérias cadastradas.
  // null = chave desligada, não há o que conferir.
  protected readonly naBusca = signal<'carregando' | 'sem-materias' | 'aparece' | 'erro' | null>(null);

  constructor() {
    if (this.usuario()?.papeis.includes('mentor')) this.conferirBusca();
  }

  // Exclusão: a senha fica no signal para sobreviver a um erro.
  protected readonly senha = signal('');
  protected readonly excluindo = signal(false);
  protected readonly erroExclusao = signal(false);

  private readonly janela = viewChild<ElementRef<HTMLDialogElement>>('janelaExcluir');
  private readonly botaoExcluir = viewChild<ElementRef<HTMLElement>>('botaoExcluir');

  protected salvarDados(): void {
    this.tentouSalvar.set(true);
    if (!this.nome().trim() || !this.curso()) {
      // O erro está escrito junto do campo (aria-describedby). Levar o foco até ele é o que faz o
      // leitor de tela ler "Nome, inválido, Conte como quer ser chamado(a)"; sem isso, nada é dito.
      setTimeout(() => document.getElementById(!this.nome().trim() ? 'nome' : 'curso')?.focus());
      return;
    }
    if (this.salvando()) return;
    this.salvando.set(true);
    this.resultadoDados.set(null);
    this.auth.atualizarConta({ nome: this.nome().trim(), curso: this.curso() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.salvando.set(false); this.resultadoDados.set('salvo'); },
        error: () => { this.salvando.set(false); this.resultadoDados.set('erro'); },
      });
  }

  /** Desligar tem efeito imediato. Se o servidor recusar, a chave volta a mostrar o valor gravado. */
  protected alternar(consentimento: Consentimento, evento: Event): void {
    const caixa = evento.target as HTMLInputElement;
    this.gravando.set(consentimento);
    this.erroConsentimento.set(false);
    this.auth.atualizarConsentimentos({ [consentimento]: caixa.checked })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.gravando.set(null),
        error: () => {
          caixa.checked = !caixa.checked;
          this.gravando.set(null);
          this.erroConsentimento.set(true);
        },
      });
  }

  /**
   * Ligar ou desligar "Quero receber pedidos de ajuda". Mesmo comportamento das chaves de
   * privacidade: se o servidor recusar, a chave volta ao valor anterior e a tela avisa.
   */
  protected alternarMentoria(evento: Event): void {
    const caixa = evento.target as HTMLInputElement;
    this.gravandoMentoria.set(true);
    this.erroMentoria.set(false);
    this.auth.atualizarMentoria(caixa.checked)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (usuario) => {
          this.gravandoMentoria.set(false);
          if (usuario.papeis.includes('mentor')) this.conferirBusca();
          else this.naBusca.set(null);
        },
        error: () => {
          caixa.checked = !caixa.checked;
          this.gravandoMentoria.set(false);
          this.erroMentoria.set(true);
        },
      });
  }

  /** 404 do perfil de mentor = ainda sem matérias cadastradas, então fora da busca. */
  private conferirBusca(): void {
    this.naBusca.set('carregando');
    this.mentores.meuPerfil()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.naBusca.set('aparece'),
        error: (erro: HttpErrorResponse) => this.naBusca.set(erro.status === 404 ? 'sem-materias' : 'erro'),
      });
  }

  /** <dialog> com showModal() prende o foco dentro da janela e fecha com Esc, sem código extra. */
  protected abrirExclusao(): void {
    this.erroExclusao.set(false);
    this.janela()?.nativeElement.showModal();
  }

  protected fecharExclusao(): void {
    if (this.excluindo()) return;
    this.janela()?.nativeElement.close();
  }

  /** Evento "close" do <dialog>: vale para Esc, "Cancelar" e fechamento por código. */
  protected aoFecharJanela(): void {
    this.botaoExcluir()?.nativeElement.focus();
  }

  protected excluir(): void {
    if (!this.senha() || this.excluindo()) {
      this.erroExclusao.set(!this.senha());
      return;
    }
    this.excluindo.set(true);
    this.erroExclusao.set(false);
    this.auth.excluirConta(this.senha())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.excluindo.set(false);
          this.janela()?.nativeElement.close();
          this.router.navigateByUrl('/');
        },
        error: () => { this.excluindo.set(false); this.erroExclusao.set(true); },
      });
  }
}
