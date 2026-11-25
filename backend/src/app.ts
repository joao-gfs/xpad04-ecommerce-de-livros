import cors from 'cors';
import express, { Router } from 'express';
import mongoose from 'mongoose';
import { prisma } from './db/postgres';
import { redis } from './db/redis';
import { carrinhoRoutes } from './modules/carrinho/carrinho.routes';
import { catalogoRoutes } from './modules/catalogo/catalogo.routes';
import { pedidoRoutes } from './modules/pedidos/pedido.routes';
import { usuarioRoutes } from './modules/usuarios/usuario.routes';
import { errorHandler } from './shared/middleware/error-handler';

export function criarApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const api = Router();

  /** Mostra se a API está falando com os três bancos. */
  api.get('/health', async (_req, res) => {
    const [postgres, mongo, redisOk] = await Promise.all([
      prisma.$queryRaw`SELECT 1`.then(() => true, () => false),
      (mongoose.connection.db?.admin().ping() ?? Promise.reject()).then(() => true, () => false),
      redis.ping().then(() => true, () => false),
    ]);
    const ok = postgres && mongo && redisOk;
    res.status(ok ? 200 : 503).json({ ok, postgres, mongo, redis: redisOk });
  });

  api.use('/auth', usuarioRoutes);
  api.use('/', catalogoRoutes); // /categorias, /livros
  api.use('/carrinho', carrinhoRoutes);
  api.use('/pedidos', pedidoRoutes);

  app.use('/api', api);
  app.use((_req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada' });
  });
  app.use(errorHandler);

  return app;
}
