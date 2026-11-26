import type { ReactNode } from 'react';

type NomeIcone = 'livro' | 'busca' | 'carrinho' | 'usuario' | 'mais' | 'check' | 'fechar'
  | 'anterior' | 'proximo' | 'folha' | 'menos' | 'remover' | 'olho' | 'olho-fechado' | 'sair';

const desenhos: Record<NomeIcone, ReactNode> = {
  livro: <><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z" /><path d="M12 5v15" /></>,
  busca: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  carrinho: <><path d="M3 3h2l2.5 12h11L21 7H6" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
  usuario: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  sair: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5m5 5H9" /></>,
  mais: <path d="M12 5v14M5 12h14" />,
  menos: <path d="M5 12h14" />,
  remover: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v7m4-7v7" /></>,
  olho: <><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  'olho-fechado': <><path d="M3 3l18 18M9 6.5a11 11 0 0 1 3-.5c6 0 10 6 10 6a15 15 0 0 1-3 3.1M6.4 7.8A16 16 0 0 0 2 12s4 6 10 6a11 11 0 0 0 4.2-.9" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  fechar: <path d="m6 6 12 12M6 18 18 6" />,
  anterior: <path d="m14 6-6 6 6 6" />,
  proximo: <path d="m10 6 6 6-6 6" />,
  folha: <><path d="M20 3c-8-1-15 3-15 9a6 6 0 0 0 6 6c6 0 9-7 9-15Z" /><path d="m3 21 11-11" /></>,
};

export function Icone({ nome, className = '' }: { nome: NomeIcone; className?: string }) {
  return (
    <svg className={`icone ${className}`.trim()} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {desenhos[nome]}
    </svg>
  );
}
