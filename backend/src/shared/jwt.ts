import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

interface Payload {
  sub: string; // id do usuário (o padrão JWT exige string)
}

export function gerarToken(usuarioId: number): string {
  return jwt.sign({ sub: String(usuarioId) } satisfies Payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/** Devolve o id do usuário ou lança se o token for inválido/expirado. */
export function verificarToken(token: string): number {
  const payload = jwt.verify(token, env.JWT_SECRET) as Payload;
  const id = Number(payload.sub);
  if (!Number.isInteger(id)) throw new Error('sub inválido');
  return id;
}
