# Front-end da Livraria

Aplicação React, TypeScript e Vite do projeto XPAD04. O React Router cuida das páginas. As chamadas aos bancos passam pela API REST em `/api`, pelo proxy do Vite.

## Executar pelo Docker

Com o Docker Desktop em execução, rode na raiz do repositório:

```powershell
docker compose up -d --build
docker compose ps
```

Abra [a livraria](http://localhost:5173/). A página inicial consulta `/api/livros` e `/api/categorias`. Busca, categoria, filtros adicionais e página ficam na URL para preservar a seleção ao recarregar ou voltar. O status dos bancos está no rodapé.

O Vite verifica arquivos a cada 500 ms para atualizar a página após alterações salvas no Windows. Se uma mudança de configuração não for detectada, execute `docker compose restart web`. Para o VS Code encontrar os tipos de React no Windows, execute `npm ci` dentro de `frontend` em um computador com Node e npm instalados. O TypeScript do editor pode ser reiniciado pela paleta com **TypeScript: Restart TS Server**.

## Páginas e como testar

| Página | Funcionalidade e verificação |
| --- | --- |
| `/` | Busque `Machado`, selecione **Romance**, limpe os filtros e avance à página 2. Os cartões abrem os detalhes. |
| `/livros/:id` | Abra um cartão e confira a capa, autores, categoria, sinopse, preço e estoque. Páginas, ISBN e editora aparecem quando a API informa esses dados. Selecione uma quantidade e adicione ao carrinho quando houver disponibilidade. |
| `/login` | Confira a validação de e-mail e senha e alterne a visibilidade da senha. Ao entrar a partir de uma rota protegida, a sessão retorna ao destino original. |
| `/cadastro` | Preencha nome, e-mail e senha. Teste duas senhas diferentes para ver a validação local. O cadastro bem-sucedido também inicia a sessão. |
| `/carrinho` | Aumente e diminua a quantidade, remova um livro e confira subtotais, total e contador do cabeçalho. Remover o último item mostra o estado vazio. |
| `/checkout` | Revise o resumo, selecione Pix, Cartão ou Boleto e confirme. O POST envia somente `{ metodo }`. Se a API indicar estoque insuficiente, a mensagem aparece e o carrinho permanece disponível. |
| `/pedidos/:id` | Confira a confirmação ao concluir a compra. Abra o mesmo pedido pelo histórico ou endereço direto para testar a consulta individual. |
| `/pedidos` | Confira o histórico vazio em uma conta nova e a lista após um pedido. Cada registro tem identificador, data, valor, situação e link de detalhes. |

Carrinho, checkout, histórico e detalhes de pedido exigem sessão. O cadastro respeita os mínimos do back-end, nome com 2 caracteres e senha com 6. A confirmação de senha permanece no formulário. O token de sessão é guardado no navegador e recuperado com `/api/auth/me`. O carrinho e seu contador dependem das respostas da API.

## Filtros do catálogo

O cabeçalho envia `busca` para pesquisar por título **ou** autor. `titulo` e `autor` são parâmetros separados que a API combina com **E** quando ambos são informados. O painel usa `descricao`, `editora`, `precoMin` e `precoMax`. A API aplica todos os critérios ativos junto de `categoria` antes de calcular o total e paginar com `pagina` e `porPagina`.

Os filtros de texto são opcionais. `busca`, `titulo`, `autor`, `descricao` e `editora` procuram trechos sem distinguir maiúsculas de minúsculas. A categoria corresponde ao nome completo. Como não há endpoint de editoras, o painel usa um campo de texto. Os preços em reais aceitam vírgula ou ponto decimal, com até duas casas. A API recebe números e aplica limites inclusivos. Campos vazios ficam fora da consulta. O mínimo e o máximo devem ser não negativos e, se ambos estiverem preenchidos, o mínimo deve ser menor ou igual ao máximo.

Para testar no navegador com os livros fictícios da porta `5174`, limpe os critérios anteriores entre os testes individuais.

| Teste | O que fazer |
| --- | --- |
| Título e autor | Na barra superior, busque `O Hobbit` e depois `Machado de Assis`. |
| Descrição | Preencha `Capitu` e aplique. O resultado é **Dom Casmurro**. |
| Editora | Preencha `Harper` e aplique. O resultado é **O Hobbit**. |
| Preço mínimo | Preencha `50` e deixe o máximo vazio. O resultado tem três livros. |
| Preço máximo e paginação | Preencha `49,90` e deixe o mínimo vazio. Há nove livros. A página 2 preserva `precoMax` na URL. Aplicar outro valor volta à primeira página. |
| Combinação | Busque `Machado de Assis`, selecione **Romance**, preencha `Capitu`, `Companhia` e a faixa `35` a `40`. O resultado é **Dom Casmurro**. **Limpar filtros** no painel preserva a busca e a categoria. |
| Validação e resultado vazio | Tente `-1`, `abc` e mínimo `60` com máximo `40` para ver a validação. Uma editora inexistente mostra **Nenhum livro encontrado**. |

Na porta `5173`, use títulos e metadados do catálogo carregado no MongoDB local. API saudável com `total: 0` indica um catálogo vazio nessa instalação.

## Demonstração em desenvolvimento

**Catálogo ilustrativo no Docker.** `frontend/.env.development` habilita `VITE_CATALOGO_DEMO=true`. A aplicação só usa os exemplos quando livros e categorias retornam `501`. O aviso identifica os dados ilustrativos. É possível abrir os detalhes dos exemplos, com adição desativada. Dados reais, respostas vazias e erros inesperados seguem o fluxo da API. Para usar apenas a API, ajuste a opção para `false` e reinicie o serviço `web`. O build de entrega desativa esse modo.

**Fluxo completo isolado.** Com Node e npm disponíveis, execute em `frontend`:

```powershell
npm ci
npm run dev:demo
```

No PowerShell do Codex, se o Node e as dependências do projeto já estiverem disponíveis mas o `npm` estiver fora do PATH, execute em `frontend`:

```powershell
node .\node_modules\vite\bin\vite.js --host 127.0.0.1 --port 5174 --strictPort --mode demonstracao
```

Abra [a demonstração](http://127.0.0.1:5174/). Ela usa as mesmas páginas e contratos REST com uma API em memória no Vite. Use `leitor@example.test` e `leitura123`, ou crie uma conta com endereço `@example.test`. Os dados e o estoque ficam no processo da demonstração. Ao encerrá-lo, esses dados são descartados. A sessão de demonstração tem chave própria, e a API do Docker não recebe essas requisições.

Para percorrer as etapas, comece em `/checkout` sem sessão, entre com a conta fictícia e confira o retorno. No catálogo, abra **Dom Casmurro**, selecione a quantidade e adicione. No carrinho, altere a quantidade e avance ao checkout. Selecione o método e confirme. Confira a confirmação, o contador zerado e o pedido em **Meus pedidos**. **Frankenstein** é um exemplo fora de estoque. Use a demonstração para testar o cadastro e a compra com dados fictícios.

## Dependências do back-end

| Recurso | Contrato disponível | Situação no back-end atual |
| --- | --- | --- |
| Conta | `POST /api/auth/cadastro`, `POST /api/auth/login`, `GET /api/auth/me` | Implementado. O perfil usa o token devolvido pela autenticação. |
| Catálogo e detalhes | `GET /api/categorias`, `GET /api/livros`, `GET /api/livros/:id` | Serviços implementados. O catálogo usa os dados carregados no MongoDB e os detalhes consultam estoque no PostgreSQL. |
| Carrinho | `GET /api/carrinho`, `POST /api/carrinho/itens`, `PATCH` e `DELETE /api/carrinho/itens/:livroId` | Serviços implementados, protegidos por JWT. O carrinho usa Redis e consulta o estoque. |
| Checkout, histórico e detalhe | `POST /api/pedidos`, `GET /api/pedidos`, `GET /api/pedidos/:id` | Rotas protegidas por JWT. Serviços pendentes para registrar e consultar pedidos e pagamentos simulados. |

O back-end decide preço, estoque e total na compra. Quando a criação do pedido for concluída pela API, a tela usa a resposta do POST para a confirmação e consulta novamente o carrinho. O detalhe de um pedido aberto pelo histórico usa o endpoint de consulta individual.

Para investigar o login local, abra [o status da API pelo proxy do Vite](http://localhost:5173/api/health) e confira se os bancos respondem. Em [Login](http://localhost:5173/login), use uma conta cadastrada nesta instalação. Na aba **Rede** do navegador, a resposta `401` de `POST /api/auth/login` indica e-mail ou senha inválidos para a base local. Se houver erro de conexão ou `5xx`, confira `docker compose ps` e `docker compose logs --tail 40 api web`. Quando o status está saudável e o login retorna `401`, reiniciar os containers não resolve as credenciais.

## Arquivos principais

- `src/App.tsx` define as rotas. `Layout.tsx` mantém busca, conta, contador e rodapé. `RotaProtegida.tsx` preserva o caminho de retorno após autenticação.
- `src/pages` reúne catálogo, detalhes, conta, carrinho, checkout e pedidos. `CapaLivro`, `ControleQuantidade`, `ItemCarrinho`, `ResumoPedido`, `CampoFormulario` e `EstadoPagina` reaproveitam os mesmos padrões de interface.
- `src/api` concentra os contratos, o cliente REST e o carregamento das consultas. `src/auth` guarda a sessão e as regras dos formulários. `src/carrinho/CarrinhoContext.tsx` compartilha a resposta da API com a sacola e o cabeçalho.
- `src/styles.css` contém a identidade visual do catálogo. `src/paginas.css` aplica a mesma paleta e tipografia às páginas internas.
- `src/catalogo`, `src/mocks` e `dev/apiDemonstracao.ts` separam a seleção da origem, os livros ilustrativos e a API usada somente na demonstração local.
- `src/components/PainelFiltros.tsx` reutiliza os campos da loja. `src/catalogo/filtros.ts` valida os preços e preserva os critérios aplicados na URL.

## Verificar o front-end

A partir da raiz do repositório:

```powershell
docker compose exec -T web npm run typecheck
docker compose exec -T web npm run build
docker compose exec -T web node --experimental-strip-types --test tests/catalogo.test.mjs tests/conta.test.mjs
```

Os testes usam o Node do container. Eles verificam os filtros e a paginação, o tratamento de `501` e de falhas inesperadas, as validações de conta e os destinos após login.
