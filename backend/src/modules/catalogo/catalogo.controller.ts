import type { Request, Response } from 'express';
import { z } from 'zod';
import { CatalogoService } from './catalogo.service';

const texto = z.string().trim().min(1).optional();

const listarQuery = z
  .object({
    categoria: texto,
    autor: texto,
    titulo: texto,
    descricao: texto,
    editora: texto,
    busca: texto,
    precoMin: z.coerce.number().min(0).optional(),
    precoMax: z.coerce.number().min(0).optional(),
    pagina: z.coerce.number().int().min(1).default(1),
    porPagina: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    (f) => f.precoMin === undefined || f.precoMax === undefined || f.precoMin <= f.precoMax,
    { message: 'precoMin não pode ser maior que precoMax', path: ['precoMin'] },
  );

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