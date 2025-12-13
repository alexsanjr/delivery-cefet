#!/bin/sh
set -e

echo "Waiting for database..."
sleep 3

echo "Running database seed..."
node dist/seed.js || echo "⚠️  Seed failed or already executed"

echo "Starting application..."
exec "$@"
