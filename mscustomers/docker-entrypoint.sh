#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy --schema ./src/infrastructure/prisma/schema.prisma

echo "Running database seed..."
npx prisma db seed --schema ./src/infrastructure/prisma/schema.prisma || echo "⚠️  Seed already executed or failed"

echo "Starting application..."
exec "$@"
