FROM node:22-alpine

# Prisma precisa do openssl no Alpine
RUN apk add --no-cache openssl

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package*.json ./
RUN npm install --no-audit --no-fund

COPY --chown=node:node . .
RUN npx prisma generate

EXPOSE 3000
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
