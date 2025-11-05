FROM node:18-alpine

# curl p/ healthcheck
RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3005
EXPOSE 50055

CMD ["npm", "run", "start:prod"]
