import { naoImplementado } from '../../shared/http-error';
import { EstoqueRepository } from './estoque.repository';
import { LivroRepository, type FiltroLivros } from './livro.repository';

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
    // TODO: LivroRepository.listarCategorias(), ordenado
    naoImplementado('CatalogoService.listarCategorias');
  },

  async listarLivros(filtro: FiltroLivros): Promise<Paginado<LivroResumo>> {
    // TODO: LivroRepository.listar(filtro) e mapear para LivroResumo (_id -> id)
    naoImplementado('CatalogoService.listarLivros');
  },

  /** Junta MongoDB (dados do livro) + PostgreSQL (estoque). 404 se o livro não existir. */
  async obterLivro(id: string): Promise<LivroDetalhe> {
    // TODO: LivroRepository.buscarPorId + EstoqueRepository.obterQuantidade
    naoImplementado('CatalogoService.obterLivro');
  },
};
