import type { Request, Response } from 'express';
import { z } from 'zod';
import { usuarioIdDe } from '../../shared/middleware/auth';
import { UsuarioService } from './usuario.service';

const cadastroBody = z.object({
  nome: z.string().trim().min(2),
  email: z.email().toLowerCase(),
  senha: z.string().min(6),
});

const loginBody = z.object({
  email: z.email().toLowerCase(),
  senha: z.string().min(1),
});

export const UsuarioController = {
  async cadastro(req: Request, res: Response) {
    res.status(201).json(await UsuarioService.cadastrar(cadastroBody.parse(req.body)));
  },

  async login(req: Request, res: Response) {
    res.json(await UsuarioService.login(loginBody.parse(req.body)));
  },

  async me(req: Request, res: Response) {
    res.json(await UsuarioService.obterPerfil(usuarioIdDe(req)));
  },
};
