import type { LivroDetalhe, LivroResumo, Paginado } from '../api/types';
import type { FiltrosCatalogo } from '../catalogo/filtros';

// Livros, preços e capas ilustrativos para a demonstração do catálogo.
export const livrosDemonstracao: LivroResumo[] = [
  { id: 'demo-dom-casmurro', titulo: 'Dom Casmurro', autores: ['Machado de Assis'], categorias: ['Romance'], preco: 39.90 },
  { id: 'demo-hobbit', titulo: 'O Hobbit', autores: ['J. R. R. Tolkien'], categorias: ['Fantasia'], preco: 54.90 },
  { id: 'demo-1984', titulo: '1984', autores: ['George Orwell'], categorias: ['Ficção'], preco: 32.90 },
  { id: 'demo-orgulho', titulo: 'Orgulho e Preconceito', autores: ['Jane Austen'], categorias: ['Romance'], preco: 42.90 },
  { id: 'demo-principe', titulo: 'O Pequeno Príncipe', autores: ['Antoine de Saint-Exupéry'], categorias: ['Fantasia'], preco: 29.90 },
  { id: 'demo-revolucao', titulo: 'A Revolução dos Bichos', autores: ['George Orwell'], categorias: ['Ficção'], preco: 24.90 },
  { id: 'demo-memorias', titulo: 'Memórias Póstumas de Brás Cubas', autores: ['Machado de Assis'], categorias: ['Romance'], preco: 36.90 },
  { id: 'demo-alice', titulo: 'Alice no País das Maravilhas', autores: ['Lewis Carroll'], categorias: ['Fantasia'], preco: 28.90 },
  { id: 'demo-frankenstein', titulo: 'Frankenstein', autores: ['Mary Shelley'], categorias: ['Ficção'], preco: 34.90 },
  { id: 'demo-tempo', titulo: 'Uma Breve História do Tempo', autores: ['Stephen Hawking'], categorias: ['Ciência'], preco: 49.90 },
  { id: 'demo-codigo', titulo: 'Código Limpo', autores: ['Robert C. Martin'], categorias: ['Tecnologia'], preco: 89.90 },
  { id: 'demo-brasil', titulo: 'História do Brasil', autores: ['Boris Fausto'], categorias: ['História'], preco: 64.90 },
];

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

export function listarCategoriasDemonstracao(): string[] {
  return [...new Set(livrosDemonstracao.flatMap((livro) => livro.categorias))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function listarLivrosDemonstracao(filtro: FiltrosCatalogo): Paginado<LivroResumo> {
  const busca = normalizar(filtro.busca);
  const descricao = normalizar(filtro.descricao ?? '');
  const editora = normalizar(filtro.editora ?? '');
  const filtrados = livrosDemonstracao.filter((livro) =>
    (!filtro.categoria || livro.categorias.includes(filtro.categoria)) &&
    (!busca || [livro.titulo, ...livro.autores].some((texto) => normalizar(texto).includes(busca))) &&
    (!descricao || normalizar(sinopses[livro.id] ?? '').includes(descricao)) &&
    (!editora || normalizar(editoras[livro.id] ?? '').includes(editora)) &&
    (filtro.precoMin === undefined || livro.preco >= filtro.precoMin) &&
    (filtro.precoMax === undefined || livro.preco <= filtro.precoMax),
  );
  const inicio = (filtro.pagina - 1) * filtro.porPagina;
  return { itens: filtrados.slice(inicio, inicio + filtro.porPagina), total: filtrados.length, pagina: filtro.pagina, porPagina: filtro.porPagina };
}

const sinopses: Record<string, string> = {
  'demo-dom-casmurro': 'Bentinho revisita a infância e seu casamento com Capitu em um relato marcado pela memória e pelo ciúme.',
  'demo-hobbit': 'O hobbit Bilbo Bolseiro sai do Condado para uma jornada com treze anões em busca de um tesouro.',
  'demo-1984': 'Winston Smith vive sob a vigilância do Estado e tenta preservar sua liberdade de pensamento.',
  'demo-orgulho': 'Elizabeth Bennet e o senhor Darcy precisam rever suas primeiras impressões entre bailes e pressões familiares.',
  'demo-principe': 'Um piloto encontra no deserto um pequeno viajante que lhe conta sobre os planetas que visitou.',
  'demo-revolucao': 'Animais assumem o controle de uma fazenda e veem suas promessas de igualdade transformarem-se sob uma nova liderança.',
  'demo-memorias': 'Brás Cubas narra a própria vida depois da morte, com humor e ironia sobre a sociedade do seu tempo.',
  'demo-alice': 'Alice segue um coelho e entra em um mundo de personagens e regras inesperadas.',
  'demo-frankenstein': 'Um cientista dá vida a uma criatura e enfrenta as consequências de sua experiência.',
  'demo-tempo': 'Uma introdução às ideias sobre o universo, os buracos negros e a natureza do tempo.',
  'demo-codigo': 'Princípios e exemplos para escrever código legível e facilitar sua manutenção.',
  'demo-brasil': 'Um panorama da história política e social do Brasil, da colonização ao período republicano.',
};

const editoras: Record<string, string> = {
  'demo-dom-casmurro': 'Companhia das Letras',
  'demo-memorias': 'Companhia das Letras',
  'demo-1984': 'Companhia das Letras',
  'demo-hobbit': 'HarperCollins',
};

export function obterLivroDemonstracao(id: string): LivroDetalhe | null {
  const livro = livrosDemonstracao.find((item) => item.id === id);
  if (!livro) return null;
  const estoque = livro.id === 'demo-frankenstein' ? 0 : 8;
  return { ...livro, descricao: sinopses[id], editora: editoras[id], estoque, disponivel: estoque > 0 };
}
