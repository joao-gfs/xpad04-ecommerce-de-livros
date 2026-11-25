import type { Request, Response } from 'express';
import { z } from 'zod';
import { CatalogoService } from './catalogo.service';

const listarQuery = z.object({
  categoria: z.string().trim().min(1).optional(),
  busca: z.string().trim().min(1).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce.number().int().min(1).max(100).default(20),
});

export const CatalogoController = {
  async categorias(_req: Request, res: Response) {
    res.json(await CatalogoService.listarCategorias());
  },

  async listar(req: Request, res: Response) {
    const filtro = listarQuery.parse(req.query);
    res.json(await CatalogoService.listarLivros(filtro));
  },

  async detalhe(req: Request<{ id: string }>, res: Response) {
    res.json(await CatalogoService.obterLivro(req.params.id));
  },
};
