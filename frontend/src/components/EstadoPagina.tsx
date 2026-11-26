import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icone } from './Icone';

export function Carregamento({ texto = 'Carregando…' }: { texto?: string }) {
  return <p className="carregamento" role="status"><span aria-hidden="true" />{texto}</p>;
}

export function Mensagem({ children, sucesso = false }: { children: ReactNode; sucesso?: boolean }) {
  return <p className={`mensagem ${sucesso ? 'mensagem-sucesso' : 'mensagem-erro'}`} role={sucesso ? 'status' : 'alert'}>{children}</p>;
}

export function EstadoPagina({ titulo, texto, erro, onTentarNovamente, children }: {
  titulo: string;
  texto: string;
  erro?: boolean;
  onTentarNovamente?: () => void;
  children?: ReactNode;
}) {
  return (
    <section className="estado-catalogo estado-pagina">
      <Icone nome="livro" />
      <div role={erro ? 'alert' : undefined}>
        <h2>{titulo}</h2>
        <p>{texto}</p>
      </div>
      <div className="estado-acoes">
        {onTentarNovamente && <button type="button" className="botao" onClick={onTentarNovamente}>Tentar novamente</button>}
        {children ?? <Link to="/" className="botao botao-secundario">Voltar ao catálogo</Link>}
      </div>
    </section>
  );
}
