import { HttpError } from '../../shared/http-error';
import { EstoqueRepository } from './estoque.repository';
import { LivroRepository, type FiltroLivros } from './livro.repository';

/** 404 quando o livro não existe no catálogo (MongoDB). */
export class LivroNaoEncontradoError extends HttpError {
  constructor(id: string) {
    super(404, `Livro não encontrado: ${id}`);
    this.name = 'LivroNaoEncontradoError';
  }
}

export interface LivroResumo {
  id: string;
  titulo: string;
  autores: string[];
  categorias: string[];
  preco: number;
  capaUrl?: string | null;
}

export interface LivroDetalhe extends LivroResumo {
  subtitulo?: string | null;
  descricao?: string | null;
  editora?: string | null;
  dataPublicacao?: string | null;
  paginas?: number | null;
  isbn?: string | null;
  estoque: number; // vem do PostgreSQL
  disponivel: boolean;
}

export interface Paginado<T> {
  itens: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

export const CatalogoService = {
  async listarCategorias(): Promise<string[]> {
    return LivroRepository.listarCategorias();
  },

  async listarLivros(filtro: FiltroLivros): Promise<Paginado<LivroResumo>> {
    const { itens, total } = await LivroRepository.listar(filtro);

    return {
      itens: itens.map((livro) => ({
        id: String(livro._id),
        titulo: livro.titulo,
        autores: livro.autores ?? [],
        categorias: livro.categorias ?? [],
        preco: livro.preco,
        capaUrl: livro.capaUrl,
      })),
      total,
      pagina: filtro.pagina,
      porPagina: filtro.porPagina,
    };
  },

  /** Junta MongoDB (livro) + PostgreSQL (estoque) em paralelo. 404 se não existir. */
  async obterLivro(id: string): Promise<LivroDetalhe> {
    const [livro, estoque] = await Promise.all([
      LivroRepository.buscarPorId(id),
      EstoqueRepository.obterQuantidade(id),
    ]);

    if (!livro) throw new LivroNaoEncontradoError(id);

    return {
      id: String(livro._id),
      titulo: livro.titulo,
      autores: livro.autores ?? [],
      categorias: livro.categorias ?? [],
      preco: livro.preco,
      capaUrl: livro.capaUrl,
      subtitulo: livro.subtitulo,
      descricao: livro.descricao,
      editora: livro.editora,
      dataPublicacao: livro.dataPublicacao,
      paginas: livro.paginas,
      isbn: livro.isbn,
      estoque,
      disponivel: estoque > 0,
    };
  },
};
