import { Link } from 'react-router-dom';
import type { ItemCarrinho as DadosItem } from '../api/types';
import { formatarMoeda } from '../formatos';
import { CapaLivro } from './CapaLivro';
import { ControleQuantidade } from './ControleQuantidade';
import { Icone } from './Icone';

export function ItemCarrinho({ item, ocupado, onMudarQuantidade, onRemover }: {
  item: DadosItem;
  ocupado: boolean;
  onMudarQuantidade: (quantidade: number) => void;
  onRemover: () => void;
}) {
  return (
    <article className="item-carrinho painel">
      <div className="capa-mini"><CapaLivro id={item.livroId} titulo={item.titulo} capaUrl={item.capaUrl} /></div>
      <div className="item-carrinho-info">
        <h2><Link to={`/livros/${encodeURIComponent(item.livroId)}`}>{item.titulo}</Link></h2>
        <p>{formatarMoeda(item.precoUnitario)} por unidade</p>
        <ControleQuantidade titulo={item.titulo} quantidade={item.quantidade} desativado={ocupado} onMudar={onMudarQuantidade} />
      </div>
      <div className="item-carrinho-acoes">
        <span>Subtotal <strong>{formatarMoeda(item.subtotal)}</strong></span>
        <button type="button" className="botao-remover" aria-label={`Remover ${item.titulo}`} disabled={ocupado} onClick={onRemover}>
          <Icone nome="remover" /> Remover
        </button>
      </div>
    </article>
  );
}
