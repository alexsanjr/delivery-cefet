FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --schema ./src/prisma/schema.prisma
RUN npm run build

FROM node:18-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src/grpc/shared/protos ./dist/shared/protos

EXPOSE 3004
EXPOSE 50054

CMD ["node", "dist/main"]