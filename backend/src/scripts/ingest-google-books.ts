/**
 * Carrega livros da Google Books API para o MongoDB (catálogo) e cria o
 * estoque inicial no PostgreSQL. Pode rodar mais de uma vez: faz upsert no
 * catálogo e não mexe no estoque de livros que já existem.
 *
 *   docker compose exec api npm run ingest
 *   docker compose exec api npm run ingest -- 20      # 20 livros por categoria (padrão 40, máx 40)
 */
