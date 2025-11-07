# Kong Gateway - Delivery CEFET

Este diretório contém a configuração completa do Kong Gateway para o projeto Delivery CEFET.

## 📁 Estrutura do Projeto

```
kong-gateway/
├── docker-compose.yml          # Configuração principal
├── kong/
│   ├── kong.yml               # Configuração do Kong (não usado atualmente)
│   └── declarative/
│       └── kong.yml           # Configuração declarativa
└── scripts/
    ├── init-kong.sh           # Script de inicialização
    └── wait-for-db.sh         # Script para aguardar DB
```

## 🚀 Quick Start

```bash
# Iniciar todos os serviços
docker compose up -d

# Verificar status
docker compose ps

# Ver logs do Kong
docker compose logs kong -f
```

## 🔧 Configuração dos Serviços

### Serviços Registrados no Kong

| Serviço | URL Interna | Rota Pública | Porta Externa |
|---------|-------------|--------------|---------------|
| msorders | http://msorders:3000 | /api/orders | 3001 |
| mscustomers | http://mscustomers:3000 | /api/customers | 3002 |
| msnotifications | http://msnotifications:3000 | /api/notifications | 3003 |
| msrouting | http://msrouting:3004 | /api/routing | 3004 |
| msdelivery | http://msdelivery:3003 | /api/delivery | 3005 |

### Comandos para Configurar Novos Serviços

#### 1. Registrar Serviço no Kong

```bash
# Exemplo para um novo microsserviço
curl -X POST http://localhost:8001/services \
  --data name=msnovo-service \
  --data url=http://msnovo:3000
```

#### 2. Criar Rota para o Serviço

```bash
# Criar rota
curl -X POST http://localhost:8001/services/msnovo-service/routes \
  --data paths[]=/api/novo \
  --data methods[]=GET \
  --data methods[]=POST \
  --data methods[]=PUT \
  --data methods[]=DELETE \
  --data strip_path=true
```

#### 3. Verificar Configuração

```bash
# Listar serviços
curl http://localhost:8001/services

# Listar rotas
curl http://localhost:8001/routes

# Testar rota
curl http://localhost:8000/api/novo/
```

> **⚠️ IMPORTANTE**: O parâmetro `strip_path=true` é **crucial** para que os microsserviços funcionem! Ele remove o prefixo da rota (`/api/orders`, `/api/customers`) antes de enviar para o microsserviço, que espera apenas `/graphql`.

## 🗃️ Bancos de Dados

### PostgreSQL Instances

```yaml
# Orders Database (porta 5434)  
postgres-orders:
  image: postgres:13
  environment:
    POSTGRES_DB: orders
    POSTGRES_USER: orders
    POSTGRES_PASSWORD: orders123

# Customers Database (porta 5435)
postgres-customers:
  image: postgres:13
  environment:
    POSTGRES_DB: customers
    POSTGRES_USER: customers
    POSTGRES_PASSWORD: customers123

# Routing Database (porta 5436)
postgres-routing:
  image: postgres:13
  environment:
    POSTGRES_DB: routing
    POSTGRES_USER: routing
    POSTGRES_PASSWORD: routing123

# Delivery Database (porta 5437)
postgres-delivery:
  image: postgres:13
  environment:
    POSTGRES_DB: delivery
    POSTGRES_USER: delivery
    POSTGRES_PASSWORD: delivery123
```

## 🔍 Monitoramento e Debug

### Kong Admin API

```bash
# Status do Kong
curl http://localhost:8001/status

# Informações do nó
curl http://localhost:8001/

# Métricas
curl http://localhost:8001/metrics

# Configuração atual
curl http://localhost:8001/config
```

### Verificar Conectividade

```bash
# Teste de conectividade entre serviços
docker compose exec kong ping msorders
docker compose exec kong ping mscustomers

# Verificar resolução DNS
docker compose exec kong nslookup msorders
docker compose exec kong nslookup mscustomers
```

### Logs Úteis

```bash
# Logs do Kong com filtros
docker compose logs kong | grep ERROR
docker compose logs kong | grep -i upstream

# Logs dos microsserviços
docker compose logs msorders --tail=50
docker compose logs mscustomers --tail=50

# Logs de todos os serviços
docker compose logs --tail=20
```

## 🛠️ Comandos de Manutenção

### Restart Serviços

```bash
# Restart Kong apenas
docker compose restart kong

# Restart um microsserviço
docker compose restart msorders

# Restart todos os serviços
docker compose restart
```

### Rebuild Serviços

```bash
# Rebuild microsserviço específico
docker compose stop msorders
docker compose build msorders --no-cache
docker compose up msorders -d

# Rebuild todos
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Limpeza

```bash
# Parar todos os serviços
docker compose down

# Remover volumes (CUIDADO: apaga dados!)
docker compose down -v

# Limpeza completa do Docker
docker system prune -a
docker volume prune
```

## 📊 Health Checks

### Verificar Status dos Serviços

```bash
# Status via Kong
curl http://localhost:8000/api/orders/
curl http://localhost:8000/api/customers/

# Status direto dos microsserviços
curl http://localhost:3001/
curl http://localhost:3002/

# Health check dos bancos
docker compose exec postgres-orders pg_isready -U user -d msorders
docker compose exec postgres-customers pg_isready -U user -d mscustomers
```

### Monitoramento Contínuo

```bash
# Watch status dos containers
watch docker compose ps

# Monitor recursos
docker stats

# Logs em tempo real
docker compose logs -f
```

## 🚨 Troubleshooting Common Issues

### Kong não consegue acessar microsserviços

```bash
# 1. Verificar se os containers estão na mesma rede
docker network ls
docker network inspect kong-gateway_kong-network

# 2. Verificar se os serviços estão registrados
curl http://localhost:8001/services

# 3. Verificar se as rotas estão corretas
curl http://localhost:8001/routes

# 4. Testar conectividade interna
docker compose exec kong curl http://msorders:3000
docker compose exec kong curl http://mscustomers:3000
```

### Microsserviços não conseguem conectar no banco

```bash
# 1. Verificar se os bancos estão healthy
docker compose ps

# 2. Verificar variáveis de ambiente
docker compose exec msorders env | grep DATABASE_URL

# 3. Testar conexão com banco
docker compose exec msorders npx prisma db pull

# 4. Verificar logs do banco
docker compose logs postgres-orders
```

### Performance Issues

```bash
# 1. Verificar uso de CPU/Memória
docker stats

# 2. Verificar logs de erro do Kong
docker compose logs kong | grep -i error

# 3. Verificar conexões do banco
docker compose exec postgres-orders psql -U user -d msorders -c "SELECT * FROM pg_stat_activity;"

# 4. Verificar rate limiting (se configurado)
curl http://localhost:8001/plugins
```

## 🔐 Segurança e Plugins

### Plugins Úteis do Kong

```bash
# Rate Limiting
curl -X POST http://localhost:8001/services/msorders-service/plugins \
  --data name=rate-limiting \
  --data config.minute=100 \
  --data config.hour=1000

# CORS
curl -X POST http://localhost:8001/services/msorders-service/plugins \
  --data name=cors \
  --data config.origins=* \
  --data config.methods=GET,POST,PUT,DELETE

# Authentication (API Key)
curl -X POST http://localhost:8001/services/msorders-service/plugins \
  --data name=key-auth

# Request/Response Logging
curl -X POST http://localhost:8001/plugins \
  --data name=file-log \
  --data config.path=/tmp/kong.log
```

### Listar Plugins Ativos

```bash
# Ver todos os plugins
curl http://localhost:8001/plugins

# Ver plugins de um serviço específico
curl http://localhost:8001/services/msorders-service/plugins
```

## 📈 Performance e Otimização

### Configurações Recomendadas

```yaml
# No docker-compose.yml, adicionar ao serviço Kong:
environment:
  - KONG_WORKER_PROCESSES=2
  - KONG_ADMIN_LISTEN=0.0.0.0:8001
  - KONG_PROXY_ACCESS_LOG=/dev/stdout
  - KONG_ADMIN_ACCESS_LOG=/dev/stdout
  - KONG_PROXY_ERROR_LOG=/dev/stderr
  - KONG_ADMIN_ERROR_LOG=/dev/stderr
  - KONG_LOG_LEVEL=info
```

### Monitoramento de Performance

```bash
# Ver estatísticas do Kong
curl http://localhost:8001/status

# Monitorar latência das requisições
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/orders/

# curl-format.txt content:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                     ----------\n
#           time_total:  %{time_total}\n
```

---

**Kong Gateway configurado para o projeto Delivery CEFET**