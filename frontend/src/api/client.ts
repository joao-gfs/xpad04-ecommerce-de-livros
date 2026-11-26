import { demonstrarFluxos } from '../config/desenvolvimento';

const TOKEN_KEY = demonstrarFluxos ? 'livraria.demo.token' : 'livraria.token';

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignora */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignora */
    }
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Metodo = 'GET' | 'POST' | 'PATCH' | 'DELETE';

/** Chama /api{caminho}, manda o token se houver e devolve o JSON. Lança ApiError em 4xx/5xx. */
export async function api<T>(caminho: string, metodo: Metodo = 'GET', corpo?: unknown): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`/api${caminho}`, {
    method: metodo,
    headers: {
      ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
  });

  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const dados = await res.json().catch(() => null);
    const mensagem = typeof dados?.erro === 'string' ? dados.erro : res.statusText;
    throw new ApiError(res.status, mensagem);
  }
  const dados = await res.json().catch(() => null);
  if (dados === null) throw new ApiError(502, 'A API retornou uma resposta inválida.');
  return dados as T;
}
