import { useCallback, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { catalogoApi } from '../api/endpoints';
import { mensagemApi } from '../api/erros';
import type { LivroDetalhe } from '../api/types';
import { useConsulta } from '../api/useConsulta';
import { useAuth } from '../auth/AuthContext';
import { useCarrinho } from '../carrinho/CarrinhoContext';
import { CapaLivro } from '../components/CapaLivro';
import { ControleQuantidade, IndicadorCarrinho } from '../components/ControleQuantidade';
import { Carregamento, EstadoPagina, Mensagem } from '../components/EstadoPagina';
import { Icone } from '../components/Icone';
import { demonstrarFluxos, modoCatalogo } from '../config/desenvolvimento';
import { formatarMoeda } from '../formatos';

export function LivroPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const retorno: unknown = location.state?.catalogo;
  const catalogo = typeof retorno === 'string' && (retorno === '/' || retorno.startsWith('/?')) ? retorno : '/';
  const ilustrativo = id.startsWith('demo-') && !demonstrarFluxos;

  const carregar = useCallback(async () => {
    if (!ilustrativo) return catalogoApi.livro(id);
    if (import.meta.env.DEV && modoCatalogo === 'automatico') {
      const { obterLivroDemonstracao } = await import('../mocks/catalogo');
      const livro = obterLivroDemonstracao(id);
      if (livro) return livro;
    }
    throw new ApiError(404, 'Livro não encontrado.');
  }, [id, ilustrativo]);
  const { dados, erro, carregando, recarregar } = useConsulta(carregar);
  const naoEncontrado = erro instanceof ApiError && erro.status === 404;

  return (
    <section className="pagina-loja">
      <Link to={catalogo} className="link-retorno"><Icone nome="anterior" /> Voltar ao catálogo</Link>
      {carregando && <Carregamento texto="Carregando livro…" />}
      {erro != null && (
        <>
          <h1 className="titulo-pagina">Detalhes do livro</h1>
          <EstadoPagina titulo={naoEncontrado ? 'Livro não encontrado' : 'Detalhes indisponíveis'}
            texto={mensagemApi(erro, 'Não foi possível consultar os detalhes deste livro.', 'O serviço de detalhes do livro ainda não foi implementado no back-end.')}
            erro onTentarNovamente={naoEncontrado ? undefined : recarregar}
          />
        </>
      )}
      {dados && <DetalhesLivro key={dados.id} livro={dados} ilustrativo={ilustrativo} />}
    </section>
  );
}

function DetalhesLivro({ livro, ilustrativo }: { livro: LivroDetalhe; ilustrativo: boolean }) {
  const [quantidade, setQuantidade] = useState(1);
  const [falha, setFalha] = useState('');
  const { usuario, carregando } = useAuth();
  const { dados: carrinho, carregando: carregandoCarrinho, adicionar, atualizar, remover, ocupado } = useCarrinho();
  const location = useLocation();
  const navigate = useNavigate();
  const autores = livro.autores.join(', ') || 'Autoria não informada';
  const disponivel = livro.disponivel && livro.estoque > 0;
  const noCarrinho = ilustrativo ? 0 : carrinho?.itens.find((item) => item.livroId === livro.id)?.quantidade ?? 0;
  const desativado = ilustrativo || ocupado || carregando || carregandoCarrinho || (!disponivel && noCarrinho === 0);

  async function mudarCarrinho(nova: number) {
    if (desativado) return;
    const destino = { de: location.pathname + location.search };
    if (!usuario) {
      navigate('/login', { state: destino });
      return;
    }
    setFalha('');
    try {
      if (nova === 0) await remover(livro.id);
      else if (noCarrinho > 0) await atualizar(livro.id, nova);
      else if (await adicionar(livro.id, nova)) setQuantidade(1);
    } catch (motivo) {
      if (motivo instanceof ApiError && motivo.status === 401) {
        navigate('/login', { state: destino, replace: true });
        return;
      }
      setFalha(mensagemApi(motivo, 'Não foi possível atualizar o carrinho. Tente novamente.', 'O serviço de carrinho ainda não está disponível.'));
    }
  }

  return (
    <>
      {ilustrativo && <div className="aviso-demonstracao aviso-detalhe" role="status"><div><strong>Livro de demonstração</strong><span>Dados ilustrativos. Compras desativadas.</span></div></div>}
      <div className="detalhe-livro painel">
        <div className="livro-capa-area detalhe-capa"><CapaLivro id={livro.id} titulo={livro.titulo} autores={autores} capaUrl={livro.capaUrl} /></div>
        <div className="detalhe-info">
          {livro.categorias.length > 0 && (
            <div className="detalhe-categorias">{livro.categorias.map((categoria) => <Link key={categoria} to={`/?${new URLSearchParams({ categoria })}`}>{categoria}</Link>)}</div>
          )}
          <h1 className="titulo-pagina">{livro.titulo}</h1>
          {livro.subtitulo && <p className="detalhe-subtitulo">{livro.subtitulo}</p>}
          <p className="texto-suave">{autores}</p>
          <p className="detalhe-preco">{formatarMoeda(livro.preco)}</p>
          <p className={`estoque ${disponivel ? 'estoque-disponivel' : 'estoque-indisponivel'}`}>
            {disponivel ? `${livro.estoque} ${livro.estoque === 1 ? 'exemplar disponível' : 'exemplares disponíveis'}` : 'Fora de estoque'}
          </p>
          {noCarrinho > 0 && <IndicadorCarrinho quantidade={noCarrinho} />}
          <div className="detalhe-acoes">
            <ControleQuantidade titulo={livro.titulo} quantidade={noCarrinho || quantidade} minimo={noCarrinho > 0 ? 0 : 1}
              limite={disponivel ? livro.estoque : 0} desativado={desativado} onMudar={noCarrinho > 0 ? mudarCarrinho : setQuantidade} />
            {noCarrinho > 0 ? (
              <Link className="botao botao-secundario" to="/carrinho"><Icone nome="carrinho" /> Ver carrinho</Link>
            ) : (
              <button className="botao" type="button" disabled={desativado} onClick={() => mudarCarrinho(quantidade)}>
                <Icone nome="carrinho" /> Adicionar ao carrinho
              </button>
            )}
          </div>
          {ocupado && <Carregamento texto="Atualizando o carrinho…" />}
          {falha && <Mensagem>{falha}</Mensagem>}
          <div className="sinopse">
            <h2>Sinopse</h2>
            <p>{livro.descricao?.trim() || 'Sinopse não informada.'}</p>
          </div>
          {(livro.paginas || livro.isbn || livro.editora) && (
            <dl className="metadados-livro">
              {livro.paginas != null && livro.paginas > 0 && <div><dt>Páginas</dt><dd>{livro.paginas}</dd></div>}
              {livro.isbn && <div><dt>ISBN</dt><dd>{livro.isbn}</dd></div>}
              {livro.editora && <div><dt>Editora</dt><dd>{livro.editora}</dd></div>}
            </dl>
          )}
        </div>
      </div>
    </>
  );
}
