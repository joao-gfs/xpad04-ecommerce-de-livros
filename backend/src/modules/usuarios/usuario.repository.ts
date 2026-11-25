import type { Usuario } from '@prisma/client';
import { prisma } from '../../db/postgres';

/** Usuários no PostgreSQL (Prisma). */
export const UsuarioRepository = {
  async criar(dados: { nome: string; email: string; senhaHash: string }): Promise<Usuario> {
    return prisma.usuario.create({ data: dados });
  },

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: {email} });
  },

  async buscarPorId(id: number): Promise<Usuario | null> {
    return prisma.usuario.findUnique({ where: {id} });
  },
};
