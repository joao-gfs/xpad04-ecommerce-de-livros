import { prisma } from '../../db/postgres';
import { naoImplementado } from '../../shared/http-error';
import { CarrinhoRepository } from '../carrinho/carrinho.repository';
import { EstoqueRepository } from '../catalogo/estoque.repository';
import { LivroRepository } from '../catalogo/livro.repository';
import { PedidoRepository, type PedidoComItens } from './pedido.repository';

export const PedidoService = {
  /**
   * Checkout: o fluxo que coordena os três bancos.
   *
   *  1. Redis    -> CarrinhoRepository.obterItens(usuarioId). Vazio = 400.
   *  2. MongoDB  -> LivroRepository.buscarPorIds(ids) para título e preço atuais (snapshot no pedido).
   *  3. Postgres -> prisma.$transaction(async (tx) => {
   *                   para cada item: EstoqueRepository.decrementar(tx, ...)
   *                     -> se false, lançar HttpError(409, 'Estoque insuficiente: <titulo>')
   *                        (lançar dentro do callback faz ROLLBACK de tudo)
   *                   PedidoRepository.criar(tx, ...)
   *                 })
   *  4. Redis    -> CarrinhoRepository.limpar(usuarioId), só depois do COMMIT.
   *
   * Se o passo 4 falhar o pedido já existe; o pior caso é o carrinho continuar cheio.
   * Isso é aceitável e vale citar na apresentação (consistência entre bancos).
   */
  async checkout(usuarioId: string): Promise<PedidoComItens> {
    naoImplementado('PedidoService.checkout');
  },

  async listarDoUsuario(usuarioId: string): Promise<PedidoComItens[]> {
    naoImplementado('PedidoService.listarDoUsuario');
  },

  /** 404 se não existir ou se for de outro usuário. */
  async obter(usuarioId: string, pedidoId: string): Promise<PedidoComItens> {
    naoImplementado('PedidoService.obter');
  },
};
