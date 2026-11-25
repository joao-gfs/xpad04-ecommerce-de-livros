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

export type MetodoPagamento = 'PIX' | 'CARTAO' | 'BOLETO';

export interface ItemPedido {
  livroId: string;
  titulo: string | null; // vem do MongoDB; null se o livro saiu do catálogo
  capaUrl: string | null;
  precoUnitario: number; // preço congelado na compra (Postgres)
  quantidade: number;
  subtotal: number;
}

export interface Pagamento {
  metodo: MetodoPagamento;
  valor: number;
  status: 'PENDENTE' | 'APROVADO' | 'RECUSADO';
}

export interface Pedido {
  id: number;
  status: 'CONFIRMADO' | 'CANCELADO';
  total: number;
  criadoEm: string; // ISO
  itens: ItemPedido[];
  pagamento: Pagamento | null;
}

export interface Usuario {
  id: number;
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
