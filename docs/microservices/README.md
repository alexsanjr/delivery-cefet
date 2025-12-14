# Documentação dos Microserviços

Esta pasta contém a documentação detalhada de cada microserviço do sistema de delivery.

## Visão Geral da Arquitetura

O projeto utiliza duas abordagens arquiteturais dependendo da complexidade do domínio:

| Microserviço | Arquitetura | Padrões GoF | Descrição |
|-------------|-------------|-------------|-----------|
| **mscustomers** |  DDD + Hexagonal | Decorator | Gerenciamento de clientes e endereços |
| **msorders** |  DDD + Hexagonal | Strategy, Adapter | Pedidos e cálculo de preços |
| **msdelivery** |  DDD + Hexagonal | - | Entregas e entregadores |
| **msrouting** |  DDD + Hexagonal | Adapter | Cálculo de rotas otimizadas |
| **msnotifications** | DDD + Hexagonal | Factory Method, Observer | Notificações multi-canal |
| **mstracking** | DDD + Hexagonal | Factory Method, Observer | Rastreamento em tempo real |

> **DDD + Hexagonal**: Aggregate Roots, Value Objects, Use Cases, Repository Interfaces, Domain Events  
> Todos os 6 microserviços implementam DDD + Arquitetura Hexagonal com domain/, application/, infrastructure/ e presentation/

Para detalhes completos sobre DDD e Arquitetura Hexagonal, veja: [docs/architecture/ddd-hexagonal.md](../architecture/ddd-hexagonal.md)

## Microserviços do Sistema

### [MS Customers](mscustomers.md) 
**Porta**: 3001 | **Banco**: db_customers | **APIs**: GraphQL + gRPC

Gerenciamento de clientes e endereços de entrega.

**Arquitetura DDD**:
- **Aggregate Root**: Cliente (com Endereços)
- **Value Objects**: Email, Telefone, CPF, CEP
- **Use Cases**: CriarCliente, AtualizarCliente, AdicionarEndereco
- **Padrão GoF**: Decorator (logging de repositórios)

**Principais funcionalidades**:
- Cadastro e autenticação de clientes
- Gerenciamento de múltiplos endereços
- Suporte a clientes premium
- Fornecimento de dados via gRPC para outros serviços
- RabbitMQ + Protobuf para mensageria

**Tecnologias**: NestJS, Prisma, GraphQL, gRPC, RabbitMQ

---

### [MS Orders](msorders.md) 
**Porta**: 3000 | **Banco**: db_orders | **APIs**: GraphQL + gRPC

Gestão de pedidos e catálogo de produtos.

**Arquitetura DDD**:
- **Aggregate Root**: Order (Pedido com OrderItems)
- **Domain Events**: OrderCreated, OrderStatusChanged
- **Use Cases**: CreateOrder, UpdateOrderStatus
- **Padrões GoF**: Strategy (cálculo de preços), Adapter (Hexagonal)

**Principais funcionalidades**:
- Criação e acompanhamento de pedidos
- Catálogo de produtos
- Cálculo dinâmico de preços com múltiplas estratégias
- Estimativa de tempo de entrega
- DataLoader para otimização de queries N+1

**Tecnologias**: NestJS, Prisma, GraphQL, gRPC, DataLoader

---

### [MS Delivery](msdelivery.md)
**Porta**: 3003 | **Banco**: db_delivery | **APIs**: GraphQL + gRPC

Coordenação de entregas e gerenciamento de entregadores.

**Arquitetura DDD**:
- **Entities**: DeliveryEntity, DeliveryPersonEntity
- **Value Objects**: Location, Email, Phone, CPF
- **Use Cases**: AssignDelivery, UpdateDeliveryStatus, UpdateLocation
- **Repository Interfaces**: IDeliveryRepository, IDeliveryPersonRepository

**Principais funcionalidades**:
- Cadastro de entregadores
- Atribuição inteligente de entregas
- Controle de status e disponibilidade
- Rastreamento de localização em tempo real
- Integração com MS Routing para cálculo de rotas

**Tecnologias**: NestJS, Prisma, GraphQL, gRPC

---

### [MS Routing](msrouting.md)
**Porta**: 3004 | **APIs**: gRPC apenas

Cálculo de rotas otimizadas para entregas.

**Arquitetura DDD** (Exemplo completo):
- **Aggregate Root**: Rota
- **Value Objects**: Distancia, Duracao
- **Domain Services**: CalculadorCustosRota, OtimizadorRotas
- **Use Cases**: CalcularRotaUseCase, CalcularETAUseCase
- **Padrão GoF**: Adapter (GeoapifyAPIAdapter para integração externa)

**Principais funcionalidades**:
- Múltiplas estratégias de roteamento via enum (MAIS_RAPIDA, MAIS_CURTA, MAIS_ECONOMICA, ECO_FRIENDLY)
- Cache inteligente de rotas calculadas (Redis)
- Estimativa de tempo, distância e custo com Domain Services
- Integração com API externa Geoapify via Adapter Pattern
- Fallback para cálculo mock (Haversine) em caso de erro
- Consideração de tipo de veículo (BICICLETA, MOTO, CARRO, PATINETE, A_PE)
- RabbitMQ + Protobuf para mensageria

**Nota**: Usa enum + Domain Service (não Strategy Pattern com classes) pois a lógica é simples (multiplicadores de custo).

**Tecnologias**: NestJS, gRPC, GraphQL, Redis, RabbitMQ, Axios

---

### [MS Notifications](msnotifications.md)
**Porta**: 3002 | **APIs**: GraphQL + gRPC

Envio de notificações multi-canal.

**Arquitetura DDD**:
- **Entities**: NotificationEntity
- **Value Objects**: NotificationId, UserId, OrderId, NotificationStatus, ServiceOrigin
- **Use Cases**: SendNotification, GetNotificationHistory
- **Padrões GoF**: 
  - Factory Method (NotificationFactory para criar Email/SMS)
  - Observer (NotificationSubjectAdapter + Observers para múltiplos canais)
- **Repository Interfaces**: INotificationRepository

**Principais funcionalidades**:
- Notificações por terminal e logs (email/SMS via Factory Method)
- Persistência em Redis (não TypeORM/PostgreSQL)
- Observer Pattern para desacoplar canais de notificação
- Factory Method para criação de diferentes tipos de notificação
- RabbitMQ + Protobuf para mensageria assíncrona

**Tecnologias**: NestJS, GraphQL, gRPC, Redis, RabbitMQ

---

### [MS Tracking](mstracking.md)
**Porta**: 3005 | **Banco**: db_tracking | **APIs**: GraphQL + Subscriptions

Rastreamento em tempo real de entregas.

**Arquitetura DDD**:
- **Entities**: DeliveryTracking, TrackingPosition
- **Value Objects**: Position (validação de coordenadas), ETA (tempo estimado)
- **Use Cases**: UpdatePositionUseCase, GetTrackingDataUseCase, StartTrackingUseCase
- **Padrões GoF**: 
  - Factory Method (NotificationFactory para Email/SMS)
  - Observer (PositionSubjectAdapter + PositionLoggerObserver)
- **Repository Interfaces**: TypeORM repositories

**Principais funcionalidades**:
- Rastreamento de posição em tempo real
- Histórico de localizações
- Cálculo de ETA com Value Objects
- GraphQL Subscriptions (PubSub) para atualizações real-time
- Observer Pattern para notificações de posição
- Factory Method para diferentes tipos de notificação
- Geofencing para alertas de proximidade
- RabbitMQ + Protobuf para mensageria

**Tecnologias**: NestJS, TypeORM, PostgreSQL, GraphQL (Apollo Server com Subscriptions), gRPC, RabbitMQ

---

## Comunicação Entre Serviços

### Comunicação Síncrona (gRPC)

Usada quando precisamos de resposta imediata:

```
1. Cliente → Kong → MS Orders (GraphQL)
2. MS Orders → MS Customers (gRPC) - Busca dados do cliente
3. MS Orders → MS Routing (gRPC) - Calcula rota
4. MS Delivery → MS Routing (gRPC) - Calcula tempo de entrega
```

**Características:**
- Baixa latência (< 50ms típico)
- Tipagem forte com Protocol Buffers
- Requisição/resposta imediata
- Ideal para: buscar dados, validações síncronas

### Comunicação Assíncrona (RabbitMQ + Protobuf)

Usada para desacoplar serviços e garantir entrega confiável:

```
Saga Coreografado - Criação de Pedido:

msorders
   │ Publica: OrderCreatedEvent
   ▼
RabbitMQ Exchange (events)
   │
   ├──> Queue: orders.created ──> msdelivery
   │    └─> Cria entrega automaticamente
   │
   ├──> Queue: orders.created ──> msnotifications
   │    └─> Notifica cliente por email/SMS
   │
   └──> Queue: orders.created ──> mstracking
        └─> Inicia rastreamento
```

**Eventos implementados:**

| Evento | Publisher | Consumers | Protobuf |
|--------|-----------|-----------|----------|
| `order.created` | msorders | msdelivery, msnotifications, mstracking | Sim |
| `order.status.changed` | msorders | msnotifications, mstracking | Sim |
| `delivery.assigned` | msdelivery | msnotifications, mstracking | Sim |
| `delivery.delivered` | msdelivery | msorders, msnotifications | Sim |
| `customer.created` | mscustomers | msnotifications | Sim |

**Características:**
- Entrega garantida (durabilidade + ack)
- Desacoplamento total (serviços não se conhecem)
- Retry automático em falhas
- Dead Letter Queue para erros
- Serialização eficiente com Protobuf

Veja [ADR #13](../architecture/adr.md) para implementação completa.

### Protocolos por Caso de Uso

| Cenário | Protocolo | Motivo |
|---------|-----------|--------|
| Cliente consultando pedidos | GraphQL | Flexibilidade, escolha de campos |
| Orders buscar dados de cliente | gRPC | Performance, tipagem forte |
| Pedido criado → criar entrega | RabbitMQ | Desacoplamento, garantia de entrega |
| Delivery calcular rota | gRPC | Comunicação servidor-servidor |
| Status mudou → notificar | RabbitMQ | Assíncrono, múltiplos consumidores |
| Cliente acompanhando entrega | GraphQL Subscriptions | Tempo real, push de atualizações via PubSub |

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
| Notifications | Redis (não PostgreSQL) | - |
| Tracking | db_tracking | delivery_tracking, tracking_positions |

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
- **ORM**: Prisma (exceto mstracking que usa TypeORM)
- **Banco**: PostgreSQL (exceto msnotifications que usa Redis)
- **APIs**: GraphQL (Apollo Server) e/ou gRPC
- **Mensageria**: RabbitMQ + Protobuf
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

### Testes Unitários e de Integração

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

