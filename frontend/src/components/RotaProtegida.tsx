import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Carregamento } from './EstadoPagina';

/** Redireciona para /login se não houver usuário logado. */
export function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) return <Carregamento texto="Verificando sua sessão…" />;
  if (!usuario) {
    const de = location.pathname + location.search + location.hash;
    return <Navigate to="/login" replace state={{ de }} />;
  }
  return children;
}
