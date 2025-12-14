# Kong Gateway - API Gateway

Documentação da configuração e uso do Kong Gateway como ponto único de entrada para o sistema.

## O que é Kong Gateway

Kong é um API Gateway open-source que atua como intermediário entre clientes e microserviços. Ele centraliza funcionalidades como autenticação, rate limiting, CORS e roteamento.

## Por que usar API Gateway?

### Problemas Resolvidos

1. **Múltiplos Endpoints**: Sem gateway, clientes precisariam conhecer URLs de todos os microserviços
2. **Autenticação Duplicada**: Cada serviço teria sua própria autenticação
3. **CORS Complexo**: Configuração de CORS em cada serviço
4. **Rate Limiting**: Controle de taxa descentralizado
5. **Logs**: Monitoramento distribuído

### Benefícios

- Ponto único de entrada
- Autenticação centralizada
- Rate limiting configurável
- CORS padronizado
- Logs centralizados
- Load balancing
- Cache de respostas

## Arquitetura

```
Cliente (Browser/App)
         │
         ▼
   Kong Gateway (porta 8000)
    │         │         │         │         │         │         │
    │         │         │         │         │         │         │
  BFF     msorders  mscustomers  msrouting  msnotifications  mstracking  (msdelivery via BFF)
 (3006)    (3000)     (3000)      (3004)       (3000)        (3005)
```

**Nota importante:** O msdelivery não é exposto diretamente pelo Kong. Ele é acessado apenas via **bff-delivery**, que traduz requisições GraphQL em chamadas gRPC internas.

## Estrutura do Projeto

```
kong-gateway/
├── kong/
│   └── declarative/
│       └── kong.yml          # Configuração declarativa
├── auth-service.js           # Serviço de autenticação JWT
├── docker-compose.yml        # Docker setup
├── Dockerfile.auth           # Container do auth-service
├── start-services.ps1        # Script de inicialização (Windows)
├── restart-docker.ps1        # Reiniciar containers
└── README.md
```

## Configuração Declarativa (kong.yml)

### Estrutura Básica

```yaml
_format_version: "3.0"
_transform: true

services:
  - name: nome-do-servico
    url: http://host:port
    routes:
      - paths: [/caminho]
        methods: [GET, POST]
    plugins:
      - name: plugin-name
        config: {}
```

### Serviços Configurados

#### 1. BFF Delivery (Backend For Frontend)

```yaml
services:
  - name: bff-delivery
    url: http://bff-delivery:3006
    tags: [delivery, graphql, bff]
    routes:
      - name: bff-delivery-graphql
        paths: [/delivery]
        methods: [GET, POST, OPTIONS]
    plugins:
      - name: jwt
        config:
          header_names: [Authorization]
          claims_to_verify: [exp]
      - name: rate-limiting
        config:
          minute: 100
          hour: 1000
      - name: cors
        config:
          origins: ["*"]
          credentials: true
```

**Funcionalidades:**
- Camada de tradução GraphQL → gRPC
- Acessa msdelivery internamente via gRPC
- Requer autenticação JWT
- Rate limit: 100 req/min, 1000 req/hora

**Endpoints:**
- `POST /delivery` - GraphQL endpoint para operações de entrega

#### 2. Auth Service (Autenticação)

```yaml
services:
  - name: auth
    url: http://auth-service:3100
    tags: [auth, public]
    routes:
      - name: auth-login
        paths: [/auth]
        methods: [GET, POST, OPTIONS]
    plugins:
      - name: cors
        config:
          origins: ["*"]
          credentials: true
```

**Endpoints:**
- `POST /auth` - Login e geração de token JWT

#### 3. MS Orders

```yaml
services:
  - name: msorders
    url: http://msorders:3000
    routes:
      - paths: [/orders]
    plugins:
      - name: jwt
        config:
          header_names: [Authorization]
          claims_to_verify: [exp]
      - name: rate-limiting
        config:
          minute: 100
          hour: 1000
```

**Funcionalidades:**
- Requer autenticação JWT
- Rate limit: 100 req/min, 1000 req/hora
- CORS habilitado

#### 3. MS Customers

```yaml
services:
  - name: mscustomers
    url: http://mscustomers:3000
    routes:
      - paths: [/customers]
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 100
          hour: 1000
```

Similar ao msorders com mesmas proteções.

#### 5. MS Routing

```yaml
services:
  - name: msrouting
    url: http://msrouting:3004
    tags: [routing, graphql]
    routes:
      - name: msrouting-graphql
        paths: [/routing]
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 200
          hour: 2000
```

**Funcionalidades:**
- Cálculo de rotas e ETAs
- Diferentes estratégias de roteamento
- Cache com Redis
- Rate limit mais alto: 200 req/min (rotas são consultadas frequentemente)

**Endpoints:**
- `POST /routing` - GraphQL endpoint para cálculo de rotas

#### 6. MS Notifications

```yaml
services:
  - name: msnotifications
    url: http://msnotifications:3000
    routes:
      - paths: [/notifications]
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 200
          hour: 2000
```

Rate limit mais alto para suportar volume de notificações.

#### 7. MS Tracking

```yaml
services:
  - name: mstracking
    url: http://mstracking:3005
    routes:
      - paths: [/tracking]
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 150
          hour: 1500
```


## Plugins Utilizados

### 1. JWT Plugin

Valida tokens JWT em requisições.

**Configuração:**
```yaml
plugins:
  - name: jwt
    config:
      uri_param_names: [jwt]
      header_names: [Authorization]
      claims_to_verify: [exp]
      run_on_preflight: false
```

**Como funciona:**
1. Cliente envia `Authorization: Bearer <token>`
2. Kong valida assinatura do token
3. Kong verifica expiração (claim `exp`)
4. Se válido, requisição segue para microserviço
5. Se inválido, retorna 401 Unauthorized

### 2. Rate Limiting Plugin

Controla taxa de requisições.

**Configuração:**
```yaml
plugins:
  - name: rate-limiting
    config:
      minute: 100    # 100 requisições por minuto
      hour: 1000     # 1000 requisições por hora
      policy: local  # Armazenamento local
```

**Respostas:**
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- Quando excede: 429 Too Many Requests

### 3. CORS Plugin

Habilita CORS para requisições cross-origin.

**Configuração:**
```yaml
plugins:
  - name: cors
    config:
      origins: ["*"]
      methods: [GET, POST, PUT, DELETE, OPTIONS]
      headers: [Accept, Content-Type, Authorization]
      credentials: true
      max_age: 3600
```

**Funcionalidade:**
- Permite requisições de qualquer origem
- Suporta credenciais (cookies, auth headers)
- Cache de preflight por 1 hora

## Auth Service (JWT)

Serviço Node.js simples para gerar tokens JWT.

### Implementação

```javascript
// auth-service.js
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.post('/auth', (req, res) => {
  const { username, password } = req.body;

  // Validação simples (em produção, validar com banco)
  if (username === 'admin' && password === 'admin') {
    const token = jwt.sign(
      {
        sub: 1,
        username: username,
        role: 'admin',
        iss: 'delivery-system'
      },
      SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ token, expiresIn: 86400 });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

app.listen(3100, () => {
  console.log('Auth service running on port 3100');
});
```

### Consumers (Consumidores)

Kong usa consumers para gerenciar credenciais:

```yaml
consumers:
  - username: web-app
    tags: [frontend, web]
    jwt_secrets:
      - key: web-app-issuer
        algorithm: HS256
        secret: __KONG_JWT_SECRET_WEB_APP__

  - username: admin-panel
    tags: [admin, internal]
    jwt_secrets:
      - key: admin-panel-issuer
        algorithm: HS256
        secret: __KONG_JWT_SECRET_ADMIN_PANEL__
```

## Resumo dos Serviços Expostos

| Serviço | URL Kong | URL Interna | Porta | Rate Limit (min/hora) | GraphQL |
|---------|----------|-------------|-------|----------------------|----------|
| **auth-service** | /auth | http://auth-service:3100 | 3100 | Sem limite | Não |
| **bff-delivery** | /delivery | http://bff-delivery:3006 | 3006 | 100/1000 | Sim |
| **msorders** | /orders | http://msorders:3000 | 3000 | 100/1000 | Sim |
| **mscustomers** | /customers | http://mscustomers:3000 | 3000 | 100/1000 | Sim |
| **msrouting** | /routing | http://msrouting:3004 | 3004 | 200/2000 | Sim |
| **msnotifications** | /notifications | http://msnotifications:3000 | 3000 | 200/2000 | Sim |
| **mstracking** | /tracking | http://mstracking:3005 | 3005 | 150/1500 | Sim |
| **msdelivery** | (não exposto) | Via bff-delivery:3006 | - | Via BFF | gRPC |

**Observações:**
- Todos os serviços (exceto auth) requerem JWT
- Todos têm CORS habilitado

## Como Usar

### 0. Configuração Inicial

**Arquivo .env requerido:**

O Kong usa variáveis de ambiente para JWT secrets. Copie `.env.example` para `.env`:

```bash
cd kong-gateway
cp .env.example .env
```

**Conteúdo do .env:**
```env
# JWT Secrets (usar valores seguros em produção)
KONG_JWT_SECRET_WEB_APP=your-web-app-secret-key-here
KONG_JWT_SECRET_ADMIN_PANEL=your-admin-panel-secret-key-here

# Database configs para cada microserviço
POSTGRES_CUSTOMERS_USER=postgres
POSTGRES_CUSTOMERS_PASSWORD=postgres
POSTGRES_CUSTOMERS_DB=customers
# ... (outros bancos)
```

**Importante:** O arquivo `.env` é usado pelo `kong-config-generator` para injetar os secrets no `kong.yml`.

### 1. Instalação

```bash
cd kong-gateway

# Iniciar todos os serviços com Docker Compose
docker-compose up -d

# Ou usar o script PowerShell (Windows)
.\start-services.ps1
```

**O que será iniciado:**
- Kong Gateway (porta 8000)
- Kong Admin API (porta 8001)
- Auth Service (porta 3100)
- PostgreSQL (5 instâncias - customers, orders, delivery, routing, tracking)
- RabbitMQ (porta 5672, management 15672)
- Redis (2 instâncias - notifications, routing)
- 6 microserviços 

### 2. Login

```bash
curl -X POST http://localhost:8000/auth \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

Resposta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

### 3. Fazer Requisições

```bash
# Com token JWT
curl -X POST http://localhost:8000/orders \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ orders { id status } }"}'
```

### 4. Requisições GraphQL

**Clientes:**
```bash
curl -X POST http://localhost:8000/customers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createCustomer(input: { name: \"João\" email: \"joao@example.com\" phone: \"11999999999\" }) { id name } }"
  }'
```

**Entregas (via BFF):**
```bash
curl -X POST http://localhost:8000/delivery \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { deliveries { id status customerAddress } }"
  }'
```

**Rotas:**
```bash
curl -X POST http://localhost:8000/routing \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { calculateRoute(origin: { latitude: -23.5505, longitude: -46.6333 } destination: { latitude: -23.5629, longitude: -46.6544 } strategy: FASTEST) { distance duration } }"
  }'
```

## Portas Expostas

### Portas Principais

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| **Kong Gateway** | 8000 | Ponto de entrada principal para clientes |
| **Kong Admin API** | 8001 | API administrativa do Kong |
| **Kong Admin API (SSL)** | 8444 | Admin API HTTPS |
| **Auth Service** | 3100 | Serviço de autenticação JWT |

### Portas dos Microserviços (Expostas para Debug)

| Microserviço | Porta HTTP | Porta gRPC | Uso |
|--------------|------------|------------|-----|
| mscustomers | 3002 | 50051 | Debug/testes |
| msorders | 3001 | 50052 | Debug/testes |
| msnotifications | 3003 | 50053 | Debug/testes |
| msrouting | - | 50054 | Debug/testes |
| mstracking | 3005 | 50055 | Debug/testes |
| msdelivery | - | 50056 | Apenas gRPC via BFF |
| bff-delivery | 3006 | - | GraphQL endpoint |

### Portas de Infraestrutura

| Serviço | Porta | Uso |
|---------|-------|-----|
| postgres-customers | 5435 | Banco clientes |
| postgres-orders | 5434 | Banco pedidos |
| postgres-delivery | 5438 | Banco entregas |
| postgres-routing | 5436 | Banco rotas |
| postgres-tracking | 5437 | Banco tracking |
| rabbitmq | 5672 | AMQP |
| rabbitmq-management | 15672 | UI de gerenciamento |
| redis-notifications | 6379 | Cache notificações |
| redis-routing | 6380 | Cache rotas |

**Nota:** Em produção, apenas as portas 8000 (Kong) e 8001 (Admin) devem estar expostas. As outras são úteis para desenvolvimento e debug.

## Administração

### Admin API

Kong fornece API administrativa na porta 8001:

```bash
# Listar serviços
curl http://localhost:8001/services

# Listar rotas
curl http://localhost:8001/routes

# Listar plugins
curl http://localhost:8001/plugins

# Status do Kong
curl http://localhost:8001/status
```

### Logs

```bash
# Logs do Kong
docker logs kong-gateway

# Logs do auth-service
docker logs auth-service
```

## Monitoramento

### Health Check

```bash
# Status do Kong
curl http://localhost:8000/

# Health de cada serviço via Kong
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/orders/health
```

### Métricas

Kong expõe métricas em:
- Prometheus: porta 8001/metrics
- Status API: porta 8001/status

## Scripts de Gerenciamento

### start-services.ps1 (Windows)

```powershell
# Iniciar Kong e Auth Service
docker-compose up -d

Write-Host "Kong Gateway: http://localhost:8000"
Write-Host "Admin API: http://localhost:8001"
Write-Host "Auth Service: http://localhost:3100"
```

### restart-docker.ps1

```powershell
# Reiniciar todos os containers
docker-compose down
docker-compose up -d --build
```

## Segurança

### Boas Práticas Implementadas

1. **JWT com expiração**: Tokens expiram em 24h
2. **HTTPS em produção**: Configurar certificado SSL
3. **Rate limiting**: Previne abuso
4. **CORS restritivo**: Em produção, especificar origens
5. **Secrets externos**: Usar variáveis de ambiente

### Melhorias para Produção

```yaml
# Adicionar em kong.yml
plugins:
  - name: ip-restriction
    config:
      allow: [10.0.0.0/8]  # Apenas IPs internos

  - name: request-size-limiting
    config:
      allowed_payload_size: 10  # 10 MB máximo

  - name: bot-detection
    config:
      allow: []
      deny: [bot, crawler]
```

## Fluxo de Autenticação Completo

### 1. Login

```
Cliente → Kong (/auth) → Auth Service
         ← Token JWT ←
```

### 2. Requisição Autenticada

```
Cliente → Kong (/customers) 
           ↓ (valida JWT)
           ✓ Token válido
           ↓
       mscustomers → PostgreSQL
           ↓
       ← Dados ←
Cliente ← Kong ←
```


## Troubleshooting

### Kong não inicia

```bash
# Verificar logs
docker logs kong-gateway-kong-1

# Validar configuração
docker exec kong-gateway-kong-1 kong config parse /etc/kong/kong.yml

# Verificar se .env existe
ls kong-gateway/.env
```

### 401 Unauthorized

**Possíveis causas:**
- Token não está no header `Authorization: Bearer <token>`
- Token expirou (validade: 24h)
- Secret JWT diferente entre auth-service e Kong
- Consumer não configurado no Kong

**Como debugar:**
```bash
# Ver configuração de consumers
curl http://localhost:8001/consumers

# Ver JWT secrets
curl http://localhost:8001/consumers/web-app/jwt

# Testar token manualmente
curl http://localhost:8000/customers \
  -H "Authorization: Bearer <SEU_TOKEN>"
```

### 429 Too Many Requests

**Causa:** Rate limit excedido

**Headers de resposta:**
```
X-RateLimit-Limit-Minute: 100
X-RateLimit-Remaining-Minute: 0
```

**Soluções:**
- Aguardar reset (1 minuto/1 hora)
- Reduzir frequência de requisições
- Aumentar limites se justificado

### CORS Error

**Sintoma:** Erro no browser console

```
Access to fetch at 'http://localhost:8000/customers' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Verificação:**
```bash
# Testar preflight OPTIONS
curl -X OPTIONS http://localhost:8000/customers \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Solução:** Verificar configuração CORS no `kong.yml`

### BFF não consegue acessar msdelivery

**Sintoma:** Erro "Failed to connect to msdelivery:50056"

**Causas:**
- msdelivery não está rodando
- Porta gRPC incorreta
- Rede Docker não conectada

**Verificação:**
```bash
# Verificar se msdelivery está rodando
docker ps | grep msdelivery

# Testar conectividade da rede
docker exec bff-delivery ping msdelivery

# Ver logs do BFF
docker logs kong-gateway-bff-delivery-1
```

### Container de migrations falhou

**Sintoma:** Serviços não iniciam porque migrations falharam

**Solução:**
```bash
# Ver logs de migrations
docker logs kong-gateway-customers-migrations-1
docker logs kong-gateway-orders-migrations-1
docker logs kong-gateway-delivery-migrations-1

# Remover volumes e recriar
docker-compose down -v
docker-compose up -d
```

---


