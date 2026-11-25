/** Erro com status HTTP. Lance de qualquer camada; o error-handler converte em resposta. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Placeholder para o que ainda falta implementar. A rota responde 501. */
export function naoImplementado(oque: string): never {
  throw new HttpError(501, `Não implementado ainda: ${oque}`);
}
