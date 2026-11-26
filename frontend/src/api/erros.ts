import { ApiError } from './client';

export function mensagemApi(erro: unknown, alternativa: string, servicoPendente: string) {
  if (erro instanceof ApiError) {
    if (erro.status === 501) return servicoPendente;
    if (erro.status < 500 && erro.message) return erro.message;
  }
  return alternativa;
}
