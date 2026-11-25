import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * Livro no MongoDB. O _id é o volumeId da Google Books API e é o mesmo
 * `livroId` usado no estoque (PostgreSQL) e no carrinho (Redis).
 */
const livroSchema = new Schema(
  {
    _id: { type: String, required: true },
    titulo: { type: String, required: true },
    subtitulo: String,
    autores: { type: [String], default: [] },
    categorias: { type: [String], default: [], index: true },
    descricao: String,
    editora: String,
    dataPublicacao: String,
    paginas: Number,
    isbn: String,
    idioma: String,
    capaUrl: String,
    preco: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

// Índice de texto para a busca por título ou autor ($text).
// 'none' desliga stemming/stopwords: o acervo mistura idiomas.
livroSchema.index(
  { titulo: 'text', autores: 'text' },
  { default_language: 'none', weights: { titulo: 3, autores: 2 } },
);

export type Livro = InferSchemaType<typeof livroSchema>;
export const LivroModel = model('Livro', livroSchema, 'livros');
