import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { healthApi } from '../api/endpoints';
import type { Health } from '../api/types';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { usuario, sair } = useAuth();

  return (
    <div className="app">
      <header className="topo">
        <Link to="/" className="marca">
          Livraria
        </Link>
        <nav>
          <NavLink to="/">Catálogo</NavLink>
          <NavLink to="/carrinho">Carrinho</NavLink>
          <NavLink to="/pedidos">Meus pedidos</NavLink>
        </nav>
        <div className="sessao">
          {usuario ? (
            <>
              <span>Olá, {usuario.nome}</span>
              <button onClick={sair}>Sair</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Entrar</NavLink>
              <NavLink to="/cadastro">Criar conta</NavLink>
            </>
          )}
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <StatusBancos />
    </div>
  );
}

/** Rodapé com o status dos três bancos (GET /api/health). Também serve de exemplo de chamada à API. */
function StatusBancos() {
  const [health, setHealth] = useState<Health | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    healthApi
      .status()
      .then(setHealth)
      .catch(() => setErro(true));
  }, []);

  const ponto = (ok?: boolean) => <span className={ok ? 'ok' : 'falha'}>●</span>;

  return (
    <footer className="rodape">
      {erro ? (
        <span>{ponto(false)} API fora do ar</span>
      ) : health ? (
        <>
          <span>{ponto(health.postgres)} PostgreSQL</span>
          <span>{ponto(health.mongo)} MongoDB</span>
          <span>{ponto(health.redis)} Redis</span>
        </>
      ) : (
        <span>verificando bancos…</span>
      )}
    </footer>
  );
}
