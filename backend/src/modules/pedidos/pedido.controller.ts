import type { Request, Response } from 'express';
import { usuarioIdDe } from '../../shared/middleware/auth';
import { PedidoService } from './pedido.service';

export const PedidoController = {
  async checkout(req: Request, res: Response) {
    res.status(201).json(await PedidoService.checkout(usuarioIdDe(req)));
  },

  async listar(req: Request, res: Response) {
    res.json(await PedidoService.listarDoUsuario(usuarioIdDe(req)));
  },

  async detalhe(req: Request<{ id: string }>, res: Response) {
    res.json(await PedidoService.obter(usuarioIdDe(req), req.params.id));
  },
};
