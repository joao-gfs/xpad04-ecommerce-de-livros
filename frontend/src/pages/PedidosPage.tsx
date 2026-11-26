import { Link } from 'react-router-dom';
import { pedidosApi } from '../api/endpoints';
import { mensagemApi } from '../api/erros';
import { useConsulta } from '../api/useConsulta';
import { Carregamento, EstadoPagina } from '../components/EstadoPagina';
import { formatarData, formatarMoeda, statusPedido } from '../formatos';

export function PedidosPage() {
  const { dados, erro, carregando, recarregar } = useConsulta(pedidosApi.listar, true);

  return (
    <section className="pagina-loja">
      <h1 className="titulo-pagina">Meus pedidos</h1>
      {carregando && <Carregamento texto="Carregando seus pedidos…" />}
      {erro != null && <EstadoPagina titulo="Histórico indisponível" texto={mensagemApi(erro, 'Não foi possível consultar seus pedidos.', 'O histórico de pedidos ainda não foi implementado no back-end.')} erro onTentarNovamente={recarregar} />}
      {dados && (dados.length === 0 ? (
        <EstadoPagina titulo="Você ainda não fez pedidos" texto="Seus pedidos aparecerão aqui após a finalização da compra." />
      ) : (
        <ul className="historico-pedidos">
          {dados.map((pedido) => (
            <li key={pedido.id} className="pedido-linha painel">
              <div><h2>Pedido #{pedido.id}</h2><time dateTime={pedido.criadoEm}>{formatarData(pedido.criadoEm)}</time></div>
              <span className={`status-pedido ${pedido.status === 'CANCELADO' ? 'status-cancelado' : ''}`}>{statusPedido[pedido.status]}</span>
              <strong className="pedido-total">{formatarMoeda(pedido.total)}</strong>
              <Link className="botao botao-secundario" to={`/pedidos/${pedido.id}`} aria-label={`Ver detalhes do pedido ${pedido.id}`}>Ver detalhes</Link>
            </li>
          ))}
        </ul>
      ))}
    </section>
  );
}
