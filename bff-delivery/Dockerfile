FROM node:18-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl ca-certificates curl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3006

CMD ["node", "dist/main"]
