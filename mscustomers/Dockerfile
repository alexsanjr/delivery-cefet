FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --schema ./src/prisma/schema.prisma
RUN npm run build

# Copiar e dar permissão ao entrypoint separadamente
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
EXPOSE 50051

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/main"]