import { Router } from 'express';
import { CatalogoController } from './catalogo.controller';

export const catalogoRoutes = Router();

catalogoRoutes.get('/categorias', CatalogoController.categorias);
catalogoRoutes.get('/livros', CatalogoController.listar);
catalogoRoutes.get('/livros/:id', CatalogoController.detalhe);
