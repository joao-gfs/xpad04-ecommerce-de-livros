import type { ReactNode } from 'react';
import type { ItemPedido } from '../api/types';
import { formatarMoeda } from '../formatos';

export function ResumoPedido({ itens, total, mostrarLivros = true, children }: {
  itens: Pick<ItemPedido, 'livroId' | 'titulo' | 'quantidade' | 'precoUnitario' | 'subtotal'>[];
  total: number;
  mostrarLivros?: boolean;
  children?: ReactNode;
}) {
  const unidades = itens.reduce((soma, item) => soma + item.quantidade, 0);
  return (
    <section className="resumo-pedido painel" aria-label="Resumo do pedido">
      <h2>Resumo do pedido</h2>
      <p className="texto-suave">{unidades} {unidades === 1 ? 'livro' : 'livros'}</p>
      {mostrarLivros && (
        <ul className="resumo-itens">
          {itens.map((item) => (
            <li key={item.livroId}>
              <div>
                <strong>{item.titulo ?? `Livro ${item.livroId}`}</strong>
                <span>{item.quantidade} × {formatarMoeda(item.precoUnitario)}</span>
              </div>
              <span>{formatarMoeda(item.subtotal)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="resumo-total"><span>Total</span><strong>{formatarMoeda(total)}</strong></div>
      {children && <div className="resumo-acoes">{children}</div>}
    </section>
  );
}
