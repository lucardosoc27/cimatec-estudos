import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { Avatar } from '../../../shared/avatar/avatar';

@Component({
  selector: 'app-cabecalho',
  imports: [RouterLink, RouterLinkActive, Avatar],
  templateUrl: './cabecalho.html',
  styleUrl: './cabecalho.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cabecalho {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly elemento = inject(ElementRef);
  private readonly gatilho = viewChild<ElementRef<HTMLButtonElement>>('gatilho');
  protected readonly aberto = signal(false);
  protected readonly saindo = signal(false);
  protected readonly erro = signal('');
  protected readonly caminho = signal(this.router.url);
  protected readonly primeiroNome = computed(() => this.auth.usuario()?.nome.trim().split(/\s+/)[0] ?? '');
  protected readonly pedindoAjuda = computed(() => /^\/(pedir-ajuda|mentores)(\/|\?|$)/.test(this.caminho()));
  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed()).subscribe(e => {
      this.caminho.set(e.urlAfterRedirects); this.aberto.set(false);
    });
  }
  protected alternar(): void { this.aberto.update(v => !v); }
  @HostListener('document:keydown.escape')
  protected fechar(): void {
    if (this.aberto()) { this.aberto.set(false); this.gatilho()?.nativeElement.focus(); }
  }
  @HostListener('document:click', ['$event'])
  protected clicarFora(event: MouseEvent): void {
    if (this.aberto() && !this.elemento.nativeElement.contains(event.target)) this.fechar();
  }
  protected sair(): void {
    if (this.saindo()) return;
    this.saindo.set(true); this.erro.set('');
    this.auth.sair().subscribe({
      next: () => { this.saindo.set(false); this.aberto.set(false); this.router.navigateByUrl('/entrar'); },
      error: () => { this.saindo.set(false); this.erro.set('Não foi possível sair. Tente novamente.'); },
    });
  }
}
