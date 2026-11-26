import { HttpError } from '../../shared/http-error';
import { LivroRepository } from '../catalogo/livro.repository';
import { CarrinhoRepository } from './carrinho.repository';

/** Lançado quando a quantidade informada é inválida (≤ 0 em contextos que exigem positivo). */
export class QuantidadeInvalidaError extends HttpError {
  constructor(quantidade: number) {
    super(400, `Quantidade inválida: ${quantidade}. Deve ser maior que zero.`);
    this.name = 'QuantidadeInvalidaError';
  }
}

export interface ItemCarrinho {
  livroId: string;
  titulo: string;
  capaUrl?: string | null;
  precoUnitario: number; // preço atual do catálogo (MongoDB)
  quantidade: number; // do Redis
  subtotal: number;
}

export interface Carrinho {
  itens: ItemCarrinho[];
  total: number;
}

export const CarrinhoService = {
  /**
   * Lê o hash do Redis e enriquece com título/preço do MongoDB (LivroRepository).
   * Itens cujo livro não existe mais no catálogo são silenciosamente descartados
   * para garantir que todos os campos obrigatórios de ItemCarrinho sejam populados.
   */
  async obter(usuarioId: number): Promise<Carrinho> {
    const mapa = await CarrinhoRepository.obterItens(usuarioId);
    if (mapa.size === 0) return { itens: [], total: 0 };

    const livros = await LivroRepository.buscarPorIds([...mapa.keys()]);
    const livroMap = new Map(livros.map((l) => [String(l._id), l]));

    const itens: ItemCarrinho[] = [...mapa.entries()]
      .filter(([livroId]) => livroMap.has(livroId)) // descarta itens cujo livro sumiu do catálogo
      .map(([livroId, quantidade]) => {
        const livro = livroMap.get(livroId)!;
        const precoUnitario = livro.preco;
        return {
          livroId,
          quantidade,
          titulo: livro.titulo,
          capaUrl: livro.capaUrl ?? null,
          precoUnitario,
          subtotal: precoUnitario * quantidade,
        };
      });

    const total = itens.reduce((soma, item) => soma + item.subtotal, 0);
    return { itens, total };
  },

  /**
   * Incrementa a quantidade do item via HINCRBY e renova o TTL.
   * Lança QuantidadeInvalidaError se quantidade ≤ 0.
   */
  async adicionarItem(usuarioId: number, livroId: string, quantidade: number = 1): Promise<void> {
    if (quantidade <= 0) throw new QuantidadeInvalidaError(quantidade);
    await CarrinhoRepository.incrementar(usuarioId, livroId, quantidade);
  },

  /**
   * Define a quantidade exata do item.
   * Se novaQuantidade ≤ 0, remove o item (equivalente a removerItem).
   * Lança QuantidadeInvalidaError se a quantidade resultante ficaria negativa
   * (isso não pode ocorrer via HSET, mas valida a intenção do chamador).
   */
  async atualizarQuantidade(usuarioId: number, livroId: string, novaQuantidade: number): Promise<void> {
    if (novaQuantidade <= 0) {
      await CarrinhoRepository.removerItem(usuarioId, livroId);
      return;
    }
    await CarrinhoRepository.definirQuantidade(usuarioId, livroId, novaQuantidade);
  },

  /** Remove o campo livroId do hash via HDEL. */
  async removerItem(usuarioId: number, livroId: string): Promise<void> {
    await CarrinhoRepository.removerItem(usuarioId, livroId);
  },

  /**
   * Apaga a chave carrinho:{usuarioId} inteira via DEL.
   * Chamado pelo PedidoService após o commit da transação de pedido.
   */
  async limpar(usuarioId: number): Promise<void> {
    await CarrinhoRepository.limpar(usuarioId);
  },
};
