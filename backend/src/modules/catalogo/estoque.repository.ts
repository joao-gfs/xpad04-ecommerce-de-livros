import { prisma, type Tx } from '../../db/postgres';
import { naoImplementado } from '../../shared/http-error';

/** Estoque no PostgreSQL (Prisma). Lido pelo catálogo, decrementado pelo checkout. */
export const EstoqueRepository = {
  async obterQuantidade(livroId: string): Promise<number> {
    const estoque = await prisma.estoque.findUnique({ where: { livroId } });
    return estoque?.quantidade ?? 0;
  },

  async obterQuantidades(livroIds: string[]): Promise<Map<string, number>> {
    const linhas = await prisma.estoque.findMany({
      where: { livroId: { in: livroIds } },
    });
    return new Map(linhas.map((l) => [l.livroId, l.quantidade]));
  },

  /**
   * Decrementa só se houver estoque suficiente. Deve rodar DENTRO da transação do checkout (tx).
   * Retorna false se não havia estoque (aí o service aborta a transação).
   *
   * Dica: tx.estoque.updateMany({ where: { livroId, quantidade: { gte: qtd } },
   *                              data: { quantidade: { decrement: qtd } } })
   *       e verificar se count === 1. Isso evita condição de corrida entre dois checkouts.
   */
  async decrementar(tx: Tx, livroId: string, quantidade: number): Promise<boolean> {
    const { count } = await tx.estoque.updateMany({
      where: { livroId, quantidade: { gte: quantidade } },
      data: { quantidade: { decrement: quantidade } },
    });
    return count === 1;
  },
};
