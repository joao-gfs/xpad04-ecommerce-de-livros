import bcrypt from 'bcryptjs';
import { gerarToken } from '../../shared/jwt';
import { UsuarioRepository } from './usuario.repository';
import type { Usuario } from '@prisma/client';
import { HttpError } from '../../shared/http-error'

/** Nunca devolva senhaHash para o cliente. */
export interface UsuarioPublico {
  id: number;
  nome: string;
  email: string;
}

export interface Sessao {
  token: string;
  usuario: UsuarioPublico;
}

function paraPublico(u: Usuario): UsuarioPublico {
  return{ id: u.id, nome: u.nome, email: u.email };
}

export const UsuarioService = {
  /** 409 se o e-mail já existir. Senha com bcrypt.hash(senha, 10). */
  async cadastrar(dados: { nome: string; email: string; senha: string }): Promise<Sessao> {
    const existente = await UsuarioRepository.buscarPorEmail(dados.email);
    if (existente) throw new HttpError(409, 'E-mail já cadastrado');

    const senhaHash = await bcrypt.hash(dados.senha, 10);
    const usuario = await UsuarioRepository.criar({
      nome: dados.nome,
      email: dados.email,
      senhaHash,
    });

    return { token: gerarToken(usuario.id), usuario: paraPublico(usuario) };
  },

  /** 401 com mensagem genérica se e-mail ou senha estiverem errados. */
  async login(dados: { email: string; senha: string }): Promise<Sessao> {
    const usuario = await UsuarioRepository.buscarPorEmail(dados.email);
    const senhaOk = usuario && (await bcrypt.compare(dados.senha, usuario.senhaHash));
    if (!usuario || !senhaOk) throw new HttpError(401, 'E-mail ou senha inválidos');

    return { token: gerarToken(usuario.id), usuario: paraPublico(usuario) };
  },

  async obterPerfil(usuarioId: number): Promise<UsuarioPublico> {
    const usuario = await UsuarioRepository.buscarPorId(usuarioId);
    if (!usuario) throw new HttpError(404, 'Usuário não encontrado');
    return paraPublico(usuario);
  },
};
