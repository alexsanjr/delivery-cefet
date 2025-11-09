# Documentação dos Microserviços

Esta pasta contém a documentação detalhada de cada microserviço do sistema de delivery.

## Microserviços do Sistema

### [MS Customers](mscustomers.md)
**Porta**: 3001 | **Banco**: db_customers | **APIs**: GraphQL + gRPC

Gerenciamento de clientes e endereços de entrega.

**Principais funcionalidades**:
- Cadastro e autenticação de clientes
- Gerenciamento de múltiplos endereços
- Suporte a clientes premium
- Fornecimento de dados via gRPC para outros serviços

**Tecnologias**: NestJS, Prisma, GraphQL, gRPC

---

### [MS Orders](msorders.md)
**Porta**: 3000 | **Banco**: db_orders | **APIs**: GraphQL + gRPC

Gestão de pedidos e catálogo de produtos.

**Principais funcionalidades**:
- Criação e acompanhamento de pedidos
- Catálogo de produtos
- Cálculo dinâmico de preços (Strategy Pattern)
- Estimativa de tempo de entrega
- DataLoader para otimização

**Padrões implementados**: Strategy (preços), Datasource, DataLoader

**Tecnologias**: NestJS, Prisma, GraphQL, gRPC, DataLoader

---

### [MS Delivery](msdelivery.md)
**Porta**: 3003 | **Banco**: db_delivery | **APIs**: GraphQL + gRPC

Coordenação de entregas e gerenciamento de entregadores.

**Principais funcionalidades**:
- Cadastro de entregadores
- Atribuição inteligente de entregas
- Controle de status e disponibilidade
- Rastreamento de localização em tempo real
- Integração com MS Routing para cálculo de rotas

**Tecnologias**: NestJS, Prisma, GraphQL, gRPC

---

### [MS Notifications](msnotifications.md)
**Porta**: 3002 | **Banco**: db_notifications | **APIs**: GraphQL + gRPC

Sistema de notificações assíncronas multi-canal.

**Principais funcionalidades**:
- Envio de notificações por email, SMS e push
- Sistema de templates personalizáveis
- Retry automático para falhas
- Cache de notificações recentes (Redis)
- Histórico de notificações

**Tecnologias**: NestJS, TypeORM, GraphQL, gRPC, Redis

---

### [MS Routing](msrouting.md)
**Porta**: 3004 | **APIs**: gRPC apenas

Cálculo de rotas otimizadas para entregas.

**Principais funcionalidades**:
- Múltiplos algoritmos de roteamento (Strategy Pattern)
- Cache de rotas calculadas (Redis)
- Estimativa de tempo, distância e custo
- Integração com APIs externas de mapas
- Consideração de tipo de veículo

**Estratégias disponíveis**: Fastest, Shortest, Economical, Eco-Friendly

**Padrões implementados**: Strategy (rotas), Cache

**Tecnologias**: NestJS, gRPC, Redis

---

### [MS Tracking](mstracking.md)
**Porta**: 3005 | **Banco**: db_tracking | **APIs**: GraphQL + WebSocket

Rastreamento em tempo real de entregas.

**Principais funcionalidades**:
- Rastreamento de posição em tempo real
- Histórico de localizações
- Cálculo de ETA (tempo estimado de chegada)
- WebSocket para atualizações live
- Geofencing para alertas de proximidade

**Tecnologias**: NestJS, Prisma, GraphQL, WebSocket

---

## Comunicação Entre Serviços

### Fluxo de Criação de Pedido

```
1. Cliente → Kong → MS Orders (GraphQL)
2. MS Orders → MS Customers (gRPC) - Busca dados do cliente
3. MS Orders → MS Delivery (gRPC) - Cria entrega
4. MS Delivery → MS Routing (gRPC) - Calcula rota
5. MS Delivery → MS Tracking (gRPC) - Inicia rastreamento
6. MS Orders → MS Notifications (gRPC) - Notifica cliente
```

### Protocolos por Caso de Uso

| Cenário | Protocolo | Motivo |
|---------|-----------|--------|
| Cliente consultando pedidos | GraphQL | Flexibilidade, escolha de campos |
| Orders buscar dados de cliente | gRPC | Performance, tipagem forte |
| Delivery calcular rota | gRPC | Comunicação servidor-servidor |
| Cliente acompanhando entrega | WebSocket | Tempo real, push de atualizações |

## Portas e Endpoints

### GraphQL Playgrounds

Após iniciar os serviços:

- MS Customers: http://localhost:3001/graphql
- MS Orders: http://localhost:3000/graphql
- MS Delivery: http://localhost:3003/graphql
- MS Notifications: http://localhost:3002/graphql
- MS Tracking: http://localhost:3005/graphql

### gRPC Endpoints

Não possuem interface web, usar grpcurl ou BloomRPC:

- MS Customers: localhost:50051
- MS Orders: localhost:50050
- MS Delivery: localhost:50053
- MS Notifications: localhost:50052
- MS Routing: localhost:50054
- MS Tracking: localhost:50055

## Bancos de Dados

Cada microserviço possui banco PostgreSQL isolado:

| Serviço | Database | Principais Tabelas |
|---------|----------|-------------------|
| Customers | db_customers | customers, addresses |
| Orders | db_orders | orders, order_items, products |
| Delivery | db_delivery | delivery_persons, deliveries |
| Notifications | db_notifications | notifications |
| Tracking | db_tracking | tracking_points |

### Acessando os Bancos

```bash
# Via Prisma Studio (quando disponível)
cd mscustomers
npm run prisma:studio

# Via psql
psql -h localhost -U postgres -d db_customers
```

## Stack Tecnológica Comum

Todos os microserviços compartilham:

- **Framework**: NestJS
- **Linguagem**: TypeScript
- **ORM**: Prisma (exceto msnotifications que usa TypeORM)
- **Banco**: PostgreSQL
- **APIs**: GraphQL (Apollo Server) e/ou gRPC
- **Validação**: class-validator + class-transformer
- **Testes**: Jest

## Padrões Arquiteturais

### Estrutura de Pastas (Padrão)

```
ms{nome}/
├── src/
│   ├── {dominio}/
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── entities/         # Modelos de dados
│   │   ├── interfaces/       # Contratos TypeScript
│   │   ├── services/         # Lógica de negócio
│   │   ├── resolvers/        # GraphQL resolvers
│   │   ├── strategies/       # Strategy Pattern (quando aplicável)
│   │   └── {dominio}.module.ts
│   ├── grpc/                 # Configuração gRPC
│   ├── prisma/               # Configuração Prisma
│   └── main.ts
├── prisma/                   # Schema e migrations
├── proto/                    # Arquivos .proto (quando aplicável)
└── package.json
```

### Princípios Seguidos

1. **Separation of Concerns**: Cada camada tem responsabilidade clara
2. **Dependency Injection**: Todas as dependências injetadas
3. **Module Pattern**: Funcionalidades agrupadas em módulos
4. **DTO Pattern**: Validação de entrada/saída
5. **Repository Pattern**: Abstração de dados via Prisma/TypeORM

## Desenvolvimento

### Executar Todos os Serviços

```powershell
# Windows
.\start-all-services.ps1

# Ou manualmente
cd mscustomers && npm run start:dev
cd msorders && npm run start:dev
# ... etc
```

### Executar Apenas Um Serviço

```bash
cd mscustomers
npm install
npm run start:dev
```

### Executar Migrações

```bash
cd mscustomers
npx prisma migrate dev
npx prisma generate
```

### Popular Dados de Teste

```bash
cd mscustomers
npm run prisma:seed
```

## Testes

Cada microserviço possui:

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

## Troubleshooting Comum

### Porta já em uso

```powershell
# Windows - Verificar processo
netstat -ano | findstr :3001

# Matar processo
taskkill /PID <PID> /F
```

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Verificar variável DATABASE_URL
echo $DATABASE_URL

# Testar conexão
npm run prisma:studio
```

### Erro ao gerar Prisma Client

```bash
# Limpar e regenerar
rm -rf node_modules/.prisma
npx prisma generate
```

### gRPC não conecta

```bash
# Verificar se serviço está rodando
grpcurl -plaintext localhost:50051 list

# Verificar proto files
ls proto/
```

