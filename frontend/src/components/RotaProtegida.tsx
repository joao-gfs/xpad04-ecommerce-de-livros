import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

/** Redireciona para /login se não houver usuário logado. */
export function RotaProtegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) return <p>Carregando…</p>;
  if (!usuario) return <Navigate to="/login" replace state={{ de: location.pathname }} />;
  return children;
}
