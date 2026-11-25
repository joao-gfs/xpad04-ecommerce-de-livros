import type { Usuario } from '@prisma/client';
import { prisma } from '../../db/postgres';
import { naoImplementado } from '../../shared/http-error';

/** Usuários no PostgreSQL (Prisma). */
export const UsuarioRepository = {
  async criar(dados: { nome: string; email: string; senhaHash: string }): Promise<Usuario> {
    // TODO: prisma.usuario.create({ data: dados })
    naoImplementado('UsuarioRepository.criar');
  },

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    naoImplementado('UsuarioRepository.buscarPorEmail');
  },

  async buscarPorId(id: number): Promise<Usuario | null> {
    naoImplementado('UsuarioRepository.buscarPorId');
  },
};
