import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone/icone';

@Component({
  selector: 'app-termos',
  imports: [RouterLink, Icone],
  templateUrl: './termos.html',
  styleUrl: './termos.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Termos {
  readonly indiceAberto = signal(false);
  readonly partes = [
    {
      id: 'termos-de-uso', titulo: '1. Termos de Uso',
      secoes: [
        { id: 'sobre-o-projeto', titulo: 'O que é o Cimatec Estudos' },
        { id: 'quem-pode-usar', titulo: 'Quem pode usar' },
        { id: 'convivencia', titulo: 'Regras de convivência' },
        { id: 'encontros', titulo: 'Encontros e sessões' },
        { id: 'cancelamento', titulo: 'Cancelamento e exclusão da conta' },
      ],
    },
    {
      id: 'privacidade', titulo: '2. Política de Privacidade',
      secoes: [
        { id: 'dados-coletados', titulo: 'Quais dados coletamos' },
        { id: 'uso-dos-dados', titulo: 'Para que usamos' },
        { id: 'compartilhamento', titulo: 'Com quem compartilhamos' },
        { id: 'retencao', titulo: 'Por quanto tempo guardamos' },
        { id: 'direitos', titulo: 'Seus direitos' },
        { id: 'menores-de-idade', titulo: 'Estudantes menores de idade' },
        { id: 'protecao', titulo: 'Como protegemos seus dados' },
        { id: 'contato', titulo: 'Fale com a gente' },
      ],
    },
  ];
}
