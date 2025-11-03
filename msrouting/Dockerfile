FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --schema ./src/prisma/schema.prisma
RUN npm run build

# CORRIGIR PORTAS - usar as mesmas do seu código
EXPOSE 3004
EXPOSE 50054

# CORRIGIR COMANDO - usar start:prod para produção
CMD ["npm", "run", "start:prod"]