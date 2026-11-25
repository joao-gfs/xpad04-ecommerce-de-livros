import { api } from './client';
import type {
  Carrinho,
  Health,
  LivroDetalhe,
  LivroResumo,
  MetodoPagamento,
  Paginado,
  Pedido,
  Sessao,
  Usuario,
} from './types';

export const healthApi = {
  status: () => api<Health>('/health'),
};

export const authApi = {
  cadastro: (dados: { nome: string; email: string; senha: string }) => api<Sessao>('/auth/cadastro', 'POST', dados),
  login: (dados: { email: string; senha: string }) => api<Sessao>('/auth/login', 'POST', dados),
  me: () => api<Usuario>('/auth/me'),
};

export const catalogoApi = {
  categorias: () => api<string[]>('/categorias'),
  livros: (filtro: { categoria?: string; busca?: string; pagina?: number; porPagina?: number } = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(filtro)) if (v !== undefined && v !== '') qs.set(k, String(v));
    return api<Paginado<LivroResumo>>(`/livros?${qs}`);
  },
  livro: (id: string) => api<LivroDetalhe>(`/livros/${encodeURIComponent(id)}`),
};

export const carrinhoApi = {
  obter: () => api<Carrinho>('/carrinho'),
  adicionar: (livroId: string, quantidade = 1) => api<Carrinho>('/carrinho/itens', 'POST', { livroId, quantidade }),
  atualizar: (livroId: string, quantidade: number) =>
    api<Carrinho>(`/carrinho/itens/${encodeURIComponent(livroId)}`, 'PATCH', { quantidade }),
  remover: (livroId: string) => api<Carrinho>(`/carrinho/itens/${encodeURIComponent(livroId)}`, 'DELETE'),
  limpar: () => api<void>('/carrinho', 'DELETE'),
};

export const pedidosApi = {
  checkout: (metodo: MetodoPagamento) => api<Pedido>('/pedidos', 'POST', { metodo }),
  listar: () => api<Pedido[]>('/pedidos'),
  obter: (id: number) => api<Pedido>(`/pedidos/${id}`),
};
