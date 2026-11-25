import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../http-error';
import { verificarToken } from '../jwt';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuarioId?: string;
    }
  }
}

/** Exige header `Authorization: Bearer <token>` e preenche req.usuarioId. */
export function exigirAuth(req: Request, _res: Response, next: NextFunction) {
  const [tipo, token] = (req.headers.authorization ?? '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    throw new HttpError(401, 'Token ausente');
  }
  try {
    req.usuarioId = verificarToken(token);
  } catch {
    throw new HttpError(401, 'Token inválido ou expirado');
  }
  next();
}

/** Use em controllers de rotas protegidas por exigirAuth. */
export function usuarioIdDe(req: Request): string {
  if (!req.usuarioId) throw new HttpError(401, 'Não autenticado');
  return req.usuarioId;
}
