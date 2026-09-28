import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Avatar } from '../../../shared/avatar/avatar';
import { Icone } from '../../../shared/icone/icone';

/**
 * O que a vitrine pública recebe de cada mentor. A foto vem null para quem não deu os dois
 * consentimentos (foto e vitrine), e aí o avatar mostra a inicial (DECISOES.md, 2026-09-28).
 */
interface MentorPublico {
  id: string;
  nome: string;
  foto: string | null;
  curso: string;
  descricao: string;
  materias?: string[];
}

type Estado = 'carregando' | 'sucesso' | 'erro';

/**
 * Vitrine da página inicial: os mentores que consentiram, num letreiro contínuo (maquete em
 * docs/telas/00-landing). Componente à parte da landing porque é uma unidade inteira (carrega os
 * dados, tem os quatro estados e os controles) e para o CSS de cada um caber no limite do build.
 *
 * Quem anda é o CSS (vitrine.scss, @keyframes letreiro). Aqui fica só o que a pessoa escolhe; o
 * ponteiro em cima e o foco dentro também param a faixa, mas isso é CSS puro (:hover e :focus-within).
 */
@Component({
  selector: 'app-vitrine',
  imports: [RouterLink, Avatar, Icone],
  templateUrl: './vitrine.html',
  styleUrl: './vitrine.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vitrine {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly mentores = signal<MentorPublico[]>([]);
  readonly estadoVitrine = signal<Estado>('carregando');
  /** Parada pelo botão. Começa parada para quem pediu menos movimento no sistema. */
  readonly pausado = signal(matchMedia('(prefers-reduced-motion: reduce)').matches);
  /**
   * Com menos movimento pedido, a animação nem existe até a pessoa apertar Continuar: aí ela
   * escolheu o movimento, e o CSS devolve a animação só para ela.
   */
  readonly escolheuMovimento = signal(false);
  private readonly faixa = viewChild<ElementRef<HTMLElement>>('faixa');

  constructor() {
    this.carregarVitrine();
  }

  carregarVitrine(): void {
    this.estadoVitrine.set('carregando');
    // A API filtra o consentimento público e já omite os dados privados do mentor.
    this.http.get<MentorPublico[]>('/api/vitrine').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: mentores => {
        this.mentores.set(mentores);
        this.estadoVitrine.set('sucesso');
      },
      error: () => this.estadoVitrine.set('erro'),
    });
  }

  alternarPausa(): void {
    if (this.pausado()) this.escolheuMovimento.set(true);
    this.pausado.update(pausado => !pausado);
  }

  /** Setas: rolam a faixa um cartão e pouco para o lado, com rolagem suave (instantânea para quem pediu menos movimento). */
  rolar(direcao: 1 | -1): void {
    const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.faixa()?.nativeElement.scrollBy({ left: direcao * 320, behavior: semMovimento ? 'auto' : 'smooth' });
  }

  primeiroNome(nome: string): string {
    return nome.trim().split(/\s+/)[0] || 'Mentor';
  }
}
