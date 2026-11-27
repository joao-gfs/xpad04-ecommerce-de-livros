import { useEffect, useId, useState, type FormEvent } from 'react';
import { validarFiltrosAdicionais, type CamposFiltrosAdicionais, type ErrosPreco, type FiltrosAdicionais } from '../catalogo/filtros';
import { CampoFormulario } from './CampoFormulario';
import { Icone } from './Icone';

function criarCampos(filtros: FiltrosAdicionais): CamposFiltrosAdicionais {
  return {
    descricao: filtros.descricao ?? '',
    editora: filtros.editora ?? '',
    precoMin: String(filtros.precoMin ?? '').replace('.', ','),
    precoMax: String(filtros.precoMax ?? '').replace('.', ','),
  };
}

export function PainelFiltros({ aplicados, onAplicar }: {
  aplicados: FiltrosAdicionais;
  onAplicar: (filtros: FiltrosAdicionais) => void;
}) {
  const [campos, setCampos] = useState(() => criarCampos(aplicados));
  const [erros, setErros] = useState<ErrosPreco>({});
  const idErroPreco = useId();
  const idErroMin = `${idErroPreco}-min`;
  const erroMaxDistinto = erros.precoMax === erros.precoMin ? undefined : erros.precoMax;
  const idErroMax = erroMaxDistinto ? `${idErroPreco}-max` : idErroMin;

  useEffect(() => {
    setCampos(criarCampos(aplicados));
    setErros({});
  }, [aplicados]);

  function atualizar(chave: keyof CamposFiltrosAdicionais, valor: string) {
    setCampos((atual) => ({ ...atual, [chave]: valor }));
    if (chave === 'precoMin' || chave === 'precoMax') setErros({});
  }

  function aplicar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const validacao = validarFiltrosAdicionais(campos);
    setErros(validacao.erros);
    const invalido = validacao.erros.precoMin ? 'precoMin' : validacao.erros.precoMax ? 'precoMax' : null;
    if (invalido) {
      const campo = evento.currentTarget.elements.namedItem(invalido);
      if (campo instanceof HTMLInputElement) campo.focus();
      return;
    }
    setCampos(criarCampos(validacao.filtros));
    onAplicar(validacao.filtros);
  }

  function limpar() {
    setCampos(criarCampos({}));
    setErros({});
    onAplicar({});
  }

  return (
    <form className="painel-filtros" aria-labelledby="titulo-filtros" onSubmit={aplicar}>
      <h2 id="titulo-filtros"><Icone nome="filtros" /> Filtros</h2>
      <CampoFormulario type="text" name="descricao" rotulo="Descrição" placeholder="Palavra-chave"
        value={campos.descricao} onChange={(evento) => atualizar('descricao', evento.target.value)} />
      <CampoFormulario type="text" name="editora" rotulo="Editora" placeholder="Nome da editora"
        value={campos.editora} onChange={(evento) => atualizar('editora', evento.target.value)} />
      <div className="filtros-precos">
        <CampoFormulario type="text" inputMode="decimal" name="precoMin" rotulo="Preço mínimo" placeholder="De (R$)"
          value={campos.precoMin} onChange={(evento) => atualizar('precoMin', evento.target.value)}
          aria-invalid={Boolean(erros.precoMin)} aria-describedby={erros.precoMin ? idErroMin : undefined} />
        <CampoFormulario type="text" inputMode="decimal" name="precoMax" rotulo="Preço máximo" placeholder="Até (R$)"
          value={campos.precoMax} onChange={(evento) => atualizar('precoMax', evento.target.value)}
          aria-invalid={Boolean(erros.precoMax)} aria-describedby={erros.precoMax ? idErroMax : undefined} />
      </div>
      {(erros.precoMin || erroMaxDistinto) && (
        <div className="erro-campo erro-precos" role="alert">
          <Icone nome="alerta" />
          <div>
            {erros.precoMin && <div id={idErroMin}>{erros.precoMin}</div>}
            {erroMaxDistinto && <div id={idErroMax}>{erroMaxDistinto}</div>}
          </div>
        </div>
      )}
      <div className="filtros-acoes">
        <button type="submit" className="botao">Aplicar filtros</button>
        <button type="button" className="botao botao-secundario" onClick={limpar}>Limpar filtros</button>
      </div>
    </form>
  );
}
