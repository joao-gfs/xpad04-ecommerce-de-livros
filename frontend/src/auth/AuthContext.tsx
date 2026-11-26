import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { tokenStore } from '../api/client';
import { authApi } from '../api/endpoints';
import type { Sessao, Usuario } from '../api/types';

interface AuthValor {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (sessao: Sessao) => void;
  sair: () => void;
}

const AuthContext = createContext<AuthValor | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Se já há token salvo, tenta recuperar o usuário. Token inválido = desloga.
  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setCarregando(false);
      return;
    }
    let ativa = true;
    authApi
      .me()
      .then((perfil) => { if (ativa && tokenStore.get() === token) setUsuario(perfil); })
      .catch(() => { if (ativa && tokenStore.get() === token) tokenStore.clear(); })
      .finally(() => { if (ativa) setCarregando(false); });
    return () => { ativa = false; };
  }, []);

  const entrar = useCallback((sessao: Sessao) => {
    tokenStore.set(sessao.token);
    setUsuario(sessao.usuario);
  }, []);

  const sair = useCallback(() => {
    tokenStore.clear();
    setUsuario(null);
  }, []);

  return <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
