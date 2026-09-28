import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { TURNOS } from '../../models/busca';
import { CURSOS } from '../../models/curso';
import { ROTULO_TURNO, Turno } from '../../models/disponibilidade';
import { Materia } from '../../models/materia';
import { AuthService } from '../../services/auth.service';
import { MateriasService } from '../../services/materias.service';
import { PedidoRascunhoService, PedidoRascunho } from '../../services/pedido-rascunho.service';
import { EstadoTela } from '../../shared/estado-tela';
import { Icone } from '../../shared/icone/icone';

@Component({
  selector: 'app-pedir-ajuda',
  imports: [RouterLink, Icone],
  templateUrl: './pedir-ajuda.html',
  styleUrl: './pedir-ajuda.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedirAjuda {
  private readonly materiasService = inject(MateriasService);
  private readonly auth = inject(AuthService);
  private readonly rascunhos = inject(PedidoRascunhoService);
  private readonly router = inject(Router);
  protected readonly estado = signal<EstadoTela>('carregando');
  protected readonly materias = signal<Materia[]>([]);
  protected readonly formulario = this.rascunhos.rascunho;
  protected readonly cursos = CURSOS;
  protected readonly opcoesTurno = TURNOS;
  protected readonly rotuloTurno = ROTULO_TURNO;
  protected readonly necessidades = ['Entender o conteúdo', 'Resolver exercícios', 'Revisar para a prova'];
  protected readonly tentouEnviar = signal(false);
  protected readonly semestres = computed(() => Array.from({ length: CURSOS.find(c => c.nome === this.formulario()?.curso)?.semestres ?? 4 }, (_, i) => i + 1));
  protected readonly materiasFiltradas = computed(() => this.materias().filter(m => m.curso === this.formulario()?.curso && m.semestre === this.formulario()?.semestre));
  protected readonly faltaMateria = computed(() => !this.formulario()?.materiaId);
  protected readonly faltaTurno = computed(() => !this.formulario()?.turnos.length);

  constructor() {
    if (!this.formulario()) this.rascunhos.definir({
      curso: this.auth.usuario()?.curso ?? CURSOS[0].nome,
      semestre: 1, materiaId: null, necessidade: null, turnos: [], modalidade: 'ambos', mentorId: null, horarioId: null,
    });
    this.carregar();
  }

  protected carregar(): void {
    this.estado.set('carregando');
    this.materiasService.listar().subscribe({
      next: lista => {
        this.materias.set(lista);
        this.estado.set(lista.length ? 'sucesso' : 'vazio');
      },
      error: () => this.estado.set('erro'),
    });
  }

  protected atualizar(campos: Partial<PedidoRascunho>): void {
    this.rascunhos.atualizar({ ...campos, mentorId: null, horarioId: null });
  }

  protected trocarCurso(evento: Event): void {
    this.atualizar({ curso: (evento.target as HTMLSelectElement).value, semestre: 1, materiaId: null });
  }

  protected alternarTurno(turno: Turno): void {
    const atuais = this.formulario()?.turnos ?? [];
    this.atualizar({ turnos: TURNOS.filter(t => t === turno ? !atuais.includes(t) : atuais.includes(t)) });
  }

  protected enviar(evento: Event): void {
    evento.preventDefault();
    this.tentouEnviar.set(true);
    if (this.faltaMateria() || this.faltaTurno()) return;
    this.router.navigate(['/mentores']);
  }
}
