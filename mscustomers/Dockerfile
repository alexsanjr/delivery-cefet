FROM node:18-alpine

# Instalar netcat para verificar conexão com banco
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --schema ./src/prisma/schema.prisma

# Copiar script de inicialização
COPY wait-for-db.sh /app/wait-for-db.sh
RUN chmod +x /app/wait-for-db.sh

EXPOSE 3000

CMD ["/app/wait-for-db.sh"]