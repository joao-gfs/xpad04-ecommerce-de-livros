import { naoImplementado } from '../../shared/http-error';
import { LivroModel, type Livro } from './livro.model';

export interface FiltroLivros {
  categoria?: string;
  busca?: string; // título ou autor
  pagina: number; // começa em 1
  porPagina: number;
}

/** Acesso ao catálogo no MongoDB (Mongoose). */
export const LivroRepository = {
  async listar(filtro: FiltroLivros): Promise<{ itens: Livro[]; total: number }> {
    // TODO: montar query com { categorias: filtro.categoria } e/ou { $text: { $search: filtro.busca } },
    //       paginar com skip/limit e contar com countDocuments. Use .lean().
    naoImplementado('LivroRepository.listar');
  },

  async buscarPorId(id: string): Promise<Livro | null> {
    // TODO: LivroModel.findById(id).lean()
    naoImplementado('LivroRepository.buscarPorId');
  },

  /** Usado pelo carrinho e pelo checkout para pegar título/preço de vários livros de uma vez. */
  async buscarPorIds(ids: string[]): Promise<Livro[]> {
    // TODO: LivroModel.find({ _id: { $in: ids } }).lean()
    naoImplementado('LivroRepository.buscarPorIds');
  },

  async listarCategorias(): Promise<string[]> {
    // TODO: LivroModel.distinct('categorias')
    naoImplementado('LivroRepository.listarCategorias');
  },
};
