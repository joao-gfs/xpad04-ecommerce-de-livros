import { Icone } from './Icone';

interface PaginacaoProps {
  pagina: number;
  totalPaginas: number;
  onMudar: (pagina: number) => void;
}

export function Paginacao({ pagina, totalPaginas, onMudar }: PaginacaoProps) {
  if (totalPaginas <= 1) return null;

  const inicio = Math.max(1, Math.min(pagina - 2, totalPaginas - 4));
  const fim = Math.min(totalPaginas, inicio + 4);
  const paginas: (number | string)[] = [];
  if (inicio > 1) paginas.push(1);
  if (inicio > 2) paginas.push('inicio');
  for (let numero = inicio; numero <= fim; numero++) paginas.push(numero);
  if (fim < totalPaginas - 1) paginas.push('fim');
  if (fim < totalPaginas) paginas.push(totalPaginas);

  return (
    <nav className="paginacao" aria-label="Paginação do catálogo">
      <button type="button" className="pagina-botao pagina-direcao" aria-label="Página anterior" disabled={pagina <= 1} onClick={() => onMudar(pagina - 1)}>
        <Icone nome="anterior" />
      </button>
      {paginas.map((numero) => typeof numero === 'number' ? (
        <button key={numero} type="button" className={`pagina-botao${numero === pagina ? ' selecionada' : ''}`} aria-label={`Página ${numero}`} aria-current={numero === pagina ? 'page' : undefined} onClick={() => onMudar(numero)}>
          {numero}
        </button>
      ) : <span key={numero} className="pagina-reticencias" aria-hidden="true">…</span>)}
      <button type="button" className="pagina-botao pagina-direcao" aria-label="Próxima página" disabled={pagina >= totalPaginas} onClick={() => onMudar(pagina + 1)}>
        <Icone nome="proximo" />
      </button>
    </nav>
  );
}
