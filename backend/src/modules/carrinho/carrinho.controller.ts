import type { Request, Response } from 'express';
import { z } from 'zod';
import { usuarioIdDe } from '../../shared/middleware/auth';
import { CarrinhoService } from './carrinho.service';

const adicionarBody = z.object({
  livroId: z.string().min(1),
  quantidade: z.number().int().min(1).default(1),
});

const atualizarBody = z.object({
  quantidade: z.number().int().min(0),
});

export const CarrinhoController = {
  async obter(req: Request, res: Response) {
    res.json(await CarrinhoService.obter(usuarioIdDe(req)));
  },

  async adicionar(req: Request, res: Response) {
    const { livroId, quantidade } = adicionarBody.parse(req.body);
    res.status(201).json(await CarrinhoService.adicionarItem(usuarioIdDe(req), livroId, quantidade));
  },

  async atualizar(req: Request<{ livroId: string }>, res: Response) {
    const { quantidade } = atualizarBody.parse(req.body);
    res.json(await CarrinhoService.atualizarQuantidade(usuarioIdDe(req), req.params.livroId, quantidade));
  },

  async remover(req: Request<{ livroId: string }>, res: Response) {
    res.json(await CarrinhoService.removerItem(usuarioIdDe(req), req.params.livroId));
  },

  async limpar(req: Request, res: Response) {
    await CarrinhoService.limpar(usuarioIdDe(req));
    res.status(204).end();
  },
};
