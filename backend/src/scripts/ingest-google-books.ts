/**
 * Carrega livros da Google Books API para o MongoDB (catálogo) e cria o
 * estoque inicial no PostgreSQL. Pode rodar mais de uma vez: faz upsert no
 * catálogo e não mexe no estoque de livros que já existem.
 *
 *   docker compose exec api npm run ingest
 *   docker compose exec api npm run ingest -- 20      # 20 livros por categoria (padrão 40, máx 40)
 */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { conectarMongo } from '../db/mongo';
import { prisma } from '../db/postgres';
import { LivroModel } from '../modules/catalogo/livro.model';

const CATEGORIAS: { nome: string; consulta: string }[] = [
  { nome: 'Ficção', consulta: 'subject:fiction' },
  { nome: 'Fantasia', consulta: 'subject:fantasy' },
  { nome: 'Romance', consulta: 'subject:romance' },
  { nome: 'Mistério', consulta: 'subject:mystery' },
  { nome: 'Ciência', consulta: 'subject:science' },
  { nome: 'História', consulta: 'subject:history' },
  { nome: 'Computação', consulta: 'subject:computers' },
  { nome: 'Negócios', consulta: 'subject:business' },
  { nome: 'Biografia', consulta: 'subject:biography' },
  { nome: 'Infantojuvenil', consulta: 'subject:juvenile' },
];

interface GoogleVolume {
  id: string;
  volumeInfo: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    language?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
  saleInfo?: { listPrice?: { amount: number; currencyCode: string } };
}

const porCategoria = Math.min(Number(process.argv[2]) || 40, 40);
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function buscar(consulta: string): Promise<GoogleVolume[]> {
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', consulta);
  url.searchParams.set('maxResults', String(porCategoria));
  url.searchParams.set('printType', 'books');
  if (env.GOOGLE_BOOKS_API_KEY) url.searchParams.set('key', env.GOOGLE_BOOKS_API_KEY);

  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const res = await fetch(url);
    if (res.ok) {
      const json = (await res.json()) as { items?: GoogleVolume[] };
      return json.items ?? [];
    }
    const corpo = await res.text();
    // Cota diária esgotada não melhora com retry. Sem chave, a cota é global e quase sempre está estourada.
    if (res.status === 429 && corpo.includes('per day')) {
      throw new Error(
        env.GOOGLE_BOOKS_API_KEY
          ? 'Cota diária da sua GOOGLE_BOOKS_API_KEY esgotada. Tente amanhã ou use outra chave.'
          : 'Sem GOOGLE_BOOKS_API_KEY a cota é compartilhada e está esgotada. Crie uma chave (ver README) e coloque no .env.',
      );
    }
    if (res.status === 429 || res.status >= 500) {
      console.warn(`  HTTP ${res.status}, tentando de novo (${tentativa}/3)...`);
      await esperar(2000 * tentativa);
      continue;
    }
    throw new Error(`Google Books respondeu ${res.status}: ${corpo}`);
  }
  throw new Error('Google Books indisponível depois de 3 tentativas.');
}

/** Preço em BRL quando a API informa; senão um valor estável derivado do id (19,90 a 149,90). */
function precoDe(v: GoogleVolume): number {
  const lp = v.saleInfo?.listPrice;
  if (lp?.currencyCode === 'BRL' && lp.amount > 0) return lp.amount;
  let h = 0;
  for (const c of v.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return Math.round((19.9 + (h % 13000) / 100) * 100) / 100;
}

/** Estoque inicial entre 0 e 25; ~10% sai zerado para testar "indisponível". */
function estoqueInicial(): number {
  return Math.random() < 0.1 ? 0 : 1 + Math.floor(Math.random() * 25);
}

async function main() {
  await conectarMongo();
  await LivroModel.init(); // garante os índices

  let totalLivros = 0;
  const ids = new Set<string>();

  for (const cat of CATEGORIAS) {
    console.log(`> ${cat.nome} (${cat.consulta})`);
    const volumes = (await buscar(cat.consulta)).filter((v) => v.volumeInfo.title);

    const ops = volumes.map((v) => {
      const i = v.volumeInfo;
      const isbn =
        i.industryIdentifiers?.find((x) => x.type === 'ISBN_13')?.identifier ??
        i.industryIdentifiers?.find((x) => x.type === 'ISBN_10')?.identifier;
      ids.add(v.id);
      return {
        updateOne: {
          filter: { _id: v.id },
          update: {
            $set: {
              titulo: i.title!,
              subtitulo: i.subtitle,
              autores: i.authors ?? [],
              descricao: i.description,
              editora: i.publisher,
              dataPublicacao: i.publishedDate,
              paginas: i.pageCount,
              isbn,
              idioma: i.language,
              capaUrl: (i.imageLinks?.thumbnail ?? i.imageLinks?.smallThumbnail)?.replace('http://', 'https://'),
              preco: precoDe(v),
            },
            // o mesmo livro pode aparecer em mais de uma categoria
            $addToSet: { categorias: cat.nome },
          },
          upsert: true,
        },
      };
    });

    if (ops.length) await LivroModel.bulkWrite(ops);
    totalLivros += ops.length;
    console.log(`  ${ops.length} livros`);
    await esperar(300);
  }

  const { count } = await prisma.estoque.createMany({
    data: [...ids].map((livroId) => ({ livroId, quantidade: estoqueInicial() })),
    skipDuplicates: true, // não sobrescreve estoque de quem já existia
  });

  console.log(`\nCatálogo: ${ids.size} livros distintos (${totalLivros} upserts). Estoque novo: ${count} registros.`);
}

main()
  .catch((err) => {
    console.error(`\nFalhou: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([mongoose.disconnect(), prisma.$disconnect()]);
  });
