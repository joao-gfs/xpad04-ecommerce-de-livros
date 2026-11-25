import bcrypt from 'bcryptjs';
import { naoImplementado } from '../../shared/http-error';
import { gerarToken } from '../../shared/jwt';
import { UsuarioRepository } from './usuario.repository';

/** Nunca devolva senhaHash para o cliente. */
export interface UsuarioPublico {
  id: string;
  nome: string;
  email: string;
}

export interface Sessao {
  token: string;
  usuario: UsuarioPublico;
}

export const UsuarioService = {
  /** 409 se o e-mail já existir. Senha com bcrypt.hash(senha, 10). */
  async cadastrar(dados: { nome: string; email: string; senha: string }): Promise<Sessao> {
    // TODO: UsuarioRepository.buscarPorEmail -> bcrypt.hash -> UsuarioRepository.criar -> gerarToken(usuario.id)
    naoImplementado('UsuarioService.cadastrar');
  },

  /** 401 com mensagem genérica se e-mail ou senha estiverem errados. */
  async login(dados: { email: string; senha: string }): Promise<Sessao> {
    // TODO: UsuarioRepository.buscarPorEmail -> bcrypt.compare -> gerarToken
    naoImplementado('UsuarioService.login');
  },

  async obterPerfil(usuarioId: string): Promise<UsuarioPublico> {
    naoImplementado('UsuarioService.obterPerfil');
  },
};
