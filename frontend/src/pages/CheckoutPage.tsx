import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mensagemApi } from '../api/erros';
import type { MetodoPagamento } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useCarrinho } from '../carrinho/CarrinhoContext';
import { Carregamento, EstadoPagina, Mensagem } from '../components/EstadoPagina';
import { EtapasCompra } from '../components/EtapasCompra';
import { ResumoPedido } from '../components/ResumoPedido';
import { metodoPagamento } from '../formatos';

const metodos: MetodoPagamento[] = ['PIX', 'CARTAO', 'BOLETO'];

export function CheckoutPage() {
  const { usuario } = useAuth();
  const { dados, erro, carregando, ocupado, recarregar, finalizar } = useCarrinho();
  const [metodo, setMetodo] = useState<MetodoPagamento>('PIX');
  const [falha, setFalha] = useState('');
  const navigate = useNavigate();

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (ocupado || !usuario || !dados?.itens.length) return;
    setFalha('');
    try {
      const pedido = await finalizar(metodo);
      if (pedido) navigate(`/pedidos/${pedido.id}`, { replace: true, state: { confirmacao: { pedido, usuarioId: usuario.id } } });
    } catch (motivo) {
      setFalha(mensagemApi(motivo, 'Não foi possível confirmar o pedido. Consulte o histórico antes de tentar novamente.', 'A criação de pedidos ainda não foi implementada no back-end.'));
    }
  }

  return (
    <section className="pagina-loja">
      <EtapasCompra />
      <h1 className="titulo-pagina">Finalizar compra</h1>
      {carregando && <Carregamento texto="Carregando os itens do pedido…" />}
      {erro != null && (
        <EstadoPagina titulo="Checkout indisponível" texto={mensagemApi(erro, 'Não foi possível consultar os itens do pedido.', 'O checkout precisa do serviço de carrinho, que ainda está pendente.')} erro onTentarNovamente={recarregar}>
          <Link className="botao botao-secundario" to="/carrinho">Voltar ao carrinho</Link>
        </EstadoPagina>
      )}
      {dados && (dados.itens.length === 0 ? (
        <EstadoPagina titulo="Seu carrinho está vazio" texto="Adicione um livro antes de finalizar a compra." />
      ) : (
        <form className="colunas-compra" onSubmit={confirmar} aria-busy={ocupado}>
          <div className="painel painel-pagamento">
            <fieldset disabled={ocupado} aria-describedby="explicacao-pagamento">
              <legend>Forma de pagamento</legend>
              <p id="explicacao-pagamento" className="texto-suave">Pagamento simulado para o trabalho acadêmico.</p>
              {metodos.map((valor) => (
                <label className={`opcao-pagamento${metodo === valor ? ' selecionada' : ''}`} key={valor}>
                  <input type="radio" name="metodo" value={valor} checked={metodo === valor} onChange={() => setMetodo(valor)} />
                  {metodoPagamento[valor]}
                </label>
              ))}
            </fieldset>
            {falha && <Mensagem>{falha}</Mensagem>}
          </div>
          <ResumoPedido itens={dados.itens} total={dados.total}>
            <button className="botao" type="submit" disabled={ocupado}>Confirmar pedido</button>
            {ocupado && <Carregamento texto="Confirmando pedido…" />}
          </ResumoPedido>
        </form>
      ))}
    </section>
  );
}
