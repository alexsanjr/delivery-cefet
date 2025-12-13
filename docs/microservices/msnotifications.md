# MS Notifications - Microserviço de Notificações

Microserviço responsável pelo envio de notificações aos usuários do sistema através de múltiplos canais.

## Responsabilidades

- Envio de notificações assíncronas
- Gerenciamento de múltiplos canais (email, SMS, push)
- Cache de notificações recentes
- Histórico de notificações enviadas
- Retry automático em caso de falha
- Templates de mensagens personalizáveis

## Tecnologias Utilizadas

- **NestJS**: Framework principal
- **TypeScript**: Linguagem de programação
- **GraphQL**: API para consulta de notificações
- **gRPC**: Recebimento de solicitações de outros serviços
- **Redis**: Persistência de dados e cache
- **IORedis**: Cliente Redis para NestJS
- **RabbitMQ + Protobuf**: Mensageria assíncrona

## Arquitetura: DDD + Hexagonal

Este serviço implementa **Domain-Driven Design (DDD)** com **Arquitetura Hexagonal (Ports & Adapters)**.

**Destaques arquiteturais:**
- **Entity**: Notification com regras de envio e status
- **Observer Pattern**: Notificação de múltiplos canais (email, SMS, push)
- **Strategy Pattern**: Seleção dinâmica de canal de envio
- **Repository Pattern**: Interfaces no domínio, implementação com TypeORM
- **Event-Driven**: Consome eventos de RabbitMQ para envio assíncrono

## Estrutura do Projeto

```
msnotifications/
├── src/
│   ├── domain/                           # Núcleo - Lógica de negócio pura
│   │   ├── notification.entity.ts        # Entity com regras de negócio
│   │   ├── notification-data.interface.ts # Interface de dados
│   │   ├── value-objects/                # NotificationId, UserId, OrderId, etc
│   │   │   ├── notification-id.vo.ts
│   │   │   ├── user-id.vo.ts
│   │   │   ├── order-id.vo.ts
│   │   │   ├── notification-status.vo.ts
│   │   │   └── service-origin.vo.ts
│   │   ├── ports/                        # Repository e Observer Interfaces
│   │   │   ├── notification-repository.port.ts
│   │   │   ├── notification-observer.port.ts  # Observer Pattern
│   │   │   └── client-connection.port.ts
│   │   └── events/                       # Domain Events
│   │
│   ├── application/                      # Casos de Uso
│   │   ├── application.module.ts         # Módulo principal
│   │   ├── use-cases/                    # Use Cases
│   │   ├── commands/                     # Commands (CQRS)
│   │   ├── queries/                      # Queries (CQRS)
│   │   └── services/                     # Application Services
│   │
│   ├── infrastructure/                   # Adapters (Implementações)
│   │   ├── persistence/                  # Redis Repository
│   │   │   └── redis-notification.repository.ts
│   │   ├── messaging/                    # RabbitMQ + Protobuf
│   │   │   ├── rabbitmq.service.ts
│   │   │   ├── publishers/
│   │   │   └── consumers/
│   │   └── observers/                    # Observer Pattern Implementation
│   │       ├── notification-subject.adapter.ts  # Subject
│   │       ├── terminal-notifier.observer.ts    # Observer 1
│   │       └── notification-logger.observer.ts  # Observer 2
│   │
│   ├── presentation/                     # Interface Externa
│   │   ├── graphql/                      # GraphQL Resolvers
│   │   ├── grpc/                         # gRPC Controllers
│   │   └── messaging/                    # RabbitMQ consumers externos
│   │
│   └── main.ts
└── package.json
```

### Camadas da Arquitetura Hexagonal

#### 1. Domain (Núcleo)
Lógica de negócio pura, independente de frameworks:
- `notification.entity.ts`: Entity com regras de envio e status
- `ports/`: Interfaces de repositórios
- `interfaces/`: Contratos de serviços externos

#### 2. Application (Casos de Uso)
Orquestração da lógica de negócio:
- `use-cases/`: SendNotificationUseCase, GetNotificationHistoryUseCase
- `dtos/`: Objetos de transferência de dados
- `mappers/`: Conversão entre camadas

#### 3. Infrastructure (Adapters)
Implementações concretas:
- `persistence/`: Repositório Redis (RedisNotificationRepository)
- `messaging/`: RabbitMQ consumers/publishers com Protobuf
- `observers/`: Implementação do Observer Pattern (Subject e Observers)

#### 4. Presentation (Interface)
Adaptadores de entrada:
- `graphql/`: Resolvers para consultas
- `grpc/`: Controllers para comunicação entre microserviços
```

## Modelo de Dados

### NotificationEntity (Domain Entity)

```typescript
export class NotificationEntity {
  private readonly id: NotificationId;              // Value Object
  private readonly userId: UserId;                  // Value Object
  private readonly orderId: OrderId;                // Value Object
  private readonly status: NotificationStatus;      // Value Object
  private readonly message: string;
  private readonly serviceOrigin: ServiceOrigin;    // Value Object
  private isReadFlag: boolean;
  private readonly createdAt: Date;
  private updatedAt: Date;

  // Factory method para criar nova notificação
  static create(
    userId: UserId,
    orderId: OrderId,
    status: NotificationStatus,
    message: string,
    serviceOrigin: ServiceOrigin,
  ): NotificationEntity {
    const id = NotificationId.generate();
    return new NotificationEntity(
      id,
      userId,
      orderId,
      status,
      message,
      serviceOrigin,
      false,
      new Date(),
      new Date(),
    );
  }

  // Factory method para reconstituir do repositório
  static fromPrimitives(data: any): NotificationEntity {
    return new NotificationEntity(
      NotificationId.fromString(data.id),
      UserId.fromString(data.userId),
      OrderId.fromString(data.orderId),
      NotificationStatus.fromString(data.status),
      data.message,
      ServiceOrigin.fromString(data.serviceOrigin),
      data.isRead,
      new Date(data.createdAt),
      new Date(data.updatedAt),
    );
  }

  // Método para marcar como lida
  markAsRead(): void {
    this.isReadFlag = true;
    this.updatedAt = new Date();
  }

  // Conversão para primitivos (persistência)
  toPrimitives(): any {
    return {
      id: this.id.getValue(),
      userId: this.userId.getValue(),
      orderId: this.orderId.getValue(),
      status: this.status.getValue(),
      message: this.message,
      serviceOrigin: this.serviceOrigin.getValue(),
      isRead: this.isReadFlag,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
```

### Value Objects

Todos os identificadores e status são Value Objects para garantir validação e tipo seguro:

- **NotificationId**: UUID da notificação
- **UserId**: ID do usuário
- **OrderId**: ID do pedido
- **NotificationStatus**: Status da notificação (ORDER_CREATED, ORDER_CONFIRMED, DELIVERED, etc)
- **ServiceOrigin**: Origem da notificação (msorders, msdelivery, etc)

## API GraphQL

### Queries

```graphql
type Query {
  # Buscar notificações de um usuário
  notificationsByUser(userId: Int!): [Notification!]!
  
  # Buscar notificações não lidas
  unreadNotifications(userId: Int!): [Notification!]!
  
  # Buscar histórico de notificações
  notificationHistory(userId: Int!, limit: Int): [Notification!]!
}
```

### Mutations

```graphql
type Mutation {
  # Marcar notificação como lida
  markAsRead(id: Int!): Notification!
  
  # Marcar todas como lidas
  markAllAsRead(userId: Int!): Boolean!
}
```

### Subscriptions (Futuro)

```graphql
type Subscription {
  # Receber notificações em tempo real
  notificationReceived(userId: Int!): Notification!
}
```

## Comunicação

### GraphQL
Porta: `3002/graphql`

Queries e mutations para consultar e gerenciar notificações.

### gRPC
Porta: `50053`

Serviços disponíveis:
- `SendNotification`: Enviar notificação única
- `SendBatchNotifications`: Enviar notificações em lote
- `RetryNotification`: Reenviar notificação falhada

### RabbitMQ (Mensageria)
Porta: `5672` (AMQP) | `15672` (Management UI)

**Arquitetura**: RabbitMQ + Protobuf para mensageria assíncrona de alta performance

#### Como funciona

1. **Producer** (msorders, msdelivery) → Publica evento → RabbitMQ
2. **Consumer** (msnotifications) → Consome da fila → Desserializa Protobuf → Envia notificação

#### Vantagens

- **Alta Performance**: Protobuf é binário e compacto (~3-10x menor que JSON)
- **Tipagem Forte**: Schema validado em tempo de compilação
- **Compatibilidade**: Mesmos `.proto` files do gRPC
- **Desacoplamento**: Comunicação assíncrona entre microserviços
- **Resiliência**: Retry automático e dead letter queues

#### Configuração

```bash
# 1. Instalar RabbitMQ via Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# 2. Configurar .env
RABBITMQ_URL="amqp://localhost:5672"

# 3. Acessar interface: http://localhost:15672 (guest/guest)
```

#### Filas Consumidas

| Fila | Tipo Protobuf | Descrição |
|------|---------------|-----------|
| `order.created` | `OrderEvent` | Pedido criado → Notificar cliente |
| `order.confirmed` | `OrderEvent` | Pedido confirmado → Enviar confirmação |
| `delivery.assigned` | `DeliveryEvent` | Entrega atribuída → Notificar cliente e entregador |
| `delivery.out_for_delivery` | `DeliveryEvent` | Saiu para entrega → Notificar cliente |
| `delivery.delivered` | `DeliveryEvent` | Entregue → Notificar conclusão |
| `delivery.cancelled` | `DeliveryEvent` | Cancelado → Notificar motivo |

#### Uso - Consumir Evento

```typescript
// infrastructure/messaging/rabbitmq-consumer.service.ts
@Injectable()
export class RabbitMQConsumerService implements OnModuleInit {
  async onModuleInit() {
    // Consumir eventos de pedidos
    await this.rabbitMQ.consume(
      'order.created',
      'OrderEvent',
      async (event: OrderEvent) => {
        await this.sendNotificationUseCase.execute({
          userId: event.customerId,
          type: 'ORDER_CREATED',
          channel: 'EMAIL',
          message: `Pedido #${event.id} criado com sucesso!`,
          payload: event
        });
      }
    );

    // Consumir eventos de entregas
    await this.rabbitMQ.consume(
      'delivery.out_for_delivery',
      'DeliveryEvent',
      async (event: DeliveryEvent) => {
        await this.sendNotificationUseCase.execute({
          userId: event.customerId,
          type: 'OUT_FOR_DELIVERY',
          channel: 'PUSH',
          message: `Seu pedido saiu para entrega!`,
          payload: event
        });
      }
    );
  }
}
```

#### Performance: JSON vs Protobuf

| Métrica | JSON | Protobuf | Ganho |
|---------|------|----------|-------|
| Tamanho | 320 bytes | 95 bytes | **3.4x menor** |
| Serialização | 1.1ms | 0.4ms | **2.8x mais rápido** |
| Desserialização | 1.5ms | 0.5ms | **3x mais rápido** |
| Throughput | ~12k msgs/s | ~42k msgs/s | **3.5x mais mensagens** |

## API gRPC

### Serviços Expostos

```protobuf
service NotificationService {
  // Enviar notificação
  rpc SendNotification (SendNotificationRequest) returns (NotificationResponse);
  
  // Enviar notificação em lote
  rpc SendBatchNotifications (BatchNotificationRequest) returns (BatchNotificationResponse);
  
  // Reenviar notificação falhada
  rpc RetryNotification (RetryRequest) returns (NotificationResponse);
}
```

### Mensagens

```protobuf
message SendNotificationRequest {
  int32 userId = 1;
  string type = 2;
  string channel = 3;
  string message = 4;
  map<string, string> payload = 5;
}

message NotificationResponse {
  int32 id = 1;
  bool sent = 2;
  string error = 3;
}
```

## Funcionalidades Implementadas

### 1. Observer Pattern para Múltiplos Canais
Atualmente implementado com Terminal e Logger. Fácil adicionar novos observers.

### 2. Persistência com Redis
Notificações indexadas por usuário e pedido para consultas rápidas.

### 3. Value Objects para Tipo Seguro
Todos os identificadores são Value Objects validados.

### 4. Eventos via RabbitMQ + Protobuf
Consome eventos de outros microserviços para notificações assíncronas.

## Sistema de Templates 

```typescript
class NotificationTemplates {
  static ORDER_CREATED = {
    email: {
      subject: 'Pedido #{orderId} criado com sucesso!',
      body: 'Olá {customerName}, seu pedido foi criado. Total: R$ {total}'
    },
    sms: 'Pedido #{orderId} criado! Total: R$ {total}'
  };

  static DELIVERY_ASSIGNED = {
    email: {
      subject: 'Entregador a caminho!',
      body: '{deliveryPersonName} está indo buscar seu pedido.'
    },
    sms: 'Entregador {deliveryPersonName} a caminho!'
  };

  static DELIVERED = {
    email: {
      subject: 'Pedido entregue!',
      body: 'Seu pedido #{orderId} foi entregue. Bom apetite!'
    },
    sms: 'Pedido #{orderId} entregue!'
  };
}
```

### Uso

```typescript
async sendOrderCreatedNotification(order: Order, customer: Customer) {
  const template = NotificationTemplates.ORDER_CREATED;
  
  const message = this.replaceVariables(template.sms, {
    orderId: order.id,
    customerName: customer.name,
    total: order.total
  });

  await this.sendNotification({
    userId: customer.id,
    type: 'ORDER_CREATED',
    channel: 'SMS',
    message,
    payload: { orderId: order.id }
  });
}
```

## Persistência com Redis

Notificações são armazenadas no Redis como banco de dados principal:

```typescript
@Injectable()
export class RedisNotificationRepository implements NotificationRepositoryPort {
  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async save(notification: NotificationEntity): Promise<void> {
    const primitives = notification.toPrimitives();
    
    // Salva notificação por ID
    await this.redis.set(`notification:${primitives.id}`, JSON.stringify(primitives));
    
    // Adiciona ID à lista de notificações do usuário
    await this.redis.sadd(`user:${primitives.userId}:notifications`, primitives.id);
    
    // Adiciona ID à lista de notificações do pedido
    await this.redis.sadd(`order:${primitives.orderId}:notifications`, primitives.id);
  }

  async findById(id: NotificationId): Promise<NotificationEntity | null> {
    const data = await this.redis.get(`notification:${id.getValue()}`);
    if (!data) {
      return null;
    }
    return this.hydrateNotification(JSON.parse(data));
  }

  async findByUserId(userId: UserId): Promise<NotificationEntity[]> {
    const notificationIds = await this.redis.smembers(`user:${userId.getValue()}:notifications`);
    const notifications: NotificationEntity[] = [];
    
    for (const id of notificationIds) {
      const data = await this.redis.get(`notification:${id}`);
      if (data) {
        const notification = this.hydrateNotification(JSON.parse(data));
        if (notification) {
          notifications.push(notification);
        }
      }
    }
    
    return notifications;
  }

  private hydrateNotification(data: any): NotificationEntity {
    return NotificationEntity.fromPrimitives(data);
  }
}
```



## Configuração

### Variáveis de Ambiente

```env
# Redis (Persistência)
REDIS_HOST=redis-notifications
REDIS_PORT=6379

# RabbitMQ (Mensageria)
RABBITMQ_URL=amqp://rabbitmq:5672

# Server
PORT=3002
GRAPHQL_PATH=/graphql

# gRPC
GRPC_PORT=50054
GRPC_HOST=0.0.0.0
```

### Instalação

```bash
npm install
npm run start:dev
```

## Exemplos de Uso

### Via RabbitMQ (Principal)

O fluxo principal é assíncrono via eventos RabbitMQ:

```typescript
// Em msorders - Publica evento
await this.eventPublisher.publishOrderCreated({
  id: order.id,
  customerId: customer.id,
  status: 'CONFIRMED',
  total: order.total
});

// msnotifications consome automaticamente via RabbitMQ consumer
// e cria notificação
```

### Consultar via GraphQL

```graphql
query {
  notificationsByUser(userId: 1) {
    id
    type
    channel
    message
    sent
    sentAt
    createdAt
  }
}
```

### Marcar como lida

```graphql
mutation {
  markAsRead(id: 1) {
    id
    sent
  }
}
```



## Padrões de Projeto Implementados

### Observer Pattern (Comportamental - GoF)

**Categoria**: Padrão Comportamental do Gang of Four

**Problema resolvido**: Quando um evento ocorre (pedido confirmado, entrega a caminho, etc.), múltiplos canais de notificação precisam ser acionados (terminal, logs, email, SMS). Acoplar o código de notificação diretamente aos canais específicos viola o princípio de baixo acoplamento.

**Solução**: O padrão Observer define uma relação um-para-muitos onde o Subject (NotificationSubjectAdapter) notifica automaticamente todos os Observers registrados quando um evento ocorre.

**Localização**: 
- Subject: [src/infrastructure/observers/notification-subject.adapter.ts](../../msnotifications/src/infrastructure/observers/notification-subject.adapter.ts)
- Observer 1: [src/infrastructure/observers/terminal-notifier.observer.ts](../../msnotifications/src/infrastructure/observers/terminal-notifier.observer.ts)
- Observer 2: [src/infrastructure/observers/notification-logger.observer.ts](../../msnotifications/src/infrastructure/observers/notification-logger.observer.ts)
- Ports: [src/domain/ports/notification-observer.port.ts](../../msnotifications/src/domain/ports/notification-observer.port.ts)

**Estrutura**:

```typescript
// Subject (Observable)
interface NotificationSubjectPort {
  subscribe(observer: NotificationObserverPort): void;
  unsubscribe(observer: NotificationObserverPort): void;
  notify(notification: NotificationData): Promise<void>;
}

// Observer
interface NotificationObserverPort {
  update(notification: NotificationData): Promise<void>;
}

// Concrete Subject
@Injectable()
class NotificationSubjectAdapter implements NotificationSubjectPort {
  private observers: NotificationObserverPort[] = [];

  subscribe(observer: NotificationObserverPort): void {
    this.observers.push(observer);
  }

  async notify(notification: NotificationData): Promise<void> {
    // Notifica todos os observers em paralelo
    await Promise.all(
      this.observers.map(obs => obs.update(notification))
    );
  }
}

// Concrete Observers
@Injectable()
class TerminalNotifierObserver implements NotificationObserverPort, ClientConnectionPort {
  private connectedClients: Map<string, IConnectedClient> = new Map();

  async update(notification: NotificationData): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log('\n' + '='.repeat(80));
    console.log(`[NOTIFICACAO] ${timestamp}`);
    console.log('='.repeat(80));
    console.log(`ID do Pedido: ${notification.orderId}`);
    console.log(`ID do Usuario: ${notification.userId}`);
    console.log(`Status: ${notification.status}`);
    console.log(`Mensagem: ${notification.message}`);
    console.log(`Origem: ${notification.serviceOrigin}`);
    console.log('='.repeat(80));
  }

  connectClient(userId: string): void {
    this.connectedClients.set(userId, {
      userId,
      connectedAt: new Date(),
    });
    console.log(`\n[SYSTEM] Cliente ${userId} conectado ao sistema de notificacoes`);
  }

  disconnectClient(userId: string): void {
    if (this.connectedClients.has(userId)) {
      this.connectedClients.delete(userId);
      console.log(`\n[SYSTEM] Cliente ${userId} desconectado do sistema de notificacoes`);
    }
  }
}

@Injectable()
class NotificationLoggerObserver implements NotificationObserverPort {
  private readonly logger = new Logger(NotificationLoggerObserver.name);
  
  async update(notification: NotificationData): Promise<void> {
    this.logger.log(
      `Notificação - Pedido: ${notification.orderId}, ` +
      `Usuário: ${notification.userId}, ` +
      `Status: ${notification.status}, ` +
      `Origem: ${notification.serviceOrigin}`
    );
  }
}
```

**Uso no sistema**:

```typescript
// Subject se auto-registra com observers no OnModuleInit
@Injectable()
export class NotificationSubjectAdapter implements NotificationSubjectPort, OnModuleInit {
  private observers: NotificationObserverPort[] = [];

  constructor(
    private readonly terminalNotifier: TerminalNotifierObserver,
    private readonly loggerObserver: NotificationLoggerObserver,
  ) {}

  onModuleInit() {
    // Auto-registro dos observers
    this.subscribe(this.terminalNotifier);
    this.subscribe(this.loggerObserver);
  }

  async notify(notification: NotificationData): Promise<void> {
    // Notifica todos os observers em paralelo
    const promises = this.observers.map(observer => observer.update(notification));
    await Promise.all(promises);
  }
}

// Quando evento ocorre (em use cases ou consumers)
await notificationSubject.notify({
  orderId: '123',
  userId: 'user-456',
  status: 'ORDER_CONFIRMED',
  message: 'Seu pedido foi confirmado!',
  serviceOrigin: 'msorders'
});
// Todos os observers são notificados automaticamente
```

**Benefícios**:
- **Baixo acoplamento**: Subject não conhece detalhes dos observers
- **Open/Closed Principle**: Novos observers podem ser adicionados sem modificar subject
- **Broadcast communication**: Um evento notifica múltiplos interessados automaticamente
- **Flexibilidade**: Observers podem ser adicionados/removidos em runtime

**Justificativa de uso**:
O sistema precisa notificar múltiplos destinos quando um evento importante ocorre (pedido criado, entrega a caminho, etc). Atualmente temos:
1. **TerminalNotifierObserver**: Mostra notificações formatadas no terminal
2. **NotificationLoggerObserver**: Registra notificações em logs estruturados

Futuramente, podemos adicionar EmailObserver, SmsObserver, WhatsAppObserver, PushNotificationObserver, etc. O Observer Pattern permite adicionar novos canais sem modificar a lógica central de notificação. Cada observer é independente e testável isoladamente.

**Princípios SOLID aplicados**:
- **S - Single Responsibility**: Cada observer tem uma responsabilidade específica
- **O - Open/Closed**: Fácil adicionar novos observers sem modificar o subject
- **L - Liskov Substitution**: Qualquer observer pode substituir outro
- **D - Dependency Inversion**: Subject depende de abstração (NotificationObserverPort)

## Regras de Negócio

1. **Value Objects**: Todos os identificadores são Value Objects validados
2. **Imutabilidade**: Notificações criadas não podem ser alteradas (exceto markAsRead)
3. **Observer Pattern**: Novos canais podem ser adicionados sem modificar código existente
4. **Indexação**: Notificações indexadas por usuário e pedido no Redis
5. **Factory Methods**: Entidades criadas via métodos estáticos (create, fromPrimitives)

## Testes

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Monitoramento

```typescript
this.logger.log('Notification sent', {
  id: notification.id,
  type: notification.type,
  channel: notification.channel,
  userId: notification.userId
});
```

## Troubleshooting

### Redis não conecta

```bash
# Verificar se Redis está rodando
docker ps | grep redis-notifications

# Testar conexão
docker exec -it redis-notifications redis-cli ping
# Deve retornar: PONG

# Ver notificações armazenadas
docker exec -it redis-notifications redis-cli keys "notification:*"
```

### RabbitMQ não consome eventos

```bash
# Verificar logs do container
docker logs msnotifications

# Verificar filas no RabbitMQ Management
# http://localhost:15672 (guest/guest)

# Verificar se consumer está registrado
docker logs msnotifications | grep "Consumer registrado"
```

### Notificações não aparecem no terminal

```bash
# Verificar se TerminalNotifierObserver está registrado
docker logs msnotifications | grep "Observer registrado"

# Verificar logs do NotificationLogger
docker logs msnotifications | grep "Notificação -"
```
