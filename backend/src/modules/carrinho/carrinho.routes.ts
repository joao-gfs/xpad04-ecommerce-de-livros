import { Router } from 'express';
import { exigirAuth } from '../../shared/middleware/auth';
import { CarrinhoController } from './carrinho.controller';

export const carrinhoRoutes = Router();

carrinhoRoutes.use(exigirAuth);
carrinhoRoutes.get('/', CarrinhoController.obter);
carrinhoRoutes.delete('/', CarrinhoController.limpar);
carrinhoRoutes.post('/itens', CarrinhoController.adicionar);
carrinhoRoutes.patch('/itens/:livroId', CarrinhoController.atualizar);
carrinhoRoutes.delete('/itens/:livroId', CarrinhoController.remover);
