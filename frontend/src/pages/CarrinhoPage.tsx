import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mensagemApi } from '../api/erros';
import type { Carrinho } from '../api/types';
import { useCarrinho } from '../carrinho/CarrinhoContext';
import { Carregamento, EstadoPagina, Mensagem } from '../components/EstadoPagina';
import { ItemCarrinho } from '../components/ItemCarrinho';
import { ResumoPedido } from '../components/ResumoPedido';

export function CarrinhoPage() {
  const { dados, erro, carregando, ocupado, recarregar, atualizar, remover } = useCarrinho();
  const [falha, setFalha] = useState('');

  async function alterar(acao: () => Promise<Carrinho | undefined>) {
    setFalha('');
    try {
      await acao();
    } catch (motivo) {
      setFalha(mensagemApi(motivo, 'Não foi possível atualizar o carrinho. Tente novamente.', 'A alteração do carrinho ainda está pendente no back-end.'));
    }
  }

  return (
    <section className="pagina-loja">
      <h1 className="titulo-pagina">Meu carrinho</h1>
      {carregando && <Carregamento texto="Carregando seu carrinho…" />}
      {erro != null && (
        <EstadoPagina titulo="Carrinho indisponível" texto={mensagemApi(erro, 'Não foi possível consultar o carrinho. Tente novamente.', 'O serviço de carrinho ainda não foi implementado no back-end.')} erro onTentarNovamente={recarregar} />
      )}
      {dados && (dados.itens.length === 0 ? (
        <EstadoPagina titulo="Seu carrinho está vazio" texto="Explore o catálogo e escolha suas próximas leituras.">
          <Link to="/" className="botao">Continuar comprando</Link>
        </EstadoPagina>
      ) : (
        <div className="colunas-compra">
          <div className="itens-carrinho" aria-busy={ocupado}>
            {falha && <Mensagem>{falha}</Mensagem>}
            {dados.itens.map((item) => (
              <ItemCarrinho key={item.livroId} item={item} ocupado={ocupado}
                onMudarQuantidade={(quantidade) => alterar(() => atualizar(item.livroId, quantidade))}
                onRemover={() => alterar(() => remover(item.livroId))}
              />
            ))}
            <Link className="link-retorno" to="/">Continuar comprando</Link>
          </div>
          <ResumoPedido itens={dados.itens} total={dados.total} mostrarLivros={false}>
            {ocupado ? <Carregamento texto="Atualizando carrinho…" /> : <Link className="botao" to="/checkout">Finalizar compra</Link>}
          </ResumoPedido>
        </div>
      ))}
    </section>
  );
}
