import { prisma } from '../../db/postgres';
import { HttpError } from '../../shared/http-error';
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

/** Lançado quando o pedido não existe ou não pertence ao usuário. */
export class PedidoNaoEncontradoError extends HttpError {
  constructor(pedidoId: number) {
    super(404, `Pedido não encontrado: ${pedidoId}`);
    this.name = 'PedidoNaoEncontradoError';
  }
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
    // 1. Redis: lê o mapa livroId -> quantidade do carrinho
    const mapa = await CarrinhoRepository.obterItens(usuarioId);
    if (mapa.size === 0) throw new HttpError(400, 'O carrinho está vazio.');

    const livroIds = [...mapa.keys()];

    // 2. MongoDB: busca preço atual de cada livro (congela como preco_unitario)
    const livros = await LivroRepository.buscarPorIds(livroIds);
    const livroMap = new Map(livros.map((l) => [String(l._id), l]));

    // Itens cujo livro não existe mais no catálogo são descartados (mesmo comportamento do CarrinhoService)
    const itens = livroIds
      .filter((id) => livroMap.has(id))
      .map((id) => ({
        livroId: id,
        precoUnitario: livroMap.get(id)!.preco,
        quantidade: mapa.get(id)!,
      }));

    if (itens.length === 0) throw new HttpError(400, 'O carrinho está vazio.');

    const total = itens.reduce((soma, i) => soma + i.precoUnitario * i.quantidade, 0);

    // 3. Postgres: transação ACID — baixa de estoque + gravação do pedido
    const pedido = await prisma.$transaction(async (tx) => {
      for (const item of itens) {
        const ok = await EstoqueRepository.decrementar(tx, item.livroId, item.quantidade);
        if (!ok) {
          // Lançar dentro do callback faz ROLLBACK de tudo automaticamente.
          const titulo = livroMap.get(item.livroId)?.titulo ?? item.livroId;
          throw new HttpError(409, `Estoque insuficiente: ${titulo}`);
        }
      }

      return PedidoRepository.criar(tx, {
        usuarioId,
        status: 'CONFIRMADO',
        total,
        itens,
        pagamento: { metodo, valor: total, status: 'APROVADO' },
      });
    });

    // 4. Redis: limpa o carrinho SÓ depois do COMMIT confirmado.
    await CarrinhoRepository.limpar(usuarioId);
    return paraResposta(pedido, livroMap);
  },

  async listarDoUsuario(usuarioId: number): Promise<PedidoResposta[]> {
    const pedidos = await PedidoRepository.listarPorUsuario(usuarioId);
    if (pedidos.length === 0) return [];

    // Busca todos os livros referenciados de uma vez (evita N+1).
    const todosLivroIds = [...new Set(pedidos.flatMap((p) => p.itens.map((i) => i.livroId)))];
    const livros = await LivroRepository.buscarPorIds(todosLivroIds);
    const livroMap = new Map(livros.map((l) => [String(l._id), l]));

    return pedidos.map((p) => paraResposta(p, livroMap));
  },

  /** 404 se não existir ou se for de outro usuário. */
  async obter(usuarioId: number, pedidoId: number): Promise<PedidoResposta> {
    const pedido = await PedidoRepository.buscarPorId(pedidoId);
    if (!pedido || pedido.usuarioId !== usuarioId) throw new PedidoNaoEncontradoError(pedidoId);

    const livros = await LivroRepository.buscarPorIds(pedido.itens.map((i) => i.livroId));
    const livroMap = new Map(livros.map((l) => [String(l._id), l]));
    return paraResposta(pedido, livroMap);
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
