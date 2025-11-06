FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --schema ./src/prisma/schema.prisma
RUN npm run build

# Copiar e dar permissão ao entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000
EXPOSE 50051

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/main"]