// Rota protegida (precisa de login).
// TODO:
//  - carrinhoApi.obter(): lista de itens, quantidade, subtotal e total
//  - alterar quantidade (carrinhoApi.atualizar) e remover item (carrinhoApi.remover)
//  - botão "Finalizar compra" -> pedidosApi.checkout(); em sucesso, ir para /pedidos
//  - tratar 409 (estoque insuficiente) mostrando a mensagem da API (ApiError.message)
export function CarrinhoPage() {
  return (
    <section>
      <h1>Carrinho</h1>
      <p className="todo">TODO: itens do carrinho e checkout.</p>
    </section>
  );
}
