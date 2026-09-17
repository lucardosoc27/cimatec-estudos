import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CriteriosBusca, MODALIDADES, TURNOS, deQueryParams, paraQueryParams } from '../../models/busca';
import { Modalidade, ROTULO_MODALIDADE, ROTULO_TURNO, Turno } from '../../models/disponibilidade';
import { Materia } from '../../models/materia';
import { MateriasService } from '../../services/materias.service';
import { EstadoTela } from '../../shared/estado-tela';

/** 'qualquer' é a opção "Tanto faz" da tela; na URL ela vira ausência de modalidade. */
type EscolhaModalidade = Modalidade | 'qualquer';

@Component({
  selector: 'app-pedir-ajuda',
  imports: [RouterLink],
  templateUrl: './pedir-ajuda.html',
  styleUrl: './pedir-ajuda.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedirAjuda {
  private readonly materiasService = inject(MateriasService);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly estado = signal<EstadoTela>('carregando');
  protected readonly materias = signal<Materia[]>([]);

  // Estado do formulário. Cada campo é um signal; o DOM só reflete esse estado.
  protected readonly materiaId = signal<string | null>(null);
  protected readonly turnos = signal<Turno[]>([]);
  protected readonly modalidade = signal<EscolhaModalidade>('qualquer');
  /** Só mostramos "o que falta" depois da primeira tentativa, para não gritar com quem acabou de abrir a tela. */
  protected readonly tentouEnviar = signal(false);

  protected readonly faltaMateria = computed(() => this.materiaId() === null);
  protected readonly faltaTurno = computed(() => this.turnos().length === 0);
  protected readonly podeEnviar = computed(() => !this.faltaMateria() && !this.faltaTurno());

  protected readonly opcoesTurno = TURNOS;
  protected readonly rotuloTurno = ROTULO_TURNO;
  protected readonly opcoesModalidade: { valor: EscolhaModalidade; rotulo: string }[] = [
    { valor: 'qualquer', rotulo: 'Tanto faz' },
    ...MODALIDADES.map((m) => ({ valor: m, rotulo: ROTULO_MODALIDADE[m] })),
  ];

  constructor() {
    // Pré-preenche com o que veio na URL: é o "voltar sem perder dados" da tela 3.
    const iniciais = deQueryParams(this.rota.snapshot.queryParamMap);
    this.materiaId.set(iniciais.materiaId ?? null);
    this.turnos.set(iniciais.turnos ?? []);
    this.modalidade.set(iniciais.modalidade ?? 'qualquer');

    this.carregar();
  }

  protected carregar(): void {
    this.estado.set('carregando');
    this.materiasService.listar().subscribe({
      next: (lista) => {
        this.materias.set(lista);
        // Id de matéria que veio na URL mas não existe na lista é descartado.
        if (!lista.some((m) => m.id === this.materiaId())) {
          this.materiaId.set(null);
        }
        this.estado.set(lista.length === 0 ? 'vazio' : 'sucesso');
      },
      error: () => this.estado.set('erro'),
    });
  }

  protected escolherMateria(id: string): void {
    this.materiaId.set(id);
  }

  /** Sempre gera um array novo, na ordem canônica dos turnos: signal só reage a referência nova. */
  protected alternarTurno(turno: Turno): void {
    this.turnos.update((atuais) =>
      TURNOS.filter((t) => (t === turno ? !atuais.includes(t) : atuais.includes(t))),
    );
  }

  protected escolherModalidade(valor: EscolhaModalidade): void {
    this.modalidade.set(valor);
  }

  protected async enviar(evento: Event): Promise<void> {
    evento.preventDefault();
    this.tentouEnviar.set(true);
    if (!this.podeEnviar()) {
      return;
    }

    const criterios: CriteriosBusca = {
      materiaId: this.materiaId()!,
      turnos: this.turnos(),
      modalidade: this.modalidade() === 'qualquer' ? undefined : (this.modalidade() as Modalidade),
    };
    const queryParams = paraQueryParams(criterios);

    // Grava o preenchimento na URL desta tela, sem criar entrada nova no histórico,
    // para o "voltar" do navegador reabrir a tela já preenchida.
    await this.router.navigate([], { relativeTo: this.rota, queryParams, replaceUrl: true });
    await this.router.navigate(['/mentores'], { queryParams });
  }
}
