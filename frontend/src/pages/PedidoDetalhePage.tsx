import { useCallback } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { pedidosApi } from '../api/endpoints';
import { mensagemApi } from '../api/erros';
import type { Pedido } from '../api/types';
import { useConsulta } from '../api/useConsulta';
import { useAuth } from '../auth/AuthContext';
import { Carregamento, EstadoPagina, Mensagem } from '../components/EstadoPagina';
import { EtapasCompra } from '../components/EtapasCompra';
import { ResumoPedido } from '../components/ResumoPedido';
import { demonstrarFluxos } from '../config/desenvolvimento';
import { formatarData, formatarMoeda, metodoPagamento, statusPedido } from '../formatos';

export function PedidoDetalhePage() {
  const { id = '' } = useParams();
  const { usuario } = useAuth();
  const location = useLocation();
  const numero = Number(id);
  const confirmacao = location.state?.confirmacao as { usuarioId: number; pedido: Pedido } | undefined;
  const recebido = confirmacao?.usuarioId === usuario?.id && confirmacao?.pedido.id === numero ? confirmacao.pedido : null;
  const carregar = useCallback(async () => {
    if (recebido) return recebido;
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(numero) || numero < 1) throw new ApiError(404, 'Pedido não encontrado.');
    return pedidosApi.obter(numero);
  }, [id, numero, recebido]);
  const { dados, erro, carregando, recarregar } = useConsulta(carregar, true);
  const naoEncontrado = erro instanceof ApiError && erro.status === 404;

  return (
    <section className="pagina-loja">
      {recebido && <EtapasCompra confirmacao />}
      <h1 className="titulo-pagina">{dados ? `Pedido #${dados.id}` : 'Detalhes do pedido'}</h1>
      {carregando && <Carregamento texto="Carregando o pedido…" />}
      {erro != null && (
        <EstadoPagina titulo={naoEncontrado ? 'Pedido não encontrado' : 'Detalhes indisponíveis'}
          texto={mensagemApi(erro, 'Não foi possível consultar este pedido.', 'A consulta de um pedido ainda não foi implementada no back-end.')}
          erro onTentarNovamente={naoEncontrado ? undefined : recarregar}>
          <Link className="botao botao-secundario" to="/pedidos">Meus pedidos</Link>
        </EstadoPagina>
      )}
      {dados && (
        <>
          {recebido && dados.status === 'CONFIRMADO' && <Mensagem sucesso>{demonstrarFluxos ? 'Pedido de demonstração confirmado.' : 'Seu pedido foi confirmado!'}</Mensagem>}
          <div className="colunas-compra">
            <section className="painel dados-pedido">
              <h2>Dados da compra</h2>
              <dl>
                <div><dt>Data</dt><dd><time dateTime={dados.criadoEm}>{formatarData(dados.criadoEm)}</time></dd></div>
                <div><dt>Status</dt><dd><span className={`status-pedido ${dados.status === 'CANCELADO' ? 'status-cancelado' : ''}`}>{statusPedido[dados.status]}</span></dd></div>
                <div><dt>Pagamento simulado</dt><dd>{dados.pagamento ? `${metodoPagamento[dados.pagamento.metodo]} · ${formatarMoeda(dados.pagamento.valor)}` : 'Não informado'}</dd></div>
              </dl>
            </section>
            <ResumoPedido itens={dados.itens} total={dados.total} />
          </div>
          <div className="acoes-pedido">
            <Link className="botao" to="/">Voltar ao catálogo</Link>
            <Link className="botao botao-secundario" to="/pedidos">Meus pedidos</Link>
          </div>
        </>
      )}
    </section>
  );
}
