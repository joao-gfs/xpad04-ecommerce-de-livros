# Livraria: e-commerce de livros com persistência poliglota

Trabalho prático de XPAD04 – Bancos de Dados NoSQL (UNIFEI, 2026.2, Profa. Vanessa Souza).

Cada tipo de dado fica no banco que combina com ele:

| Dado | Banco | Por quê | Acesso |
|---|---|---|---|
| Catálogo de livros | **MongoDB** (documentos) | esquema flexível vindo da Google Books, busca por texto e categoria | Mongoose |
| Carrinho | **Redis** (chave-valor) | leitura/escrita rápida por usuário, expira sozinho | ioredis |
| Usuários, pedidos, pagamento, estoque | **PostgreSQL** (relacional) | transação ACID no checkout, integridade referencial | Prisma |

## Rodando

Pré-requisito: Docker com Docker Compose. Não precisa de Node instalado para rodar.

```bash
docker compose up --build
```

| O quê | Onde |
|---|---|
| Front-end (React + Vite) | http://localhost:5173 |
| API (Express) | http://localhost:3000/api |
| Status dos bancos | http://localhost:3000/api/health |

O código é montado dentro dos containers, então salvar um arquivo recarrega a API e o front sozinhos.
Na primeira subida o container da API aplica as migrations do Postgres automaticamente.

### Carregar o catálogo (Google Books)

A API da Google Books **precisa de chave**: sem ela a cota é compartilhada com o mundo todo e vive esgotada.

1. Crie uma chave em https://console.cloud.google.com/apis/credentials (projeto qualquer → "Criar credenciais" → "Chave de API") e ative a **Books API** em "APIs e serviços".
2. `cp .env.example .env` e preencha `GOOGLE_BOOKS_API_KEY`.
3. `docker compose up -d` (para a API pegar o `.env`) e depois:

```bash
docker compose exec api npm run ingest        # ~40 livros por categoria, 10 categorias
docker compose exec api npm run ingest -- 20  # menos livros
```

Pode rodar de novo quando quiser: faz upsert no catálogo e não mexe no estoque de livros que já existem.
O estoque inicial é aleatório (0 a 25, ~10% zerado para testar "indisponível").
O preço sintético é `R$ 10 + R$ 0,05 × páginas + R$ 0,50 × max(0, ano − 2000)`; sem páginas, usa 200, e sem ano válido, 2000. O catálogo marca esses valores com `precoOrigem: "sintetico"`.

### Ver os dados nos bancos

```bash
docker compose --profile tools up -d
```

| Ferramenta | Banco | URL |
|---|---|---|
| Adminer | PostgreSQL (servidor `postgres`, usuário/senha/banco `livraria`) | http://localhost:8081 |
| mongo-express | MongoDB | http://localhost:8082 |
| Redis Commander | Redis | http://localhost:8083 |

Ou conecte seu cliente favorito (DBeaver, Compass, RedisInsight) em `localhost:5432`, `localhost:27017`, `localhost:6379`.

### Comandos úteis

```bash
docker compose logs -f api                 # logs da API
docker compose exec api sh                 # shell no container da API
docker compose down                        # para tudo (mantém os dados)
docker compose down -v                     # para tudo e APAGA os dados dos bancos
docker compose exec api npm run typecheck  # checa tipos do backend
docker compose exec web npm run typecheck  # checa tipos do front
```

**Porta ocupada?** Se você já tem Postgres/Mongo/Redis rodando na máquina, crie o `.env` e troque a porta (`POSTGRES_PORT=5433`, `REDIS_PORT=6380` etc.). Isso só muda a porta exposta no host; os containers continuam se falando normalmente.

**Windows:** clone o repo dentro do WSL (`~/...`), não em `/mnt/c/...`, senão o hot-reload não percebe as mudanças.

**Autocomplete no editor:** os `node_modules` ficam dentro do Docker. Para o VS Code achar os tipos, rode também na sua máquina `npm install` em `backend/` e `frontend/` (e `npx prisma generate` em `backend/`).

## Estrutura

```
.
├── docker-compose.yml        # postgres, mongo, redis, api, web (+ ferramentas no profile "tools")
├── .env.example
├── docs/api.md               # contrato das rotas
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     # modelo relacional
│   │   └── migrations/
│   └── src/
│       ├── server.ts         # conecta nos 3 bancos e sobe o Express
│       ├── app.ts            # middlewares, /api/health, montagem das rotas
│       ├── config/env.ts     # variáveis de ambiente validadas
│       ├── db/               # clientes: postgres.ts (Prisma), mongo.ts (Mongoose), redis.ts (ioredis)
│       ├── shared/           # HttpError, JWT, middlewares de auth e de erro
│       ├── scripts/          # ingest-google-books.ts
│       └── modules/
│           ├── catalogo/     # livro.model, livro.repository, estoque.repository, service, controller, routes
│           ├── carrinho/
│           ├── pedidos/
│           └── usuarios/
└── frontend/
    └── src/
        ├── api/              # client.ts (fetch + token), endpoints.ts, types.ts
        ├── auth/             # AuthContext (usuário logado)
        ├── components/       # Layout, RotaProtegida
        └── pages/            # Catálogo, Livro, Carrinho, Pedidos, Login, Cadastro
```

### Camadas do backend

Cada módulo segue o mesmo caminho:

```
routes → controller → service → repository → banco
```

- **routes**: URL e middleware (`exigirAuth`).
- **controller**: valida a entrada com zod e chama o service. Não tem regra de negócio.
- **service**: regra de negócio. É aqui que um módulo fala com mais de um banco (ex.: `PedidoService.checkout` lê Redis, consulta MongoDB e grava no Postgres numa transação).
- **repository**: o único lugar que fala com o banco. Um repository = um banco.

Para erro de negócio, lance `new HttpError(status, 'mensagem')` de qualquer camada. O middleware de erro transforma em resposta JSON. Erro de validação do zod vira 400 automaticamente.

### Convenções entre os bancos

- **`livroId` é o volumeId da Google Books** e é o mesmo nos três bancos: `_id` do documento no MongoDB, chave primária de `estoque` no Postgres e campo do hash do carrinho no Redis. Não crie outro id para livro.
- **Carrinho no Redis:** um hash por usuário, `carrinho:{usuarioId}` → `{ livroId: quantidade }`, com TTL de 7 dias renovado a cada escrita.
- **`item_pedido.preco_unitario` congela o preço** no momento da compra. Mudança de preço no catálogo não altera pedidos antigos. O título não é copiado: a API busca no MongoDB ao montar a resposta.
- **`item_pedido.livro_id` não tem FK**: o livro vive no MongoDB, não é tabela do Postgres.
- **Pagamento é 1:1 com pedido** e é simulado: o checkout já cria com status `APROVADO`. Os valores aceitos nos campos `status`/`metodo` (colunas `text`) estão em `backend/src/modules/pedidos/pedido.types.ts`.
- **Estoque fica no Postgres**, não no MongoDB, para o checkout decrementar na mesma transação que cria o pedido. A tabela tem `CHECK (quantidade >= 0)`.

## Estado atual

Pronto e funcionando:

- Docker Compose com os 3 bancos, API e front, com hot-reload
- Conexão com os 3 bancos + `/api/health` (o rodapé do front mostra o status)
- Schema do Postgres com migration inicial; model do MongoDB com índices (texto e categoria)
- Middleware de JWT, tratamento de erros, validação de entrada
- Todas as rotas da API registradas e validando entrada (ver [docs/api.md](docs/api.md))
- Cliente HTTP do front com todos os endpoints tipados, contexto de autenticação e rotas protegidas

A fazer (cada item tem `TODO` com dica no próprio arquivo; enquanto não for feito, a rota responde **501**):

| Parte | Arquivos | Responsável |
|---|---|---|
| Ingestão Google Books | `backend/src/scripts/ingest-google-books.ts` (grava livros no MongoDB e estoque no Postgres) | _(nome)_ |
| Usuários / login | `backend/src/modules/usuarios/*` · `LoginPage`, `CadastroPage` | _(nome)_ |
| Catálogo | `backend/src/modules/catalogo/*` · `CatalogoPage`, `LivroPage` | _(nome)_ |
| Carrinho | `backend/src/modules/carrinho/*` · `CarrinhoPage` | _(nome)_ |
| Pedidos / checkout | `backend/src/modules/pedidos/*` · `PedidosPage` + botão de finalizar no carrinho | _(nome)_ |

Sugestão de ordem: **usuários** primeiro (carrinho e pedidos dependem de login) junto com **catálogo**; depois **carrinho**; por último **checkout**, que usa os repositories das outras partes.

## Como colaborar

1. Atualize a `main`: `git pull`.
2. Crie uma branch: `git checkout -b feat/carrinho-redis`.
3. Commits pequenos, mensagem dizendo o que mudou.
4. Abra um Pull Request para a `main` e peça para alguém olhar.

Regras que evitam dor de cabeça:

- **Mexeu no `schema.prisma`?** Gere a migration e commite a pasta junto:
  ```bash
  docker compose exec api npx prisma migrate dev --name descricao_curta
  ```
  Quem puxar depois só precisa reiniciar a API (`docker compose restart api`) que ela aplica a migration. Avise o grupo antes, porque duas pessoas alterando o schema ao mesmo tempo dá conflito.
- **Mudou o formato de uma resposta da API?** Atualize `frontend/src/api/types.ts` e `docs/api.md` no mesmo PR.
- **Adicionou dependência?** Rode o `npm install` dentro do container (`docker compose exec api npm install pacote`) para o `package-lock.json` sair certo, e commite os dois arquivos.
- **Nunca commite o `.env`** (já está no `.gitignore`).
