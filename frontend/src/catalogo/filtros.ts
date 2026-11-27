import type { FiltroLivrosApi } from '../api/types';

export const LIVROS_POR_PAGINA = 6;

const chavesAdicionais = ['descricao', 'editora', 'precoMin', 'precoMax'] as const;
const chavesPreco = ['precoMin', 'precoMax'] as const;

export type FiltrosAdicionais = Pick<FiltroLivrosApi, (typeof chavesAdicionais)[number]>;
export type CamposFiltrosAdicionais = Record<(typeof chavesAdicionais)[number], string>;
export type ErrosPreco = Partial<Record<(typeof chavesPreco)[number], string>>;

export interface FiltrosCatalogo extends FiltrosAdicionais {
  busca: string;
  categoria: string;
  pagina: number;
  porPagina: number;
}

export type ModoCatalogo = 'api' | 'automatico';

export function validarFiltrosAdicionais(campos: CamposFiltrosAdicionais) {
  const filtros: FiltrosAdicionais = {};
  const erros: ErrosPreco = {};

  if (campos.descricao.trim()) filtros.descricao = campos.descricao.trim();
  if (campos.editora.trim()) filtros.editora = campos.editora.trim();

  for (const chave of chavesPreco) {
    const texto = campos[chave].trim();
    if (!texto) continue;

    const semMoeda = texto.replace(/^R\$\s*/, '');
    const negativo = semMoeda.startsWith('-');
    const magnitude = negativo ? semMoeda.slice(1) : semMoeda;
    const agrupado = /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(magnitude);
    const decimal = agrupado ? magnitude.replace(/\./g, '') : magnitude;
    const valor = Number(decimal.replace(',', '.'));
    const invalido = !/^\d+(?:[,.]\d{1,2})?$/.test(decimal) || !Number.isSafeInteger(Math.round(valor * 100));
    if (invalido || negativo) {
      erros[chave] = invalido ? 'Informe um preço válido.' : 'Não utilize valores negativos.';
      continue;
    }
    filtros[chave] = valor;
  }

  if (filtros.precoMin !== undefined && filtros.precoMax !== undefined && filtros.precoMin > filtros.precoMax) {
    erros.precoMax = 'O preço mínimo deve ser menor ou igual ao máximo.';
    delete filtros.precoMin;
    delete filtros.precoMax;
  }

  return { filtros, erros };
}

/** A URL preserva os filtros ao atualizar, voltar e compartilhar a página. */
export function lerFiltros(params: URLSearchParams): FiltrosCatalogo {
  const valor = params.get('pagina') ?? '1';
  const numero = Number(valor);
  const { filtros } = validarFiltrosAdicionais({
    descricao: params.get('descricao') ?? '',
    editora: params.get('editora') ?? '',
    precoMin: params.get('precoMin') ?? '',
    precoMax: params.get('precoMax') ?? '',
  });
  return {
    ...filtros,
    busca: (params.get('busca') ?? '').trim(),
    categoria: (params.get('categoria') ?? '').trim(),
    pagina: /^\d+$/.test(valor) && Number.isSafeInteger(numero) && numero > 0 ? numero : 1,
    porPagina: LIVROS_POR_PAGINA,
  };
}

export function mudarFiltrosAdicionais(params: URLSearchParams, filtros: FiltrosAdicionais) {
  const proximo = new URLSearchParams(params);
  for (const chave of chavesAdicionais) {
    const valor = filtros[chave];
    if (valor === undefined || valor === '') proximo.delete(chave);
    else proximo.set(chave, String(valor));
  }
  proximo.delete('pagina');
  proximo.delete('modo');
  return proximo;
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
