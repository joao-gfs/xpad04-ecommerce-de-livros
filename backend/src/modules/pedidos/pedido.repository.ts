import type { Pedido, ItemPedido } from '@prisma/client';
import { prisma, type Tx } from '../../db/postgres';
import { naoImplementado } from '../../shared/http-error';

export type PedidoComItens = Pedido & { itens: ItemPedido[] };

export interface NovoPedido {
  usuarioId: string;
  total: number;
  itens: { livroId: string; titulo: string; precoUnitario: number; quantidade: number }[];
}

/** Pedidos no PostgreSQL (Prisma). */
export const PedidoRepository = {
  /** Roda dentro da transação do checkout. */
  async criar(tx: Tx, dados: NovoPedido): Promise<PedidoComItens> {
    // TODO: tx.pedido.create({ data: { ..., itens: { create: dados.itens } }, include: { itens: true } })
    naoImplementado('PedidoRepository.criar');
  },

  async listarPorUsuario(usuarioId: string): Promise<PedidoComItens[]> {
    // TODO: prisma.pedido.findMany({ where: { usuarioId }, include: { itens: true }, orderBy: { criadoEm: 'desc' } })
    naoImplementado('PedidoRepository.listarPorUsuario');
  },

  async buscarPorId(pedidoId: string): Promise<PedidoComItens | null> {
    naoImplementado('PedidoRepository.buscarPorId');
  },
};
