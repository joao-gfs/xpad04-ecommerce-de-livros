import { useId, useState, type InputHTMLAttributes } from 'react';
import { Icone } from './Icone';

type CampoProps = InputHTMLAttributes<HTMLInputElement> & { rotulo: string; erro?: string; dica?: string };

export function CampoFormulario({ rotulo, erro, dica, type, ...input }: CampoProps) {
  const id = useId();
  const [mostrar, setMostrar] = useState(false);
  const senha = type === 'password';
  const acaoSenha = `${mostrar ? 'Ocultar' : 'Mostrar'} ${rotulo.toLocaleLowerCase('pt-BR')}`;

  return (
    <div className="campo-formulario">
      <label htmlFor={id}>{rotulo}</label>
      <div className={`entrada-campo${senha ? ' entrada-senha' : ''}`}>
        <input
          {...input}
          id={id}
          type={senha && mostrar ? 'text' : type}
          aria-invalid={Boolean(erro) || (input['aria-invalid'] ?? false)}
          aria-describedby={erro ? `${id}-erro` : dica ? `${id}-dica` : input['aria-describedby']}
        />
        {senha && (
          <button type="button" className="alternar-senha" aria-label={acaoSenha} onClick={() => setMostrar((valor) => !valor)}>
            <Icone nome={mostrar ? 'olho-fechado' : 'olho'} />
          </button>
        )}
      </div>
      {erro ? <span id={`${id}-erro`} className="erro-campo">{erro}</span> : dica && <span id={`${id}-dica`} className="dica-campo">{dica}</span>}
    </div>
  );
}
