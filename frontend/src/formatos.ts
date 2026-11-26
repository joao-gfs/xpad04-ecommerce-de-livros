import type { MetodoPagamento, Pedido } from './api/types';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dataEHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });

export const formatarMoeda = (valor: number) => moeda.format(valor);

export function formatarData(valor: string) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? 'Data não informada' : dataEHora.format(data);
}

export const metodoPagamento: Record<MetodoPagamento, string> = { PIX: 'Pix', CARTAO: 'Cartão', BOLETO: 'Boleto' };
export const statusPedido: Record<Pedido['status'], string> = { CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado' };
