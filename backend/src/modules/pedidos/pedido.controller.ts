import type { Request, Response } from 'express';
import { z } from 'zod';
import { usuarioIdDe } from '../../shared/middleware/auth';
import { PedidoService } from './pedido.service';
import { METODOS_PAGAMENTO } from './pedido.types';

const checkoutBody = z.object({
  metodo: z.enum(METODOS_PAGAMENTO),
});

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

export const PedidoController = {
  async checkout(req: Request, res: Response) {
    const { metodo } = checkoutBody.parse(req.body);
    res.status(201).json(await PedidoService.checkout(usuarioIdDe(req), metodo));
  },

  async listar(req: Request, res: Response) {
    res.json(await PedidoService.listarDoUsuario(usuarioIdDe(req)));
  },

  async detalhe(req: Request, res: Response) {
    const { id } = idParam.parse(req.params);
    res.json(await PedidoService.obter(usuarioIdDe(req), id));
  },
};
