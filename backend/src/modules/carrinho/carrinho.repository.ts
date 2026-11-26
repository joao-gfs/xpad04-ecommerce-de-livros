import { env } from '../../config/env';
import { redis } from '../../db/redis';

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
  /** Retorna mapa livroId -> quantidade. Mapa vazio se o carrinho não existir. */
  async obterItens(usuarioId: number): Promise<Map<string, number>> {
    const chave = chaveCarrinho(usuarioId);
    const hash = await redis.hgetall(chave);
    const mapa = new Map<string, number>();
    for (const [livroId, qtd] of Object.entries(hash ?? {})) {
      mapa.set(livroId, Number(qtd));
    }
    return mapa;
  },

  /** Define a quantidade exata de um item e renova o TTL. */
  async definirQuantidade(usuarioId: number, livroId: string, quantidade: number): Promise<void> {
    const chave = chaveCarrinho(usuarioId);
    await redis.hset(chave, livroId, quantidade);
    await redis.expire(chave, env.CARRINHO_TTL_SEGUNDOS);
  },

  /** Incrementa (HINCRBY) e renova o TTL. Retorna a nova quantidade. */
  async incrementar(usuarioId: number, livroId: string, quantidade: number): Promise<number> {
    const chave = chaveCarrinho(usuarioId);
    const novaQtd = await redis.hincrby(chave, livroId, quantidade);
    await redis.expire(chave, env.CARRINHO_TTL_SEGUNDOS);
    return novaQtd;
  },

  /** Remove um campo do hash (HDEL). */
  async removerItem(usuarioId: number, livroId: string): Promise<void> {
    await redis.hdel(chaveCarrinho(usuarioId), livroId);
  },

  /** Apaga o hash inteiro (DEL). Chamado pelo PedidoService após commit do checkout. */
  async limpar(usuarioId: number): Promise<void> {
    await redis.del(chaveCarrinho(usuarioId));
  },
};
