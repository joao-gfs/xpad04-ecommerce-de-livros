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
    const query: Record<string, unknown> = {};

    if (filtro.categoria) {
      query['categorias'] = filtro.categoria;
    }

    if (filtro.busca) {
      query['$text'] = { $search: filtro.busca };
    }

    const skip = (filtro.pagina - 1) * filtro.porPagina;

    // $text e collation são incompatíveis no MongoDB: só aplica o sort alfabético sem busca por texto.
    const findQuery = LivroModel.find(query);
    if (!filtro.busca) {
      findQuery.collation({ locale: 'pt', strength: 2 }).sort({ titulo: 1 });
    }

    const [itens, total] = await Promise.all([
      findQuery.skip(skip).limit(filtro.porPagina).lean(),
      LivroModel.countDocuments(query),
    ]);

    return { itens, total };
  },

  async buscarPorId(id: string): Promise<Livro | null> {
    return LivroModel.findById(id).lean();
  },

  /** Usado pelo carrinho e pelo checkout para pegar título/preço de vários livros de uma vez. */
  async buscarPorIds(ids: string[]): Promise<Livro[]> {
    return LivroModel.find({ _id: { $in: ids } }).lean();
  },

  async listarCategorias(): Promise<string[]> {
    const categorias = await LivroModel.distinct('categorias');
    return (categorias as string[]).filter(Boolean).sort();
  },
};
