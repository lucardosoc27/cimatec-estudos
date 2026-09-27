import { Injectable, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/**
 * Título da aba e anúncio da troca de tela, num lugar só.
 *
 * Numa aplicação Angular a página não recarrega: quem enxerga vê a tela mudar, mas quem usa
 * leitor de tela não ouve nada ao ir de /inicio para /mentores. Esta classe substitui a
 * estratégia de título padrão do Angular (TitleStrategy): continua pondo o `title` de cada rota
 * na aba e, além disso, escreve "Página <nome>" no sinal `anuncio`. O app.html mostra esse sinal
 * numa região aria-live, que o leitor de tela lê sozinho quando o texto muda.
 *
 * Não anuncia na primeira carga (o leitor já lê o título da aba ao abrir a página) nem quando só
 * os parâmetros da URL mudam (a tela 2 grava os critérios na própria URL, e isso não é tela nova).
 */
@Injectable({ providedIn: 'root' })
export class TituloComAnuncio extends TitleStrategy {
  private readonly aba = inject(Title);
  readonly anuncio = signal('');
  private caminhoAnterior: string | null = null;

  override updateTitle(estado: RouterStateSnapshot): void {
    const titulo = this.buildTitle(estado);
    if (!titulo) return;
    this.aba.setTitle(titulo);

    const caminho = estado.url.split(/[?#]/)[0];
    const primeiraCarga = this.caminhoAnterior === null;
    const mesmaTela = caminho === this.caminhoAnterior;
    this.caminhoAnterior = caminho;
    if (primeiraCarga || mesmaTela) return;

    // Esvazia antes e escreve depois: se duas telas seguidas tiverem o mesmo nome, o texto
    // ainda "muda", e o leitor anuncia de novo.
    this.anuncio.set('');
    setTimeout(() => this.anuncio.set(`Página ${titulo.split(' · ')[0]}`), 100);
  }
}
