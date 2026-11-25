import { Router } from 'express';
import { exigirAuth } from '../../shared/middleware/auth';
import { PedidoController } from './pedido.controller';

export const pedidoRoutes = Router();

pedidoRoutes.use(exigirAuth);
pedidoRoutes.post('/', PedidoController.checkout);
pedidoRoutes.get('/', PedidoController.listar);
pedidoRoutes.get('/:id', PedidoController.detalhe);
