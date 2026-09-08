/**
 * Sessão marcada a partir de um pedido aceito.
 * Não tem tela própria no MVP. Existe no modelo porque a regra de reputação depende dela:
 * só conta sessão confirmada pelos DOIS lados.
 */
export interface Sessao {
  id: string;
  pedidoId: string;
  localOuLink: string;
  situacao: 'marcada' | 'concluida' | 'cancelada';
  confirmadaPeloAluno: boolean;
  confirmadaPeloMentor: boolean;
}
