// Valores aceitos nas colunas `text` de pedido e pagamento.
// O banco guarda texto livre; quem garante os valores é o código (e o zod nos controllers).

export const STATUS_PEDIDO = ['CONFIRMADO', 'CANCELADO'] as const;
export type StatusPedido = (typeof STATUS_PEDIDO)[number];

export const METODOS_PAGAMENTO = ['PIX', 'CARTAO', 'BOLETO'] as const;
export type MetodoPagamento = (typeof METODOS_PAGAMENTO)[number];

/** Pagamento é simulado: no checkout ele já nasce APROVADO. */
export const STATUS_PAGAMENTO = ['PENDENTE', 'APROVADO', 'RECUSADO'] as const;
export type StatusPagamento = (typeof STATUS_PAGAMENTO)[number];
