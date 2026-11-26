import { useEffect, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { healthApi } from '../api/endpoints';
import type { Health } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useCarrinho } from '../carrinho/CarrinhoContext';
import { mudarFiltro } from '../catalogo/filtros';
import { demonstrarFluxos } from '../config/desenvolvimento';
import { Icone } from './Icone';

export function Layout() {
  const { usuario, sair, carregando } = useAuth();
  const { dados: carrinho } = useCarrinho();
  const location = useLocation();
  const navigate = useNavigate();
  const buscaNaUrl = new URLSearchParams(location.search).get('busca') ?? '';
  const [busca, setBusca] = useState(buscaNaUrl);
  useEffect(() => setBusca(buscaNaUrl), [buscaNaUrl, location.pathname]);

  function pesquisar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const base = location.pathname === '/' ? new URLSearchParams(location.search) : new URLSearchParams();
    navigate({ pathname: '/', search: mudarFiltro(base, 'busca', busca).toString() });
  }

  const total = usuario ? carrinho?.itens.reduce((soma, item) => soma + item.quantidade, 0) ?? null : 0;

  return (
    <div className="app">
      <a className="pular-conteudo" href="#conteudo">Pular para o conteúdo</a>
      <header className="topo">
        <div className="topo-principal limite">
          <Link to="/" className="marca" aria-label="Livraria — início">
            <span className="marca-icone"><Icone nome="livro" /></span>
            <span>Livraria<small>HISTÓRIAS QUE CONECTAM</small></span>
          </Link>
          <form className="busca" role="search" onSubmit={pesquisar}>
            <label className="sr-only" htmlFor="busca-livros">Buscar por título ou autor</label>
            <Icone nome="busca" />
            <input id="busca-livros" type="search" placeholder="Busque por título ou autor" value={busca} onChange={(event) => setBusca(event.target.value)} />
            <button type="submit" aria-label="Buscar livros">Buscar</button>
          </form>
          <div className="sessao">
            {usuario ? (
              <div className="acesso-conta conta-autenticada">
                <Icone nome="usuario" />
                <div className="conta-opcoes">
                  <small>Olá, {usuario.nome.split(' ')[0]}</small>
                  <Link to="/pedidos">Minha conta</Link>
                  <button type="button" className="sair-conta" onClick={sair}>
                    <Icone nome="sair" /> Sair da conta
                  </button>
                </div>
              </div>
            ) : (
              <Link className="acesso-conta" to="/login">
                <Icone nome="usuario" /><span><small>{carregando ? 'Aguarde…' : 'Boas-vindas!'}</small>Entrar</span>
              </Link>
            )}
            <Link className="acesso-carrinho" to="/carrinho" aria-label={total === null ? 'Carrinho — contagem indisponível' : `Carrinho, ${total} ${total === 1 ? 'item' : 'itens'}`}>
              <Icone nome="carrinho" /><span className="contador">{total ?? '—'}</span><span className="sr-only">Carrinho</span>
            </Link>
          </div>
        </div>
        <nav className="navegacao limite" aria-label="Navegação principal">
          <NavLink to="/" end>Catálogo de livros</NavLink>
          <NavLink to="/pedidos">Meus pedidos</NavLink>
          {!usuario && <NavLink to="/cadastro">Criar conta</NavLink>}
          <span className="navegacao-frase">Uma boa história começa aqui.</span>
        </nav>
      </header>

      <main id="conteudo" className="limite" tabIndex={-1}>
        {demonstrarFluxos && (
          <div className="aviso-demonstracao aviso-fluxos" role="status">
            <div><strong>Ambiente de demonstração</strong><span>Use credenciais fictícias. Contas, carrinhos e pedidos são temporários.</span></div>
          </div>
        )}
        <Outlet />
      </main>

      <footer className="rodape">
        <div className="rodape-conteudo limite">
          <Link to="/" className="rodape-marca"><Icone nome="livro" /> Livraria</Link>
          <span>Projeto acadêmico · XPAD04 — Bancos de Dados NoSQL</span>
          <StatusBancos />
        </div>
      </footer>
    </div>
  );
}

/** Mantém o diagnóstico original do trabalho em um painel discreto no rodapé. */
function StatusBancos() {
  const [health, setHealth] = useState<Health | null>(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    if (demonstrarFluxos) return;
    let ativo = true;
    healthApi.status().then((dados) => { if (ativo) setHealth(dados); }).catch(() => { if (ativo) setErro(true); });
    return () => { ativo = false; };
  }, []);

  return (
    <details className="status-bancos">
      <summary>Status do sistema</summary>
      <div className="status-painel">
        {demonstrarFluxos ? <span>API de demonstração em memória.</span> : erro ? <span className="falha">Não foi possível consultar a API.</span> : health ? (
          <>{([['PostgreSQL', health.postgres], ['MongoDB', health.mongo], ['Redis', health.redis]] as const).map(([nome, ok]) => (
            <span key={nome}><span className={ok ? 'ok' : 'falha'} aria-hidden="true">●</span> {nome}: {ok ? 'conectado' : 'indisponível'}</span>
          ))}</>
        ) : <span>Verificando conexões…</span>}
      </div>
    </details>
  );
}
