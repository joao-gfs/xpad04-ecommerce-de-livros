import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { catalogoApi } from '../api/endpoints';
import { mensagemApi } from '../api/erros';
import { useAuth } from '../auth/AuthContext';
import { useCarrinho } from '../carrinho/CarrinhoContext';
import { consultarCatalogo, type CarregarDemonstracao, type CatalogoConsultado } from '../catalogo/consulta';
import { lerFiltros, mudarFiltro } from '../catalogo/filtros';
import { FiltroCategorias } from '../components/FiltroCategorias';
import { Icone } from '../components/Icone';
import { LivroCard } from '../components/LivroCard';
import { Paginacao } from '../components/Paginacao';
import { modoCatalogo } from '../config/desenvolvimento';

const carregarDemonstracao: CarregarDemonstracao | undefined = import.meta.env.DEV ? async (filtros) => {
  const mock = await import('../mocks/catalogo');
  return {
    categorias: mock.listarCategoriasDemonstracao(),
    livros: mock.listarLivrosDemonstracao(filtros),
  };
} : undefined;

export function CatalogoPage() {
  const [params, setParams] = useSearchParams();
  const { busca, categoria, pagina, porPagina } = lerFiltros(params);
  const [tentativa, setTentativa] = useState(0);
  const consulta = useMemo(() => ({ filtros: { busca, categoria, pagina, porPagina }, tentativa }),
    [busca, categoria, pagina, porPagina, tentativa]);
  const [resposta, setResposta] = useState<{ consulta: typeof consulta; resultado: CatalogoConsultado } | null>(null);
  const [alterando, setAlterando] = useState<string | null>(null);
  const [erroCarrinho, setErroCarrinho] = useState('');
  const enviando = useRef(false);
  const { usuario, carregando: carregandoSessao } = useAuth();
  const { dados: carrinho, carregando: carregandoCarrinho, ocupado, adicionar, atualizar, remover } = useCarrinho();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Uma resposta antiga não pode substituir uma busca mais recente.
    let ativo = true;
    setErroCarrinho('');
    consultarCatalogo(catalogoApi, consulta.filtros, modoCatalogo, carregarDemonstracao)
      .then((resultado) => {
        if (ativo) setResposta({ consulta, resultado });
      });
    return () => { ativo = false; };
  }, [consulta]);

  const resultado = resposta?.consulta === consulta ? resposta.resultado : null;
  const anterior = resposta?.resultado;
  // Mantém as categorias visíveis ao trocar busca ou página, com a indicação da origem delas.
  const demonstracao = anterior?.origem === 'demo';
  const carregando = resultado === null;
  const dados = resultado?.livros.dados;
  const quantidades = new Map(carrinho?.itens.map((item) => [item.livroId, item.quantidade]));
  const acoesDesativadas = carregandoSessao || carregandoCarrinho || ocupado;
  const erro = resultado?.livros.erro;
  const falhaCategorias = resultado?.categorias.erro;
  const erroCategorias = falhaCategorias === 'nao-implementado'
    ? 'O serviço de categorias ainda não foi implementado.'
    : falhaCategorias === 'falha' ? 'Não foi possível consultar as categorias. Tente novamente.' : null;

  function tentarNovamente() {
    setTentativa((valor) => valor + 1);
  }

  function filtrar(chave: string, valor: string) {
    setParams((atual) => mudarFiltro(atual, chave, valor));
  }

  function limparFiltros() {
    setParams((atual) => {
      const proximo = new URLSearchParams(atual);
      proximo.delete('busca');
      proximo.delete('categoria');
      proximo.delete('pagina');
      proximo.delete('modo');
      return proximo;
    });
  }

  async function mudarQuantidade(livroId: string, nova: number) {
    if (resultado?.origem !== 'api' || enviando.current || acoesDesativadas) return;
    if (!usuario) {
      navigate('/login', { state: { de: location.pathname + location.search } });
      return;
    }
    enviando.current = true;
    setAlterando(livroId);
    setErroCarrinho('');
    try {
      if (nova === 0) await remover(livroId);
      else if (quantidades.has(livroId)) await atualizar(livroId, nova);
      else await adicionar(livroId, nova);
    } catch (falha) {
      if (falha instanceof ApiError && falha.status === 401) {
        navigate('/login', { replace: true, state: { de: location.pathname + location.search } });
        return;
      }
      setErroCarrinho(mensagemApi(falha, 'Não foi possível atualizar o carrinho. Tente novamente.', 'O carrinho ainda não está disponível.'));
    } finally {
      enviando.current = false;
      setAlterando(null);
    }
  }

  const totalPaginas = dados ? Math.max(1, Math.ceil(dados.total / dados.porPagina)) : 1;
  const primeiraPosicao = dados ? (dados.pagina - 1) * dados.porPagina + 1 : 0;

  return (
    <div className="catalogo-pagina">
      <section className="banner" aria-labelledby="titulo-banner">
        <div className="banner-texto">
          <span className="sobretitulo">DESCUBRA NOVAS HISTÓRIAS</span>
          <h1 id="titulo-banner">Encontre sua<br /> próxima <em>leitura.</em></h1>
          <p>Explore nosso catálogo de livros.<br className="quebra-desktop" /> Seu próximo favorito pode estar aqui.</p>
          <a className="banner-link" href="#catalogo">Explore o catálogo <Icone nome="livro" /></a>
        </div>
        <div className="banner-ilustracao" aria-hidden="true">
          <div className="banner-orbita" />
          <span className="folha folha-um"><Icone nome="folha" /></span><span className="folha folha-dois"><Icone nome="folha" /></span>
          <div className="livro-decorativo livro-decorativo-fundo"><span>entre<br />páginas</span><i /></div>
          <div className="livro-decorativo livro-decorativo-frente"><Icone nome="livro" /><span>um novo<br /><em>capítulo</em></span><i /></div>
          <div className="livro-decorativo-base" />
        </div>
      </section>

      {demonstracao && (
        <div className="aviso-demonstracao">
          <div role="status"><strong>Catálogo de demonstração</strong><span>Dados ilustrativos. Compras desativadas.</span></div>
        </div>
      )}

      <div className="catalogo-layout" id="catalogo">
        <FiltroCategorias
          categorias={anterior?.categorias.dados ?? []}
          selecionada={categoria}
          carregando={carregando && !anterior?.categorias.dados}
          erro={erroCategorias}
          onSelecionar={(valor) => filtrar('categoria', valor)}
          onTentarNovamente={tentarNovamente}
        />
        <section className="catalogo-resultados" aria-labelledby="titulo-catalogo" aria-busy={carregando}>
          <div className="catalogo-cabecalho">
            <div><span className="sobretitulo">NA SUA ESTANTE, EM BREVE</span><h2 id="titulo-catalogo">{busca ? 'Resultados da busca' : categoria || 'Catálogo de livros'}</h2></div>
            <span className="contagem" role="status">{carregando ? 'Buscando livros…' : dados ? dados.total + (dados.total === 1 ? ' livro encontrado' : ' livros encontrados') : ''}</span>
          </div>

          {(busca || categoria) && <div className="filtros-ativos">
            {busca && <button onClick={() => filtrar('busca', '')} aria-label={'Remover busca ' + busca}>Busca: {busca}<Icone nome="fechar" /></button>}
            {categoria && <button onClick={() => filtrar('categoria', '')} aria-label={'Remover categoria ' + categoria}>{categoria}<Icone nome="fechar" /></button>}
            <button className="limpar-filtros" onClick={limparFiltros}>Limpar filtros</button>
          </div>}

          {erroCarrinho && (
            <div className="aviso-carrinho">
              <span role="alert">{erroCarrinho}</span>
              <button type="button" aria-label="Fechar aviso" onClick={() => setErroCarrinho('')}><Icone nome="fechar" /></button>
            </div>
          )}

          {carregando ? <div className="livros-grade esqueletos" aria-hidden="true">{Array.from({ length: porPagina }, (_, i) => <div className="livro-esqueleto" key={i}><div /><span /><span /><span /></div>)}</div>
            : erro ? (
              <div className="estado-catalogo">
                <Icone nome="livro" />
                <div role="alert">
                  <h3>{erro === 'nao-implementado' ? 'O catálogo está a caminho' : 'Não foi possível carregar os livros'}</h3>
                  <p>{erro === 'nao-implementado' ? 'O serviço de listagem ainda não foi implementado.' : 'Não foi possível consultar o catálogo. Tente novamente.'}</p>
                </div>
                <div className="estado-acoes">
                  <button type="button" className="botao" onClick={tentarNovamente}>Tentar novamente</button>
                </div>
              </div>
            )
              : dados?.itens.length ? <>
                <div className="livros-grade">
                  {dados.itens.map((livro) => (
                    <LivroCard key={livro.id} livro={livro} demonstracao={demonstracao}
                      quantidade={quantidades.get(livro.id) ?? 0} alterando={alterando === livro.id}
                      desativado={acoesDesativadas} onMudarQuantidade={(nova) => mudarQuantidade(livro.id, nova)} />
                  ))}
                </div>
                <div className="catalogo-paginacao"><span>Mostrando {primeiraPosicao}–{primeiraPosicao + dados.itens.length - 1} de {dados.total} livros</span><Paginacao pagina={dados.pagina} totalPaginas={totalPaginas} onMudar={(valor) => filtrar('pagina', String(valor))} /></div>
              </> : <div className="estado-catalogo"><Icone nome="busca" /><h3>{pagina > 1 ? 'Não há livros nesta página' : 'Nenhum livro encontrado'}</h3><p>{busca || categoria ? 'Experimente outro título, autor ou categoria.' : 'Novas histórias aparecerão aqui quando o catálogo estiver disponível.'}</p>{pagina > 1 ? <button className="botao" onClick={() => filtrar('pagina', '1')}>Voltar à primeira página</button> : (busca || categoria) && <button className="botao" onClick={limparFiltros}>Limpar filtros</button>}</div>}
        </section>
      </div>
    </div>
  );
}
