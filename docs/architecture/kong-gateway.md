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
    │    │    │    │    │
    ▼    ▼    ▼    ▼    ▼
   MS1  MS2  MS3  MS4  MS5
```

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

#### 1. Auth Service (Autenticação)

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

#### 2. MS Orders

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

#### 4. MS Delivery

```yaml
services:
  - name: msdelivery
    url: http://msdelivery:3000
    routes:
      - paths: [/delivery]
        methods: [GET, POST, PUT, DELETE, PATCH, OPTIONS]
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 150
          hour: 1500
```

Rate limit mais alto por ser serviço crítico de entregas.

#### 5. MS Notifications

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

#### 6. MS Tracking

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

## Como Usar

### 1. Instalação

```bash
cd kong-gateway

# Com Docker
docker-compose up -d

# Ou localmente
npm install
node auth-service.js
```

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

### 4. Requisição GraphQL

```bash
curl -X POST http://localhost:8000/customers \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createCustomer(input: { name: \"João\" email: \"joao@example.com\" phone: \"11999999999\" }) { id name } }"
  }'
```

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

## Troubleshooting

### Kong não inicia

```bash
# Verificar logs
docker logs kong-gateway

# Validar configuração
docker exec kong-gateway kong config parse /etc/kong/kong.yml
```

### 401 Unauthorized

- Verificar se token está no header correto
- Verificar se token não expirou
- Verificar secret do JWT

### 429 Too Many Requests

- Verificar rate limits configurados
- Aguardar reset do período
- Aumentar limites se necessário

### CORS Error

- Verificar origens permitidas
- Verificar headers permitidos
- Verificar métodos HTTP

