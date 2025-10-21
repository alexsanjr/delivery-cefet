#!/bin/sh
# wait-for-db.sh

set -e

host="$1"
user="$2"
pass="$3"
db="$4"
shift 4

until PGPASSWORD=$pass psql -h "$host" -U "$user" -d "$db" -c '\q'; do
  >&2 echo "PostgreSQL indisponível - aguardando..."
  sleep 2
done

>&2 echo "PostgreSQL disponível - executando aplicação"
exec node /app/app.js