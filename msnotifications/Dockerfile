FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm ci

COPY src ./src

RUN npm run build

FROM node:20-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src/grpc/*.proto ./dist/grpc/

EXPOSE 3000 50051

CMD ["node", "dist/main"]