import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../http-error';

// Express 5 já encaminha erros de handlers async para cá; não precisa de try/catch nos controllers.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ erro: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ erro: 'Dados inválidos', detalhes: err.issues });
    return;
  }
  console.error(err);
  res.status(500).json({ erro: 'Erro interno' });
}
