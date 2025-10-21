#!/bin/bash
# scripts/init-kong.sh

echo "🔄 Iniciando configuração do Kong..."

# Aguardar Kong estar pronto
echo "⏳ Aguardando Kong iniciar..."
until curl -s http://localhost:8001/status > /dev/null; do
  sleep 5
done

echo "✅ Kong está pronto!"

# Configurar serviço msorders via Admin API
echo "🔧 Configurando serviço msorders..."

curl -X POST http://localhost:8001/services \
  --data "name=msorders-service" \
  --data "url=http://msorders:3001"

# Configurar rota para o serviço
curl -X POST http://localhost:8001/services/msorders-service/routes \
  --data "name=msorders-route" \
  --data "paths[]=/api/orders" \
  --data "methods[]=GET" \
  --data "methods[]=POST" \
  --data "methods[]=PUT" \
  --data "methods[]=DELETE" \
  --data "strip_path=false"

# Configurar plugin CORS
curl -X POST http://localhost:8001/services/msorders-service/plugins \
  --data "name=cors" \
  --data "config.origins=*" \
  --data "config.methods=GET,POST,PUT,DELETE,OPTIONS" \
  --data "config.headers=Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,Authorization" \
  --data "config.credentials=true" \
  --data "config.max_age=3600"

# Configurar rate limiting
curl -X POST http://localhost:8001/services/msorders-service/plugins \
  --data "name=rate-limiting" \
  --data "config.minute=60" \
  --data "config.hour=1000" \
  --data "config.policy=local"

echo "🎉 Configuração do Kong concluída!"
echo "📊 Gateway: http://localhost:8000"
echo "🔧 Admin API: http://localhost:8001"
echo "🌐 Konga UI: http://localhost:1337"