import { Link, useLocation } from 'react-router-dom';
import type { LivroResumo } from '../api/types';
import { formatarMoeda } from '../formatos';
import { CapaLivro } from './CapaLivro';
import { ControleQuantidade, IndicadorCarrinho } from './ControleQuantidade';
import { Icone } from './Icone';

interface LivroCardProps {
  livro: LivroResumo;
  demonstracao: boolean;
  quantidade: number;
  alterando: boolean;
  desativado: boolean;
  onMudarQuantidade: (nova: number) => void;
}

export function LivroCard({ livro, demonstracao, quantidade, alterando, desativado, onMudarQuantidade }: LivroCardProps) {
  const { pathname, search } = useLocation();
  const autores = livro.autores.length ? livro.autores.join(', ') : 'Autoria não informada';
  const destino = `/livros/${encodeURIComponent(livro.id)}`;
  const retorno = { catalogo: pathname + search };
  const noCarrinho = !demonstracao && quantidade > 0;

  return (
    <article className="livro-card">
      <Link to={destino} state={retorno} className="livro-capa-area" aria-label={`Ver detalhes de ${livro.titulo}`}>
        <CapaLivro id={livro.id} titulo={livro.titulo} autores={autores} capaUrl={livro.capaUrl} />
      </Link>
      <div className="livro-info">
        <h3 className="livro-titulo">
          <Link to={destino} state={retorno}>{livro.titulo}</Link>
        </h3>
        <p className="livro-autores">{autores}</p>
        <p className="livro-preco">{formatarMoeda(livro.preco)}</p>
        <div className="livro-acoes" aria-busy={alterando}>
          {noCarrinho ? (
            <>
              <IndicadorCarrinho quantidade={quantidade} />
              <ControleQuantidade titulo={livro.titulo} quantidade={quantidade} minimo={0}
                desativado={desativado || alterando} onMudar={onMudarQuantidade} />
            </>
          ) : (
            <button
              type="button"
              className="botao botao-adicionar"
              disabled={demonstracao || desativado || alterando}
              aria-label={demonstracao ? `Adicionar ${livro.titulo} indisponível na demonstração` : `Adicionar ${livro.titulo} ao carrinho`}
              title={demonstracao ? 'Apenas demonstração: este livro não pode ser comprado.' : undefined}
              onClick={() => onMudarQuantidade(1)}
            >
              <Icone nome="mais" />
              {alterando ? 'Adicionando…' : 'Adicionar'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
