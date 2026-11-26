interface FiltroCategoriasProps {
  categorias: string[];
  selecionada: string;
  carregando: boolean;
  erro: string | null;
  onSelecionar: (categoria: string) => void;
  onTentarNovamente: () => void;
}

export function FiltroCategorias({ categorias, selecionada, carregando, erro, onSelecionar, onTentarNovamente }: FiltroCategoriasProps) {
  return (
    <aside className="filtro-categorias" aria-labelledby="titulo-categorias" aria-busy={carregando}>
      <h2 id="titulo-categorias">Categorias</h2>
      <div className="categorias-lista">
        <button type="button" className={`categoria-botao${selecionada === '' ? ' selecionada' : ''}`} aria-pressed={selecionada === ''} onClick={() => onSelecionar('')}>
          Todos os livros
        </button>
        {Array.from(new Set(categorias)).map((categoria) => (
          <button key={categoria} type="button" className={`categoria-botao${selecionada === categoria ? ' selecionada' : ''}`} aria-pressed={selecionada === categoria} onClick={() => onSelecionar(categoria)}>
            {categoria}
          </button>
        ))}
      </div>
      {carregando && <p className="filtro-mensagem" role="status">Carregando categorias…</p>}
      {erro && (
        <div className="filtro-mensagem" role="status">
          <p>{erro}</p>
          <button type="button" className="botao-texto" onClick={onTentarNovamente}>Tentar novamente</button>
        </div>
      )}
    </aside>
  );
}
