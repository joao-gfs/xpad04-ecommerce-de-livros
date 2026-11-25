import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  MONGO_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_BOOKS_API_KEY: z.string().optional(),
  /** TTL do carrinho no Redis, em segundos (padrão: 7 dias). */
  CARRINHO_TTL_SEGUNDOS: z.coerce.number().default(60 * 60 * 24 * 7),
});

export const env = schema.parse(process.env);
