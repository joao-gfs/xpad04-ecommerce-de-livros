import { Redis } from 'ioredis';
import { env } from '../config/env';

/** Cliente único do Redis (carrinho). */
export const redis = new Redis(env.REDIS_URL, { lazyConnect: true });
