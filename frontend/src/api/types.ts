// Espelho dos contratos da API (backend/src/modules/*/*.service.ts).
// Mudou lá, muda aqui.

export interface Paginado<T> {
  itens: T[];
  total: number;
  pagina: number;
  porPagina: number;
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
  estoque: number;
  disponivel: boolean;
}

export interface ItemCarrinho {
  livroId: string;
  titulo: string;
  capaUrl?: string | null;
  precoUnitario: number;
  quantidade: number;
  subtotal: number;
}

export interface Carrinho {
  itens: ItemCarrinho[];
  total: number;
}

export interface ItemPedido {
  id: number;
  livroId: string;
  titulo: string;
  precoUnitario: string; // Decimal do Prisma chega como string no JSON
  quantidade: number;
}

export interface Pedido {
  id: string;
  status: 'CONFIRMADO' | 'CANCELADO';
  total: string; // Decimal do Prisma chega como string no JSON
  criadoEm: string;
  itens: ItemPedido[];
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
}

export interface Sessao {
  token: string;
  usuario: Usuario;
}

export interface Health {
  ok: boolean;
  postgres: boolean;
  mongo: boolean;
  redis: boolean;
}
