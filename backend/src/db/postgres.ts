import { PrismaClient } from '@prisma/client';

/** Cliente único do PostgreSQL (usuários, estoque, pedidos). */
export const prisma = new PrismaClient();

/** Tipo do cliente dentro de prisma.$transaction(async (tx) => ...). */
export type Tx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;
