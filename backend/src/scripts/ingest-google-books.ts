/**
 * Carrega livros da Google Books API para o MongoDB (catálogo) e cria o
 * estoque inicial no PostgreSQL. Pode rodar mais de uma vez: faz upsert no
 * catálogo e não mexe no estoque de livros que já existem.
 *
 *   docker compose exec api npm run ingest
 *   docker compose exec api npm run ingest -- 20      # 20 livros por categoria (padrão 40, máx 40)
 */
import { env } from '../config/env';
import { prisma } from '../db/postgres';
import { conectarMongo, mongoose } from '../db/mongo';
import { LivroModel } from '../modules/catalogo/livro.model';

const CATEGORIAS = [
  'fiction',
  'history',
  'science',
  'business',
  'poetry',
  'biography',
  'computers',
  'cooking',
  'children',
  'religion',
] as const;

const PADRAO_POR_CATEGORIA = 40;
const MAX_POR_CATEGORIA = 40;
const TAMANHO_LOTE = 100;
const API_URL = 'https://www.googleapis.com/books/v1/volumes';

interface GoogleBook {
  id?: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    categories?: string[];
    description?: string;
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    language?: string;
    industryIdentifiers?: Array<{ type?: string; identifier?: string }>;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

interface GoogleBooksResponse {
  items?: GoogleBook[];
  totalItems?: number;
  error?: { message?: string };
}

interface LivroParaIngestao {
  _id: string;
  titulo: string;
  subtitulo?: string;
  autores: string[];
  categorias: string[];
  descricao?: string;
  editora?: string;
  dataPublicacao?: string;
  paginas?: number;
  isbn?: string;
  idioma?: string;
  capaUrl?: string;
  preco: number;
  precoOrigem: 'sintetico';
}

function lerLimite(): number {
  const argumento = process.argv[2];
  if (argumento === undefined) return PADRAO_POR_CATEGORIA;

  const limite = Number(argumento);
  if (!Number.isInteger(limite) || limite < 1 || limite > MAX_POR_CATEGORIA) {
    throw new Error(`Informe um número inteiro entre 1 e ${MAX_POR_CATEGORIA}.`);
  }
  return limite;
}

function limparTexto(texto: string | undefined): string | undefined {
  if (!texto) return undefined;
  const limpo = texto
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return limpo || undefined;
}

function precoSintetico(paginas: number | undefined, dataPublicacao: string | undefined): number {
  const quantidadePaginas = paginas && Number.isFinite(paginas) && paginas > 0 ? paginas : 200;
  const anoEncontrado = dataPublicacao?.match(/^\d{4}/)?.[0];
  const ano = anoEncontrado ? Number(anoEncontrado) : 2000;
  const preco = 10 + quantidadePaginas * 0.05 + Math.max(0, ano - 2000) * 0.5;
  return Math.round(preco * 100) / 100;
}

function mapearLivro(item: GoogleBook, categoriaConsulta: string): LivroParaIngestao | null {
  const info = item.volumeInfo;
  const id = item.id?.trim();
  const titulo = limparTexto(info?.title);
  if (!id || !titulo) return null;

  const categorias = [...new Set([...(info?.categories ?? []), categoriaConsulta])]
    .map((categoria) => categoria.trim())
    .filter(Boolean);
  const isbn = info?.industryIdentifiers?.find((identificador) => identificador.type === 'ISBN_13')
    ?.identifier ?? info?.industryIdentifiers?.find((identificador) => identificador.type === 'ISBN_10')?.identifier;
  const capa = info?.imageLinks?.thumbnail ?? info?.imageLinks?.smallThumbnail;
  const preco = precoSintetico(info?.pageCount, info?.publishedDate);

  return {
    _id: id,
    titulo,
    subtitulo: limparTexto(info?.subtitle),
    autores: (info?.authors ?? []).map((autor) => autor.trim()).filter(Boolean),
    categorias,
    descricao: limparTexto(info?.description),
    editora: limparTexto(info?.publisher),
    dataPublicacao: info?.publishedDate,
    paginas: info?.pageCount,
    isbn,
    idioma: info?.language,
    capaUrl: capa?.replace(/^http:\/\//i, 'https://'),
    preco,
    precoOrigem: 'sintetico',
  };
}

async function buscarCategoria(
  categoria: string,
  limite: number,
  livrosPorId: Map<string, LivroParaIngestao>,
): Promise<{ resultados: number; adicionados: number }> {
  let inicio = 0;
  let resultados = 0;
  let adicionados = 0;

  while (adicionados < limite && inicio < 1000) {
    const parametros = new URLSearchParams({
      q: `subject:${categoria}`,
      maxResults: '40',
      startIndex: String(inicio),
      printType: 'books',
      langRestrict: 'en',
    });
    if (env.GOOGLE_BOOKS_API_KEY) parametros.set('key', env.GOOGLE_BOOKS_API_KEY);

    const resposta = await fetch(`${API_URL}?${parametros}`, {
      signal: AbortSignal.timeout(20_000),
    });
    const dados = (await resposta.json()) as GoogleBooksResponse;
    if (!resposta.ok) {
      throw new Error(`Google Books (${categoria}): ${dados.error?.message ?? resposta.statusText}`);
    }

    const itens = dados.items ?? [];
    if (itens.length === 0) break;
    for (const item of itens) {
      resultados++;
      const livro = mapearLivro(item, categoria);
      if (!livro) continue;

      const existente = livrosPorId.get(livro._id);
      if (existente) {
        existente.categorias = [...new Set([...existente.categorias, ...livro.categorias])];
      } else if (adicionados < limite) {
        livrosPorId.set(livro._id, livro);
        adicionados++;
      }

      if (adicionados >= limite) break;
    }
    inicio += itens.length;
    if (dados.totalItems !== undefined && inicio >= dados.totalItems) break;
  }

  return { resultados, adicionados };
}

function estoqueInicial(): number {
  return Math.random() < 0.1 ? 0 : Math.floor(Math.random() * 26);
}

async function inserirEmLotes<T>(itens: T[], inserir: (lote: T[]) => Promise<void>): Promise<void> {
  for (let inicio = 0; inicio < itens.length; inicio += TAMANHO_LOTE) {
    await inserir(itens.slice(inicio, inicio + TAMANHO_LOTE));
  }
}

async function main() {
  const limite = lerLimite();
  const livrosPorId = new Map<string, LivroParaIngestao>();

  for (const categoria of CATEGORIAS) {
    const { resultados, adicionados } = await buscarCategoria(categoria, limite, livrosPorId);
    console.log(`${categoria}: ${adicionados} livros únicos selecionados (${resultados} resultados analisados)`);
  }

  const livros = [...livrosPorId.values()];

  console.log(`\nPrévia: ${livros.length} livros que serão enviados aos bancos`);
  console.table(
    livros.map((livro) => ({
      livroId: livro._id,
      titulo: livro.titulo,
      autores: livro.autores.join(', '),
      categorias: livro.categorias.join(', '),
      paginas: livro.paginas ?? 'não informado',
      ano: livro.dataPublicacao?.slice(0, 4) ?? 'não informado',
      preco: `R$ ${livro.preco.toFixed(2)}`,
    })),
  );

  await conectarMongo();

  await inserirEmLotes(livros, async (lote) => {
    await LivroModel.bulkWrite(
      lote.map(({ _id, ...dados }) => ({
        updateOne: { filter: { _id }, update: { $set: dados }, upsert: true },
      })),
      { ordered: false },
    );
  });

  // Insere apenas chaves novas: reexecutar a ingestão não reseta estoque vendido.
  await inserirEmLotes(livros, async (lote) => {
    await prisma.estoque.createMany({
      data: lote.map((livro) => ({ livroId: livro._id, quantidade: estoqueInicial() })),
      skipDuplicates: true,
    });
  });

  console.log(`Ingestão concluída: ${livros.length} livros únicos enviados ao catálogo.`);
}

main()
  .catch((erro: unknown) => {
    console.error('Falha na ingestão:', erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([mongoose.disconnect(), prisma.$disconnect()]);
  });
