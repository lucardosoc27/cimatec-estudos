import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Params, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { CriteriosBusca, criteriosValidos, deQueryParams, paramsDeCriterios, paraQueryParams } from '../../models/busca';
import { ROTULO_MODALIDADE, ROTULO_TURNO } from '../../models/disponibilidade';
import { Recomendacao } from '../../models/mentor';
import { MentoresService } from '../../services/mentores.service';
import { EstadoTela } from '../../shared/estado-tela';
import { cursoSemestre } from '../../shared/util/formatacao';

@Component({
  selector: 'app-mentores',
  imports: [RouterLink],
  templateUrl: './mentores.html',
  styleUrl: './mentores.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Mentores {
  private readonly mentoresService = inject(MentoresService);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Busca em andamento. Guardada para ser cancelada se os critérios mudarem antes da resposta. */
  private buscaAtual?: Subscription;

  protected readonly estado = signal<EstadoTela>('carregando');
  protected readonly resultado = signal<Recomendacao | null>(null);
  protected readonly criterios = signal<CriteriosBusca | null>(null);

  /** Os mesmos critérios em forma de query params, para os links "Voltar" e "Ver perfil". */
  protected readonly queryParams = computed<Params>(() => paramsDeCriterios(this.criterios()));

  protected readonly cursoSemestre = cursoSemestre;

  /** "tarde, noite · online", para o aluno saber o que está vendo. */
  protected readonly resumoCriterios = computed(() => {
    const c = this.criterios();
    if (!c) {
      return '';
    }
    return [c.turnos.map((t) => ROTULO_TURNO[t]).join(', '), c.modalidade && ROTULO_MODALIDADE[c.modalidade]]
      .filter(Boolean)
      .join(' · ');
  });

  constructor() {
    // A URL pode mudar com a tela aberta (links de "outras matérias" apontam para esta
    // mesma rota). Por isso assino o Observable em vez de tirar uma foto no snapshot.
    // O Observable do router nunca completa: takeUntilDestroyed cancela ao sair da tela.
    this.rota.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.aplicarCriterios(params));

    // A busca HTTP também não pode sobreviver à tela: uma resposta atrasada
    // poderia disparar um redirecionamento depois de o aluno já ter saído.
    this.destroyRef.onDestroy(() => this.buscaAtual?.unsubscribe());
  }

  /** Query params para esta mesma tela com outra matéria (links de "matérias parecidas"). */
  protected paramsPara(materiaId: string): Params {
    const c = this.criterios();
    return c ? paraQueryParams({ ...c, materiaId }) : { materia: materiaId };
  }

  private aplicarCriterios(params: ParamMap): void {
    const criterios = criteriosValidos(deQueryParams(params));
    if (!criterios) {
      // Sem matéria ou sem turno não há o que recomendar: a tela 2 sabe explicar o que falta.
      // replaceUrl tira a URL inválida do histórico, senão o "voltar" cairia nela de novo.
      this.router.navigate(['/pedir-ajuda'], { queryParams: this.rota.snapshot.queryParams, replaceUrl: true });
      return;
    }
    this.criterios.set(criterios);
    this.carregar();
  }

  protected carregar(): void {
    const criterios = this.criterios();
    if (!criterios) {
      return;
    }
    // Cancela a busca anterior: se os critérios mudaram, a resposta antiga não interessa mais.
    this.buscaAtual?.unsubscribe();
    this.estado.set('carregando');
    this.resultado.set(null);
    this.buscaAtual = this.mentoresService.recomendar(criterios).subscribe({
      next: (resultado) => {
        if (!resultado) {
          this.router.navigate(['/pedir-ajuda'], { queryParams: this.queryParams(), replaceUrl: true });
          return;
        }
        this.resultado.set(resultado);
        this.estado.set(resultado.recomendados.length === 0 ? 'vazio' : 'sucesso');
      },
      error: () => this.estado.set('erro'),
    });
  }
}
