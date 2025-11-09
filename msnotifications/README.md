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
- **Redis**: Cache e fila de mensagens
- **TypeORM**: ORM para PostgreSQL
- **IORedis**: Cliente Redis para NestJS

## Estrutura do Projeto

```
msnotifications/
├── src/
│   ├── notifications/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── notifications.service.ts
│   │   ├── notifications.resolver.ts
│   │   └── notifications.module.ts
│   ├── graphql/
│   │   └── graphql.module.ts
│   ├── grpc/
│   │   ├── grpc.service.ts
│   │   └── grpc.module.ts
│   ├── database/
│   │   └── database.module.ts
│   └── main.ts
└── package.json
```

## Modelo de Dados

### Notification

```typescript
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  type: NotificationType; // ORDER_CREATED, DELIVERY_ASSIGNED, etc

  @Column()
  channel: NotificationChannel; // EMAIL, SMS, PUSH

  @Column({ type: 'json' })
  payload: any;

  @Column()
  message: string;

  @Column({ default: false })
  sent: boolean;

  @Column({ nullable: true })
  sentAt: Date;

  @Column({ default: 0 })
  retries: number;

  @Column({ nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;
}

enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  DELIVERY_ASSIGNED = 'DELIVERY_ASSIGNED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH'
}
```

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

## Sistema de Templates

O serviço usa templates para gerar mensagens personalizadas:

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

## Cache com Redis

Notificações recentes são armazenadas em cache:

```typescript
@Injectable()
class NotificationsService {
  constructor(
    @InjectRedis() private readonly redis: Redis
  ) {}

  async cacheNotification(notification: Notification) {
    const key = `notifications:user:${notification.userId}`;
    
    // Adiciona à lista de notificações do usuário
    await this.redis.lpush(key, JSON.stringify(notification));
    
    // Mantém apenas as 100 mais recentes
    await this.redis.ltrim(key, 0, 99);
    
    // Define expiração de 7 dias
    await this.redis.expire(key, 7 * 24 * 60 * 60);
  }

  async getCachedNotifications(userId: number): Promise<Notification[]> {
    const key = `notifications:user:${userId}`;
    const cached = await this.redis.lrange(key, 0, -1);
    
    return cached.map(item => JSON.parse(item));
  }
}
```

## Sistema de Retry

Notificações falhadas são reenviadas automaticamente:

```typescript
async sendWithRetry(notification: Notification) {
  const MAX_RETRIES = 3;
  
  try {
    await this.sendToChannel(notification);
    
    notification.sent = true;
    notification.sentAt = new Date();
    await this.save(notification);
    
  } catch (error) {
    notification.retries++;
    notification.error = error.message;
    
    if (notification.retries < MAX_RETRIES) {
      // Retry exponencial: 1min, 5min, 15min
      const delay = Math.pow(5, notification.retries) * 60 * 1000;
      
      await this.scheduleRetry(notification, delay);
    }
    
    await this.save(notification);
  }
}

async scheduleRetry(notification: Notification, delay: number) {
  // Adiciona à fila do Redis com delay
  await this.redis.zadd(
    'notifications:retry',
    Date.now() + delay,
    notification.id
  );
}
```

## Configuração

### Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db_notifications"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
PORT=3002
GRAPHQL_PATH=/graphql

# gRPC
GRPC_PORT=50052

# External Services
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

SMS_API_KEY=your-sms-api-key
SMS_API_URL=https://api.sms-provider.com
```

### Instalação

```bash
npm install
npm run start:dev
```

## Exemplos de Uso

### Enviar via gRPC (de outro serviço)

```typescript
// No msorders após criar pedido
await this.notificationsClient.sendNotification({
  userId: customer.id,
  type: 'ORDER_CREATED',
  channel: 'EMAIL',
  message: `Pedido #${order.id} criado!`,
  payload: {
    orderId: order.id,
    total: order.total
  }
});
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

## Canais Implementados

### Email

```typescript
async sendEmail(notification: Notification) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: 'noreply@delivery.com',
    to: notification.payload.email,
    subject: notification.payload.subject,
    text: notification.message
  });
}
```

### SMS

```typescript
async sendSMS(notification: Notification) {
  const response = await axios.post(process.env.SMS_API_URL, {
    apiKey: process.env.SMS_API_KEY,
    to: notification.payload.phone,
    message: notification.message
  });

  if (!response.data.success) {
    throw new Error('Failed to send SMS');
  }
}
```

## Fluxo de Notificação

```
1. Serviço externo chama gRPC sendNotification
2. NotificationService valida dados
3. Cria registro no banco (sent: false)
4. Adiciona ao cache Redis
5. Tenta enviar pelo canal especificado
6. Se sucesso:
   - Atualiza registro (sent: true, sentAt: now)
   - Retorna sucesso
7. Se falha:
   - Incrementa retries
   - Agenda retry
   - Retorna erro
```

## Regras de Negócio

1. **Retry automático**: Até 3 tentativas com delay exponencial
2. **Cache**: Últimas 100 notificações por usuário
3. **Expiração**: Notificações em cache expiram em 7 dias
4. **Validação**: Email e telefone devem ser válidos
5. **Rate limiting**: Máximo 10 notificações por minuto por usuário
6. **Prioridade**: Notificações críticas são enviadas primeiro

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

### Email não enviado

```bash
# Verificar configurações SMTP
echo $SMTP_HOST
echo $SMTP_USER

# Testar conexão
telnet smtp.gmail.com 587
```

### Redis não conecta

```bash
# Verificar se Redis está rodando
docker ps | grep redis

# Testar conexão
redis-cli ping
```

### Notificações ficam pendentes

```bash
# Verificar worker de retry
npm run start:worker

# Limpar fila
redis-cli del notifications:retry
```
