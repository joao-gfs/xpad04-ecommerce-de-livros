export const LIVROS_POR_PAGINA = 6;

export interface FiltrosCatalogo {
  busca: string;
  categoria: string;
  pagina: number;
  porPagina: number;
}

export type ModoCatalogo = 'api' | 'automatico';

/** A URL preserva os filtros ao atualizar, voltar e compartilhar a página. */
export function lerFiltros(params: URLSearchParams): FiltrosCatalogo {
  const valor = params.get('pagina') ?? '1';
  const numero = Number(valor);
  return {
    busca: (params.get('busca') ?? '').trim(),
    categoria: (params.get('categoria') ?? '').trim(),
    pagina: /^\d+$/.test(valor) && Number.isSafeInteger(numero) && numero > 0 ? numero : 1,
    porPagina: LIVROS_POR_PAGINA,
  };
}

export function lerModoCatalogo(desenvolvimento: boolean, habilitado?: string): ModoCatalogo {
  return desenvolvimento && habilitado === 'true' ? 'automatico' : 'api';
}

export function mudarFiltro(params: URLSearchParams, chave: string, valor: string) {
  const proximo = new URLSearchParams(params);
  proximo.delete('modo');
  if (valor.trim()) proximo.set(chave, valor.trim());
  else proximo.delete(chave);
  if (chave !== 'pagina') proximo.delete('pagina');
  return proximo;
}
