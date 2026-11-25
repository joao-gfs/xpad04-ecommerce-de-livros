import { Router } from 'express';
import { exigirAuth } from '../../shared/middleware/auth';
import { UsuarioController } from './usuario.controller';

export const usuarioRoutes = Router();

usuarioRoutes.post('/cadastro', UsuarioController.cadastro);
usuarioRoutes.post('/login', UsuarioController.login);
usuarioRoutes.get('/me', exigirAuth, UsuarioController.me);
