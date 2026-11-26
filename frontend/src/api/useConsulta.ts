import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from './client';

/** Mantém a resposta vinculada à consulta atual, inclusive ao trocar o ID da rota. */
export function useConsulta<T>(consultar: () => Promise<T>, protegida = false) {
  const { sair } = useAuth();
  const [tentativa, setTentativa] = useState(0);
  const [resposta, setResposta] = useState<{
    consultar: typeof consultar;
    tentativa: number;
    dados: T | null;
    erro: unknown;
  }>();

  useEffect(() => {
    let ativa = true;
    consultar().then((dados) => {
      if (ativa) setResposta({ consultar, tentativa, dados, erro: null });
    }).catch((erro: unknown) => {
      if (!ativa) return;
      if (protegida && erro instanceof ApiError && erro.status === 401) sair();
      setResposta({ consultar, tentativa, dados: null, erro });
    });
    return () => { ativa = false; };
  }, [consultar, tentativa, protegida, sair]);

  const atual = resposta?.consultar === consultar && resposta.tentativa === tentativa ? resposta : undefined;
  return {
    dados: atual?.dados ?? null,
    erro: atual?.erro ?? null,
    carregando: !atual,
    recarregar: () => setTentativa((valor) => valor + 1),
  };
}
