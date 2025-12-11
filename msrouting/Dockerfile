FROM node:18-alpine AS builder

RUN apk add --no-cache netcat-openbsd

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Copiar proto file para dist
RUN mkdir -p dist/presentation/grpc && \
    cp src/presentation/grpc/routing.proto dist/presentation/grpc/

EXPOSE 50054 3004

CMD ["npm", "run", "start:prod"]