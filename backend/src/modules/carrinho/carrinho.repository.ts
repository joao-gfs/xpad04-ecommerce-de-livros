import { env } from '../../config/env';
import { redis } from '../../db/redis';
import { naoImplementado } from '../../shared/http-error';

/**
 * Carrinho no Redis (chave-valor).
 *
 * Modelo: um HASH por usuário
 *   chave:  carrinho:{usuarioId}
 *   campo:  {livroId}
 *   valor:  quantidade
 * com TTL de env.CARRINHO_TTL_SEGUNDOS renovado a cada escrita.
 */
export const chaveCarrinho = (usuarioId: number) => `carrinho:${usuarioId}`;

export const CarrinhoRepository = {
  /** livroId -> quantidade */
  async obterItens(usuarioId: number): Promise<Map<string, number>> {
    // TODO: redis.hgetall(chaveCarrinho(usuarioId)) e converter valores para number
    naoImplementado('CarrinhoRepository.obterItens');
  },

  async definirQuantidade(usuarioId: number, livroId: string, quantidade: number): Promise<void> {
    // TODO: redis.multi().hset(...).expire(chave, env.CARRINHO_TTL_SEGUNDOS).exec()
    naoImplementado('CarrinhoRepository.definirQuantidade');
  },

  async incrementar(usuarioId: number, livroId: string, quantidade: number): Promise<number> {
    // TODO: redis.hincrby(...) + expire; retorna a nova quantidade
    naoImplementado('CarrinhoRepository.incrementar');
  },

  async removerItem(usuarioId: number, livroId: string): Promise<void> {
    // TODO: redis.hdel(...)
    naoImplementado('CarrinhoRepository.removerItem');
  },

  async limpar(usuarioId: number): Promise<void> {
    // TODO: redis.del(...)
    naoImplementado('CarrinhoRepository.limpar');
  },
};
