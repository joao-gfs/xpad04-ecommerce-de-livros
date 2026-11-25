// Rota protegida (precisa de login).
// TODO:
//  - carrinhoApi.obter(): lista de itens, quantidade, subtotal e total
//  - alterar quantidade (carrinhoApi.atualizar) e remover item (carrinhoApi.remover)
//  - escolher forma de pagamento (PIX, CARTAO, BOLETO) e "Finalizar compra" -> pedidosApi.checkout(metodo); em sucesso, ir para /pedidos
//  - tratar 409 (estoque insuficiente) mostrando a mensagem da API (ApiError.message)
export function CarrinhoPage() {
  return (
    <section>
      <h1>Carrinho</h1>
      <p className="todo">TODO: itens do carrinho e checkout.</p>
    </section>
  );
}
