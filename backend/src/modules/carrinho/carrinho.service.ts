import { HttpError } from '../../shared/http-error';
import { EstoqueRepository } from '../catalogo/estoque.repository';
import { LivroRepository } from '../catalogo/livro.repository';
import { CarrinhoRepository } from './carrinho.repository';

/** Lançado quando a quantidade informada é inválida (≤ 0 em contextos que exigem positivo). */
export class QuantidadeInvalidaError extends HttpError {
  constructor(quantidade: number) {
    super(400, `Quantidade inválida: ${quantidade}. Deve ser maior que zero.`);
    this.name = 'QuantidadeInvalidaError';
  }
}

/** Lançado quando a quantidade pedida ultrapassa o estoque disponível. */
export class EstoqueInsuficienteError extends HttpError {
  constructor(livroId: string, disponivel: number) {
    super(409, `Estoque insuficiente para o livro ${livroId}: apenas ${disponivel} disponível(is).`);
    this.name = 'EstoqueInsuficienteError';
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
   * para garantir que todos os campos obrigatórios de ItemCarrinho sejam populados e
   * impedir checkout de livros que não existem mais.
   * O item permanece no Redis até que o TTL expire; se o livro for reintroduzido no catálogo, ele reaparece.
   */
  async obter(usuarioId: number): Promise<Carrinho> {
    const mapa = await CarrinhoRepository.obterItens(usuarioId);
    if (mapa.size === 0) return { itens: [], total: 0 };

    const livros = await LivroRepository.buscarPorIds([...mapa.keys()]);
    const livroMap = new Map(livros.map((l) => [String(l._id), l]));

    const itens: ItemCarrinho[] = [...mapa.entries()]
      .filter(([livroId]) => livroMap.has(livroId))
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
   * 404 se o livro não existir no catálogo.
   * 409 se a quantidade pedida (já no carrinho + nova) ultrapassar o estoque.
   */
  async adicionarItem(usuarioId: number, livroId: string, quantidade: number = 1): Promise<void> {
    if (quantidade <= 0) throw new QuantidadeInvalidaError(quantidade);

    const [livro, estoqueDisponivel, mapaAtual] = await Promise.all([
      LivroRepository.buscarPorId(livroId),
      EstoqueRepository.obterQuantidade(livroId),
      CarrinhoRepository.obterItens(usuarioId),
    ]);

    if (!livro) throw new HttpError(404, `Livro não encontrado: ${livroId}`);

    const qtdNoCarrinho = mapaAtual.get(livroId) ?? 0;
    if (qtdNoCarrinho + quantidade > estoqueDisponivel) {
      throw new EstoqueInsuficienteError(livroId, estoqueDisponivel - qtdNoCarrinho);
    }

    await CarrinhoRepository.incrementar(usuarioId, livroId, quantidade);
  },

  /**
   * Define a quantidade exata do item.
   * novaQuantidade === 0: remove o item.
   * novaQuantidade < 0: lança QuantidadeInvalidaError (400).
   */
  async atualizarQuantidade(usuarioId: number, livroId: string, novaQuantidade: number): Promise<void> {
    if (novaQuantidade < 0) throw new QuantidadeInvalidaError(novaQuantidade);
    if (novaQuantidade === 0) {
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
