import { prisma, type Tx } from '../../db/postgres';
import { naoImplementado } from '../../shared/http-error';

/** Estoque no PostgreSQL (Prisma). Lido pelo catálogo, decrementado pelo checkout. */
export const EstoqueRepository = {
  async obterQuantidade(livroId: string): Promise<number> {
    // TODO: prisma.estoque.findUnique(...) -> quantidade (0 se não existir)
    naoImplementado('EstoqueRepository.obterQuantidade');
  },

  async obterQuantidades(livroIds: string[]): Promise<Map<string, number>> {
    // TODO: prisma.estoque.findMany({ where: { livroId: { in: livroIds } } })
    naoImplementado('EstoqueRepository.obterQuantidades');
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
    naoImplementado('EstoqueRepository.decrementar');
  },
};
