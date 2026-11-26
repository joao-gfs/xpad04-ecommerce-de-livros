import { Link } from 'react-router-dom';

export function EtapasCompra({ confirmacao = false }: { confirmacao?: boolean }) {
  return (
    <nav className="etapas-compra" aria-label="Etapas da compra">
      <ol>
        <li>{confirmacao ? 'Carrinho' : <Link to="/carrinho">Carrinho</Link>}</li>
        <li aria-current={confirmacao ? undefined : 'step'}>Pagamento</li>
        <li aria-current={confirmacao ? 'step' : undefined}>Confirmação</li>
      </ol>
    </nav>
  );
}
