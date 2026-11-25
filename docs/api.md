# Contrato da API

Base: `http://localhost:3000/api`. Pelo front, use sempre `/api/...` (o Vite faz proxy).

Rotas marcadas com 🔒 exigem `Authorization: Bearer <token>`.
Erros sempre vêm como `{ "erro": "mensagem" }` (e `detalhes` quando é validação, status 400).
Enquanto uma rota não estiver implementada ela responde **501**.

Os tipos de resposta estão em [`frontend/src/api/types.ts`](../frontend/src/api/types.ts) e nos `*.service.ts` do backend.

## Saúde

| Método | Rota | Resposta |
|---|---|---|
| GET | `/health` | `{ ok, postgres, mongo, redis }` (503 se algum banco estiver fora) |

## Usuários (`modules/usuarios`, PostgreSQL)

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/auth/cadastro` | `{ nome, email, senha }` | 201 `Sessao` · 409 e-mail já existe |
| POST | `/auth/login` | `{ email, senha }` | `Sessao` · 401 credenciais inválidas |
| GET 🔒 | `/auth/me` | | `Usuario` |

`Sessao = { token, usuario: { id: number, nome, email } }`

## Catálogo (`modules/catalogo`, MongoDB + estoque do PostgreSQL)

| Método | Rota | Query / params | Resposta |
|---|---|---|---|
| GET | `/categorias` | | `string[]` |
| GET | `/livros` | `categoria?`, `busca?` (título ou autor), `pagina=1`, `porPagina=20` (máx 100) | `Paginado<LivroResumo>` |
| GET | `/livros/:id` | | `LivroDetalhe` (inclui `estoque` e `disponivel`) · 404 |

## Carrinho 🔒 (`modules/carrinho`, Redis)

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/carrinho` | | `Carrinho` |
| POST | `/carrinho/itens` | `{ livroId, quantidade=1 }` (soma ao que já tem) | 201 `Carrinho` · 404 livro · 409 sem estoque |
| PATCH | `/carrinho/itens/:livroId` | `{ quantidade }` (0 remove) | `Carrinho` |
| DELETE | `/carrinho/itens/:livroId` | | `Carrinho` |
| DELETE | `/carrinho` | | 204 |

## Pedidos 🔒 (`modules/pedidos`, PostgreSQL)

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/pedidos` | `{ metodo: "PIX" \| "CARTAO" \| "BOLETO" }` | Checkout do carrinho atual: cria pedido, itens e pagamento (simulado, já `APROVADO`). 201 `Pedido` · 400 carrinho vazio · 409 estoque insuficiente |
| GET | `/pedidos` | | `Pedido[]` do usuário, mais recente primeiro |
| GET | `/pedidos/:id` | | `Pedido` · 404 se não existir ou for de outro usuário |

Valores monetários vêm como **number** (o service converte o `Decimal` do Prisma).
`titulo` e `capaUrl` dos itens vêm do MongoDB (a tabela `item_pedido` só guarda `livro_id`, preço e quantidade).
