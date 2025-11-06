#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running database seed..."
npx prisma db seed || echo "⚠️  Seed already executed or failed"

echo "Starting application..."
exec "$@"
