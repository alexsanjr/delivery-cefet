#!/bin/sh
echo "Waiting for database to be ready..."

# Aguardar o banco estar disponível
while ! nc -z postgres-orders 5432; do
  echo "Database not ready, waiting..."
  sleep 2
done

echo "Database is ready!"

# Executar migrações
echo "Running database migrations..."
npx prisma migrate deploy

# Build da aplicação
echo "Building application..."
npm run build

# Iniciar aplicação
echo "Starting application..."
npm run start:prod