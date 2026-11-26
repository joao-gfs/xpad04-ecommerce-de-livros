import type { LivroResumo, Paginado } from '../api/types';
import type { FiltrosCatalogo, ModoCatalogo } from './filtros';

type PaginaLivros = Paginado<LivroResumo>;
type FalhaConsulta = 'nao-implementado' | 'falha';
type Resultado<T> = { dados: T; erro: null } | { dados: null; erro: FalhaConsulta };

interface ApiCatalogo {
  categorias: () => Promise<string[]>;
  livros: (filtros: FiltrosCatalogo) => Promise<PaginaLivros>;
}

export type CarregarDemonstracao = (filtros: FiltrosCatalogo) => Promise<{
  categorias: string[];
  livros: PaginaLivros;
}>;

export interface CatalogoConsultado {
  origem: 'api' | 'demo';
  categorias: Resultado<string[]>;
  livros: Resultado<PaginaLivros>;
}

function listaDeTextos(valor: unknown): boolean {
  return Array.isArray(valor) && valor.every((item: unknown) => typeof item === 'string');
}

function paginaValida(pagina: PaginaLivros): boolean {
  // O TypeScript define o contrato, mas o JSON recebido precisa ser conferido em execução.
  return Boolean(pagina)
    && Number.isSafeInteger(pagina.total) && pagina.total >= 0
    && Number.isSafeInteger(pagina.pagina) && pagina.pagina >= 1
    && Number.isSafeInteger(pagina.porPagina) && pagina.porPagina >= 1
    && Array.isArray(pagina.itens)
    && pagina.itens.every((livro: LivroResumo) => Boolean(livro)
      && typeof livro.id === 'string'
      && typeof livro.titulo === 'string'
      && listaDeTextos(livro.autores)
      && listaDeTextos(livro.categorias)
      && Number.isFinite(livro.preco)
      && (livro.capaUrl == null || typeof livro.capaUrl === 'string'));
}

function interpretar<T>(resposta: PromiseSettledResult<T>, validar: (dados: T) => boolean): Resultado<T> {
  if (resposta.status === 'fulfilled' && validar(resposta.value)) {
    return { dados: resposta.value, erro: null };
  }
  if (resposta.status === 'rejected') {
    const causa: unknown = resposta.reason;
    // O cliente HTTP inclui o status da resposta no erro. O contrato usa 501 para rotas pendentes.
    if (causa instanceof Error && 'status' in causa && causa.status === 501) {
      return { dados: null, erro: 'nao-implementado' };
    }
  }
  return { dados: null, erro: 'falha' };
}

async function consultarDemonstracao(
  carregar: CarregarDemonstracao,
  filtros: FiltrosCatalogo,
): Promise<CatalogoConsultado> {
  try {
    const dados = await carregar(filtros);
    return {
      origem: 'demo',
      categorias: { dados: dados.categorias, erro: null },
      livros: { dados: dados.livros, erro: null },
    };
  } catch {
    return {
      origem: 'demo',
      categorias: { dados: null, erro: 'falha' },
      livros: { dados: null, erro: 'falha' },
    };
  }
}

export async function consultarCatalogo(
  api: ApiCatalogo,
  filtros: FiltrosCatalogo,
  modo: ModoCatalogo,
  carregarDemonstracao?: CarregarDemonstracao,
): Promise<CatalogoConsultado> {
  const [respostaCategorias, respostaLivros] = await Promise.allSettled([
    api.categorias(),
    api.livros(filtros),
  ]);
  const categorias = interpretar(respostaCategorias, listaDeTextos);
  const livros = interpretar(respostaLivros, paginaValida);

  // Uma única origem para os dois recursos. Qualquer sucesso ou falha inesperada é preservado.
  if (modo === 'automatico' && carregarDemonstracao
    && categorias.erro === 'nao-implementado' && livros.erro === 'nao-implementado') {
    return consultarDemonstracao(carregarDemonstracao, filtros);
  }

  return { origem: 'api', categorias, livros };
}
