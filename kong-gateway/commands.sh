#!/bin/bash

# Delivery CEFET - Kong Gateway Quick Commands
# Navegue para a pasta kong-gateway antes de executar

echo "🚀 Delivery CEFET - Kong Gateway Commands"
echo "========================================"

case "$1" in
  "start")
    echo "🟢 Iniciando todos os serviços..."
    docker compose up -d
    echo "⏳ Aguardando inicialização completa..."
    sleep 10
    echo "🔧 Executando configuração inicial do Kong..."
    ./scripts/init-kong.sh
    echo "✅ Todos os serviços iniciados e configurados!"
    ;;
    
  "stop")
    echo "🔴 Parando todos os serviços..."
    docker compose down
    echo "✅ Todos os serviços foram parados."
    ;;
    
  "status")
    echo "📊 Status dos containers:"
    docker compose ps
    ;;
    
  "logs")
    if [ -z "$2" ]; then
      echo "📋 Logs de todos os serviços:"
      docker compose logs --tail=20
    else
      echo "📋 Logs do serviço $2:"
      docker compose logs "$2" --tail=50
    fi
    ;;
    
  "test")
    echo "🧪 Testando Kong Gateway..."
    echo "Kong Status:"
    curl -s http://localhost:8001/status | jq .
    echo -e "\n🧪 Testando msorders:"
    curl -s -X POST http://localhost:8000/api/orders/graphql \
      -H "Content-Type: application/json" \
      -d '{"query":"{ __schema { types { name } } }"}' | jq .data.__schema.types[0:3]
    echo -e "\n🧪 Testando mscustomers:"
    curl -s -X POST http://localhost:8000/api/customers/graphql \
      -H "Content-Type: application/json" \
      -d '{"query":"{ customers { id name email } }"}' | jq .
    ;;
    
  "rebuild")
    if [ -z "$2" ]; then
      echo "❌ Especifique o serviço para rebuild: ./commands.sh rebuild msorders"
      exit 1
    fi
    echo "🔨 Rebuilding $2..."
    docker compose stop "$2"
    docker compose build "$2" --no-cache
    docker compose up "$2" -d
    echo "✅ $2 reconstruído com sucesso!"
    ;;
    
  "migrate")
    if [ -z "$2" ]; then
      echo "❌ Especifique o serviço: ./commands.sh migrate msorders"
      exit 1
    fi
    if [ "$2" = "msorders" ]; then
      echo "🗄️  Executando migrations para msorders..."
      docker compose exec msorders npx prisma migrate dev --name migration
    elif [ "$2" = "mscustomers" ]; then
      echo "🗄️  Executando migrations para mscustomers..."
      docker compose exec mscustomers npx prisma migrate dev --name migration --schema ./src/prisma/schema.prisma
    else
      echo "❌ Serviço não reconhecido. Use: msorders ou mscustomers"
    fi
    ;;
    
  "seed")
    if [ -z "$2" ]; then
      echo "❌ Especifique o serviço: ./commands.sh seed msorders"
      exit 1
    fi
    if [ "$2" = "msorders" ]; then
      echo "🌱 Executando seed para msorders..."
      docker compose exec msorders npx prisma db seed
    elif [ "$2" = "mscustomers" ]; then
      echo "🌱 Executando seed para mscustomers..."
      docker compose exec mscustomers npx prisma db seed --schema ./src/prisma/schema.prisma
    else
      echo "❌ Serviço não reconhecido. Use: msorders ou mscustomers"
    fi
    ;;
    
  "kong-services")
    echo "🌐 Serviços registrados no Kong:"
    curl -s http://localhost:8001/services | jq '.data[] | {name: .name, url: .url}'
    echo -e "\n🛣️  Rotas configuradas no Kong:"
    curl -s http://localhost:8001/routes | jq '.data[] | {name: .name, paths: .paths, service: .service.name}'
    ;;
    
  "init-kong")
    echo "🔧 Re-executando configuração do Kong..."
    ./scripts/init-kong.sh
    echo "✅ Kong reconfigurado!"
    ;;
    
  "add-service")
    if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
      echo "❌ Uso: ./commands.sh add-service <service-name> <service-url> <route-path>"
      echo "   Exemplo: ./commands.sh add-service msproducts http://msproducts:3000 /api/products"
      echo "   💡 Dica: Para serviços principais, edite scripts/init-kong.sh"
      exit 1
    fi
    echo "➕ Adicionando serviço $2..."
    # Criar serviço
    curl -X POST http://localhost:8001/services \
      --data name="$2-service" \
      --data url="$3"
    echo -e "\n➕ Criando rota $4..."
    # Criar rota
    curl -X POST http://localhost:8001/services/"$2-service"/routes \
      --data paths[]="$4" \
      --data methods[]=GET \
      --data methods[]=POST \
      --data methods[]=PUT \
      --data methods[]=DELETE
    echo -e "\n✅ Serviço $2 adicionado com sucesso!"
    echo "💡 Para tornar permanente, adicione ao scripts/init-kong.sh"
    ;;
    
  "clean")
    echo "🧹 Limpando containers e volumes..."
    docker compose down -v
    docker system prune -f
    echo "✅ Limpeza concluída!"
    ;;
    
  "monitor")
    echo "📈 Iniciando monitoramento em tempo real..."
    echo "Pressione Ctrl+C para parar"
    watch -n 2 "echo '=== STATUS DOS CONTAINERS ===' && docker compose ps && echo -e '\n=== USO DE RECURSOS ===' && docker stats --no-stream"
    ;;
    
  "help"|"")
    echo "Comandos disponíveis:"
    echo "  start                    - Iniciar todos os serviços"
    echo "  stop                     - Parar todos os serviços"
    echo "  status                   - Ver status dos containers"
    echo "  logs [service]           - Ver logs (todos ou de um serviço específico)"
    echo "  test                     - Testar Kong e microsserviços"
    echo "  rebuild <service>        - Reconstruir um microsserviço"
    echo "  migrate <service>        - Executar migrations do Prisma"
    echo "  seed <service>           - Executar seeds do Prisma"
    echo "  kong-services            - Listar serviços e rotas do Kong"
    echo "  init-kong                - Re-executar configuração inicial do Kong"
    echo "  add-service <name> <url> <path> - Adicionar novo serviço no Kong (temporário)"
    echo "  clean                    - Limpar containers e volumes"
    echo "  monitor                  - Monitoramento em tempo real"
    echo "  help                     - Mostrar esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  ./commands.sh start"
    echo "  ./commands.sh logs msorders"
    echo "  ./commands.sh rebuild mscustomers"
    echo "  ./commands.sh migrate msorders"
    echo "  ./commands.sh add-service msproducts http://msproducts:3000 /api/products"
    ;;
    
  *)
    echo "❌ Comando '$1' não reconhecido. Use './commands.sh help' para ver os comandos disponíveis."
    exit 1
    ;;
esac