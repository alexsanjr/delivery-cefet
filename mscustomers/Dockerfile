FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --schema ./src/prisma/schema.prisma
RUN npm run build

EXPOSE 3000
EXPOSE 50051

CMD ["npm", "run", "dev"]