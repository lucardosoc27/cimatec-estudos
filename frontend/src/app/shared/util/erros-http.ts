import { HttpErrorResponse } from '@angular/common/http';

/**
 * O texto que a tela mostra para uma resposta de erro que ela não trata de forma especial.
 *
 * - Sem resposta (status 0: rede caiu, servidor parado) ou erro do servidor (5xx): o texto da
 *   própria tela, do tipo "verifique sua conexão e tente de novo".
 * - Qualquer outro 4xx (o 400 de validação, sobretudo): a mensagem que o servidor escreveu, que
 *   diz o que está errado no pedido. Mandar a pessoa conferir a conexão, nesse caso, é mentira.
 * - 4xx sem mensagem legível: o texto da tela, como reserva.
 */
export function mensagemDoErro(erro: Pick<HttpErrorResponse, 'status' | 'error'>, textoDaTela: string): string {
  if (erro.status === 0 || erro.status >= 500) return textoDaTela;
  const doServidor: unknown = erro.error?.message;
  return typeof doServidor === 'string' && doServidor.trim() ? doServidor : textoDaTela;
}
