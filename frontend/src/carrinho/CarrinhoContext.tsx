import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { ApiError, tokenStore } from '../api/client';
import { carrinhoApi, pedidosApi } from '../api/endpoints';
import type { Carrinho, MetodoPagamento, Pedido, Usuario } from '../api/types';
import { useAuth } from '../auth/AuthContext';

interface EstadoCarrinho {
  usuario: Usuario;
  dados: Carrinho | null;
  erro: unknown;
}

interface CarrinhoValor {
  dados: Carrinho | null;
  erro: unknown;
  carregando: boolean;
  ocupado: boolean;
  recarregar: () => void;
  adicionar: (livroId: string, quantidade?: number) => Promise<Carrinho | undefined>;
  atualizar: (livroId: string, quantidade: number) => Promise<Carrinho | undefined>;
  remover: (livroId: string) => Promise<Carrinho | undefined>;
  finalizar: (metodo: MetodoPagamento) => Promise<Pedido | undefined>;
}

const CarrinhoContext = createContext<CarrinhoValor | null>(null);

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const { usuario, sair } = useAuth();
  const { pathname } = useLocation();
  const telaCompra = pathname === '/carrinho' || pathname === '/checkout' ? pathname : null;
  const [estado, setEstado] = useState<EstadoCarrinho | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const operacao = useRef(false);
  const versao = useRef(0);

  useEffect(() => {
    if (!usuario) {
      setEstado(null);
      return;
    }
    let ativa = true;
    const leitura = ++versao.current;
    carrinhoApi.obter().then((dados) => {
      if (ativa && leitura === versao.current) setEstado({ usuario, dados, erro: null });
    }).catch((erro: unknown) => {
      if (!ativa || leitura !== versao.current) return;
      if (erro instanceof ApiError && erro.status === 401) sair();
      setEstado({ usuario, dados: null, erro });
    });
    return () => { ativa = false; };
  }, [usuario, tentativa, telaCompra, sair]);

  function recarregar() {
    setEstado(null);
    setTentativa((valor) => valor + 1);
  }

  async function executar<T>(acao: () => Promise<T>, receber: (resultado: T, autor: Usuario) => void) {
    if (!usuario || operacao.current) return;
    const token = tokenStore.get();
    operacao.current = true;
    setOcupado(true);
    try {
      const resultado = await acao();
      if (tokenStore.get() !== token) return;
      // Uma leitura iniciada antes da alteração não pode substituir a resposta da escrita.
      ++versao.current;
      receber(resultado, usuario);
      return resultado;
    } catch (erro) {
      if (tokenStore.get() !== token) return;
      if (erro instanceof ApiError && erro.status === 401) sair();
      throw erro;
    } finally {
      operacao.current = false;
      setOcupado(false);
    }
  }

  function salvarResposta(dados: Carrinho, autor: Usuario) {
    setEstado({ usuario: autor, dados, erro: null });
  }

  const atual = estado?.usuario === usuario ? estado : null;
  const valor: CarrinhoValor = {
    dados: atual?.dados ?? null,
    erro: atual?.erro ?? null,
    carregando: Boolean(usuario && !atual),
    ocupado,
    recarregar,
    adicionar: (id, quantidade) => executar(() => carrinhoApi.adicionar(id, quantidade), salvarResposta),
    atualizar: (id, quantidade) => executar(() => carrinhoApi.atualizar(id, quantidade), salvarResposta),
    remover: (id) => executar(() => carrinhoApi.remover(id), salvarResposta),
    finalizar: (metodo) => executar(() => pedidosApi.checkout(metodo), recarregar),
  };

  return <CarrinhoContext.Provider value={valor}>{children}</CarrinhoContext.Provider>;
}

export function useCarrinho() {
  const contexto = useContext(CarrinhoContext);
  if (!contexto) throw new Error('useCarrinho precisa estar dentro de <CarrinhoProvider>');
  return contexto;
}
