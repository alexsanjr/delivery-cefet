FROM node:18-alpine

# Instalar netcat para verificar conexão com banco e curl para healthcheck
RUN apk add --no-cache netcat-openbsd curl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

# Copiar script de inicialização
COPY wait-for-db.sh /app/wait-for-db.sh
RUN chmod +x /app/wait-for-db.sh

EXPOSE 3000
EXPOSE 50052

CMD ["/app/wait-for-db.sh"]