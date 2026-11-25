-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('CONFIRMADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque" (
    "livro_id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoque_pkey" PRIMARY KEY ("livro_id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'CONFIRMADO',
    "total" DECIMAL(10,2) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido" (
    "id" SERIAL NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "livro_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "preco_unitario" DECIMAL(10,2) NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "itens_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "pedidos_usuario_id_criado_em_idx" ON "pedidos"("usuario_id", "criado_em");

-- CreateIndex
CREATE INDEX "itens_pedido_pedido_id_idx" ON "itens_pedido"("pedido_id");

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_livro_id_fkey" FOREIGN KEY ("livro_id") REFERENCES "estoque"("livro_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Adicionado à mão (o Prisma não declara CHECK no schema):
-- estoque nunca pode ficar negativo, nem se o código tiver bug.
ALTER TABLE "estoque" ADD CONSTRAINT "estoque_quantidade_nao_negativa" CHECK ("quantidade" >= 0);
ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_quantidade_positiva" CHECK ("quantidade" > 0);
