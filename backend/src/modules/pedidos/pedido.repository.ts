import type { ItemPedido, Pagamento, Pedido } from '@prisma/client';
import { prisma, type Tx } from '../../db/postgres';
import type { MetodoPagamento, StatusPagamento, StatusPedido } from './pedido.types';

export type PedidoCompleto = Pedido & { itens: ItemPedido[]; pagamento: Pagamento | null };

export interface NovoPedido {
  usuarioId: number;
  status: StatusPedido;
  total: number;
  itens: { livroId: string; precoUnitario: number; quantidade: number }[];
  pagamento: { metodo: MetodoPagamento; valor: number; status: StatusPagamento };
}

/** Pedidos, itens e pagamento no PostgreSQL (Prisma). */
export const PedidoRepository = {
  /** Cria pedido + itens + pagamento num único INSERT aninhado. Roda dentro da transação do checkout. */
  async criar(tx: Tx, dados: NovoPedido): Promise<PedidoCompleto> {
    return tx.pedido.create({
      data: {
        usuarioId: dados.usuarioId,
        status: dados.status,
        total: dados.total,
        itens: { create: dados.itens },
        pagamento: { create: dados.pagamento },
      },
      include: { itens: true, pagamento: true },
    });
  },

  async listarPorUsuario(usuarioId: number): Promise<PedidoCompleto[]> {
    return prisma.pedido.findMany({
      where: { usuarioId },
      include: { itens: true, pagamento: true },
      orderBy: { criadoEm: 'desc' },
    });
  },

  async buscarPorId(pedidoId: number): Promise<PedidoCompleto | null> {
    return prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { itens: true, pagamento: true },
    });
  },
};
