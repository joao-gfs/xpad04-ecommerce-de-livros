import { useState } from 'react';
import { Icone } from './Icone';

export function CapaLivro({ id, titulo, autores, capaUrl }: {
  id: string;
  titulo: string;
  autores?: string;
  capaUrl?: string | null;
}) {
  const [capaComErro, setCapaComErro] = useState<string | null>(null);
  const tom = Array.from(id).reduce((soma, letra) => soma + letra.charCodeAt(0), 0) % 6;

  if (capaUrl && capaComErro !== capaUrl) {
    return <img className="livro-capa" src={capaUrl} alt={`Capa de ${titulo}`} loading="lazy" onError={() => setCapaComErro(capaUrl)} />;
  }

  return (
    <div className={`capa-ilustrada capa-tom-${tom}`} aria-hidden="true">
      {autores && <span className="capa-autor">{autores}</span>}
      <Icone nome="livro" />
      <span className="capa-titulo">{titulo}</span>
      <span className="capa-ornamento" />
    </div>
  );
}
