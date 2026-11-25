import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

interface Payload {
  sub: string; // id do usuário
}

export function gerarToken(usuarioId: string): string {
  return jwt.sign({ sub: usuarioId } satisfies Payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/** Devolve o id do usuário ou lança se o token for inválido/expirado. */
export function verificarToken(token: string): string {
  const payload = jwt.verify(token, env.JWT_SECRET) as Payload;
  return payload.sub;
}
