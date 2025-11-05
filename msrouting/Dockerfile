FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# MSRouting não usa Prisma, então removemos esta linha
RUN npm run build

# Usar portas corretas para msrouting
EXPOSE 50055

# Comando de produção
CMD ["npm", "run", "start:prod"]