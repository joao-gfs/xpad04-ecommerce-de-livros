import { prisma } from '../../db/postgres';
import { naoImplementado } from '../../shared/http-error';
import { CarrinhoRepository } from '../carrinho/carrinho.repository';
import { EstoqueRepository } from '../catalogo/estoque.repository';
import { LivroRepository } from '../catalogo/livro.repository';
import { PedidoRepository, type PedidoCompleto } from './pedido.repository';
import type { MetodoPagamento, StatusPagamento, StatusPedido } from './pedido.types';

/**
 * Formato que a API devolve. item_pedido no Postgres não guarda título:
 * o service completa titulo/capaUrl buscando os livros no MongoDB (LivroRepository.buscarPorIds).
 * Se o livro sumiu do catálogo, titulo vem null.
 */
export interface PedidoResposta {
  id: number;
  status: StatusPedido;
  total: number;
  criadoEm: Date;
  itens: {
    livroId: string;
    titulo: string | null;
    capaUrl: string | null;
    precoUnitario: number;
    quantidade: number;
    subtotal: number;
  }[];
  pagamento: { metodo: MetodoPagamento; valor: number; status: StatusPagamento } | null;
}

export const PedidoService = {
  /**
   * Checkout: o fluxo que coordena os três bancos.
   *
   *  1. Redis    -> CarrinhoRepository.obterItens(usuarioId). Vazio = HttpError(400).
   *  2. MongoDB  -> LivroRepository.buscarPorIds(ids) para pegar o preço atual (vira preco_unitario).
   *  3. Postgres -> prisma.$transaction(async (tx) => {
   *                   para cada item: EstoqueRepository.decrementar(tx, ...)
   *                     -> se false, lançar HttpError(409, 'Estoque insuficiente: <titulo>')
   *                        (lançar dentro do callback faz ROLLBACK de tudo)
   *                   PedidoRepository.criar(tx, { status: 'CONFIRMADO', ...,
   *                     pagamento: { metodo, valor: total, status: 'APROVADO' } })  // pagamento simulado
   *                 })
   *  4. Redis    -> CarrinhoRepository.limpar(usuarioId), só depois do COMMIT.
   *
   * Se o passo 4 falhar o pedido já existe; o pior caso é o carrinho continuar cheio.
   * Isso é aceitável e vale citar na apresentação (consistência entre bancos).
   */
  async checkout(usuarioId: number, metodo: MetodoPagamento): Promise<PedidoResposta> {
    naoImplementado('PedidoService.checkout');
  },

  async listarDoUsuario(usuarioId: number): Promise<PedidoResposta[]> {
    naoImplementado('PedidoService.listarDoUsuario');
  },

  /** 404 se não existir ou se for de outro usuário. */
  async obter(usuarioId: number, pedidoId: number): Promise<PedidoResposta> {
    naoImplementado('PedidoService.obter');
  },
};

/** Converte o registro do Prisma (Decimal) no formato da API, juntando dados do livro vindos do MongoDB. */
export function paraResposta(
  pedido: PedidoCompleto,
  livros: Map<string, { titulo: string; capaUrl?: string | null }>,
): PedidoResposta {
  return {
    id: pedido.id,
    status: pedido.status as StatusPedido,
    total: pedido.total.toNumber(),
    criadoEm: pedido.criadoEm,
    itens: pedido.itens.map((i) => {
      const preco = i.precoUnitario.toNumber();
      const livro = livros.get(i.livroId);
      return {
        livroId: i.livroId,
        titulo: livro?.titulo ?? null,
        capaUrl: livro?.capaUrl ?? null,
        precoUnitario: preco,
        quantidade: i.quantidade,
        subtotal: Math.round(preco * i.quantidade * 100) / 100,
      };
    }),
    pagamento: pedido.pagamento && {
      metodo: pedido.pagamento.metodo as MetodoPagamento,
      valor: pedido.pagamento.valor.toNumber(),
      status: pedido.pagamento.status as StatusPagamento,
    },
  };
}
