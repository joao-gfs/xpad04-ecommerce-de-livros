import { Icone } from './Icone';

export function ControleQuantidade({ titulo, quantidade, minimo = 1, limite, desativado, onMudar }: {
  titulo: string;
  quantidade: number;
  minimo?: number;
  limite?: number;
  desativado?: boolean;
  onMudar: (nova: number) => void;
}) {
  return (
    <div className="controle-quantidade" role="group" aria-label={`Quantidade de ${titulo}`}>
      <button type="button" aria-label={`Diminuir quantidade de ${titulo}`} disabled={desativado || quantidade <= minimo} onClick={() => onMudar(quantidade - 1)}>
        <Icone nome="menos" />
      </button>
      <output aria-label={`Quantidade de ${titulo}`}>{quantidade}</output>
      <button type="button" aria-label={`Aumentar quantidade de ${titulo}`} disabled={desativado || quantidade >= (limite ?? Number.MAX_SAFE_INTEGER)} onClick={() => onMudar(quantidade + 1)}>
        <Icone nome="mais" />
      </button>
    </div>
  );
}

export function IndicadorCarrinho({ quantidade }: { quantidade: number }) {
  return (
    <div className="livro-confirmacao" role="status">
      <Icone nome="check" /> {quantidade} no carrinho
    </div>
  );
}
