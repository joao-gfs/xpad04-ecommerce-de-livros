import { criarApp } from './app';
import { env } from './config/env';
import { conectarMongo, mongoose } from './db/mongo';
import { prisma } from './db/postgres';
import { redis } from './db/redis';

async function main() {
  await Promise.all([prisma.$connect(), conectarMongo(), redis.connect()]);
  console.log('Conectado: PostgreSQL, MongoDB, Redis');

  const server = criarApp().listen(env.PORT, () => {
    console.log(`API ouvindo em http://localhost:${env.PORT}/api`);
  });

  const encerrar = async () => {
    server.close();
    await Promise.allSettled([prisma.$disconnect(), redis.quit(), mongoose.disconnect()]);
    process.exit(0);
  };
  process.on('SIGINT', encerrar);
  process.on('SIGTERM', encerrar);
}

main().catch((err) => {
  console.error('Falha ao iniciar a API:', err);
  process.exit(1);
});
