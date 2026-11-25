#!/bin/sh
set -e

# node_modules fica num volume do Docker. Se alguém adicionou dependência no
# package.json, isso sincroniza sem precisar rebuildar a imagem (é rápido quando nada mudou).
npm install --no-audit --no-fund --loglevel=error

# Gera o Prisma Client e aplica as migrations que ainda não rodaram neste banco.
npx prisma generate >/dev/null
npx prisma migrate deploy

exec "$@"
