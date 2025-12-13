FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm ci

COPY src ./src
COPY proto ./proto

RUN npm run build

FROM node:20-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY proto ./proto
COPY src/presentation/grpc/*.proto ./dist/presentation/grpc/
COPY src/infrastructure/messaging/*.proto ./src/infrastructure/messaging/
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

EXPOSE 3005 50055

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
