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
    const usuarioId = usuarioIdDe(req);
    await CarrinhoService.adicionarItem(usuarioId, livroId, quantidade);
    res.status(201).json(await CarrinhoService.obter(usuarioId));
  },

  async atualizar(req: Request<{ livroId: string }>, res: Response) {
    const { quantidade } = atualizarBody.parse(req.body);
    const usuarioId = usuarioIdDe(req);
    await CarrinhoService.atualizarQuantidade(usuarioId, req.params.livroId, quantidade);
    res.json(await CarrinhoService.obter(usuarioId));
  },

  async remover(req: Request<{ livroId: string }>, res: Response) {
    const usuarioId = usuarioIdDe(req);
    await CarrinhoService.removerItem(usuarioId, req.params.livroId);
    res.json(await CarrinhoService.obter(usuarioId));
  },

  async limpar(req: Request, res: Response) {
    await CarrinhoService.limpar(usuarioIdDe(req));
    res.status(204).end();
  },
};
