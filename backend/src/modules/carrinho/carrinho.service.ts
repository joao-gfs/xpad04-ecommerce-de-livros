import { naoImplementado } from '../../shared/http-error';
import { EstoqueRepository } from '../catalogo/estoque.repository';
import { LivroRepository } from '../catalogo/livro.repository';
import { CarrinhoRepository } from './carrinho.repository';

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
  /** Lê o hash do Redis e enriquece com título/preço do MongoDB. */
  async obter(usuarioId: number): Promise<Carrinho> {
    // TODO: CarrinhoRepository.obterItens + LivroRepository.buscarPorIds
    naoImplementado('CarrinhoService.obter');
  },

  /** 404 se o livro não existir; 409 se a quantidade pedida passar do estoque. */
  async adicionarItem(usuarioId: number, livroId: string, quantidade: number): Promise<Carrinho> {
    // TODO: validar livro (LivroRepository) e estoque (EstoqueRepository), depois CarrinhoRepository.incrementar
    naoImplementado('CarrinhoService.adicionarItem');
  },

  async atualizarQuantidade(usuarioId: number, livroId: string, quantidade: number): Promise<Carrinho> {
    // TODO: quantidade 0 remove o item
    naoImplementado('CarrinhoService.atualizarQuantidade');
  },

  async removerItem(usuarioId: number, livroId: string): Promise<Carrinho> {
    naoImplementado('CarrinhoService.removerItem');
  },

  async limpar(usuarioId: number): Promise<void> {
    naoImplementado('CarrinhoService.limpar');
  },
};
