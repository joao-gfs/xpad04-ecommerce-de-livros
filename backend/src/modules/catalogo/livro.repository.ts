import { LivroModel, type Livro } from './livro.model';

export interface FiltroLivros {
  categoria?: string;
  autor?: string;
  titulo?: string;
  descricao?: string;
  editora?: string;
  precoMin?: number;
  precoMax?: number;
  busca?: string; // título ou autor
  pagina: number; // começa em 1
  porPagina: number;
}

/** Escapa símbolos de regex digitados pelo usuário. */
function escapar(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Regex 'contém o texto' ignorando maiúsculas */
function contem(texto: string): RegExp {
  return new RegExp(escapar(texto), 'i');
}

/** Acesso ao catálogo no MongoDB (Mongoose). */
export const LivroRepository = {
  async listar(filtro: FiltroLivros): Promise<{ itens: Livro[]; total: number }> {
    const query: Record<string, unknown> = {};
   
    if (filtro.categoria) query.categorias = filtro.categoria;
    if (filtro.autor) query.autores = contem(filtro.autor);
    if (filtro.titulo) query.titulo = contem(filtro.titulo);
    if (filtro.descricao) query.descricao = contem(filtro.descricao);
    if (filtro.editora) query.editora = contem(filtro.editora);

    if (filtro.precoMin !== undefined || filtro.precoMax !== undefined) {
      const faixa: Record<string, number> = {};
      if (filtro.precoMin !== undefined) faixa.$gte = filtro.precoMin;
      if (filtro.precoMax !== undefined) faixa.$lte = filtro.precoMax;
      query.preco = faixa;
    }

    if (filtro.busca) {
      const rx = contem(filtro.busca);
      query.$or = [{ titulo: rx }, { autores: rx }];
    }

    const skip = (filtro.pagina - 1) * filtro.porPagina;

    const collation = { locale: 'pt', strength: 2 };

    const [itens, total] = await Promise.all([
      LivroModel.find(query)
        .collation(collation)
        .sort({ titulo: 1 })
        .skip(skip)
        .limit(filtro.porPagina)
        .lean(),
      LivroModel.countDocuments(query).collation(collation),
    ]);

    return{ itens, total };
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
    // filter(Boolean) descarta nulos/vazios que o MongoDB pode retornar
    return (categorias as string[]).filter(Boolean).sort((a, b) => a.localeCompare(b));
  },
};
