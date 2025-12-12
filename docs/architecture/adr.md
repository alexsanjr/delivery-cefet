# Decisões Arquiteturais

Aqui estão documentadas as principais decisões técnicas que tomamos durante o desenvolvimento do projeto. 

## 1. Arquitetura de Microserviços (Obrigatório)

O projeto foi especificado para ser desenvolvido em microserviços. Dividimos o sistema em 6 serviços independentes:
- mscustomers (clientes)
- msorders (pedidos)
- msdelivery (entregas)
- msnotifications (notificações)
- msrouting (roteamento)
- mstracking (rastreamento)

**Por que faz sentido para este projeto:**
- Cada domínio (clientes, pedidos, entregas) tem suas próprias regras de negócio
- Serviços críticos como tracking podem escalar independentemente se necessário
- Falhas ficam isoladas (se notificações caírem, o resto continua funcionando)
- Facilita organizar o trabalho da equipe em paralelo

---

## 2. TypeScript (Obrigatório)

TypeScript foi definido como a linguagem do projeto.

**Por que faz sentido para este projeto:**
- Tipagem estática ajuda muito a evitar bugs durante o desenvolvimento
- Autocomplete da IDE funciona perfeitamente
- Facilita refatoração do código com segurança
- Integração perfeita com NestJS

---

## 3. GraphQL (Obrigatório)

GraphQL foi definido como a API para clientes externos (web/mobile).

**Por que faz sentido para este projeto:**
- Cliente pode pedir só os dados que precisa (evita over-fetching)
- Schema auto-documentado facilita o desenvolvimento
- Apollo Playground ajuda muito nos testes
- Uma única query pode buscar dados de vários serviços

---

## 4. gRPC (Obrigatório)

gRPC foi definido para comunicação entre os microserviços.

**Por que faz sentido para este projeto:**
- Muito mais rápido que REST (usa Protocol Buffers binário)
- Tipagem forte através dos arquivos .proto
- Gera código automaticamente para os clientes
- Ideal para comunicação servidor-servidor

---

## 5. API Gateway (Obrigatório)

API Gateway foi definido como ponto de entrada único. Escolhemos Kong Gateway.

**Por que faz sentido para este projeto:**
- Centraliza autenticação JWT em um lugar só
- Rate limiting protege os serviços
- CORS configurado uma única vez
- Cliente só precisa conhecer um endpoint

**Desafio:** Adiciona latência extra, mas os benefícios compensam.

---

## 6. Prisma como ORM

Precisávamos de alguma forma de acessar o banco PostgreSQL. Pesquisamos algumas opções e decidimos usar Prisma na maioria dos serviços.

**Por que Prisma:**
- Os tipos do TypeScript funcionam perfeitamente
- As migrações são automáticas e funcionam bem
- O Prisma Studio ajuda muito a visualizar os dados
- A integração com NestJS é muito boa
- O schema é bem mais legível que decorators

**Outras opções:**
- TypeORM: mais antigo e popular, mas os tipos dão muito problema
- Sequelize: API muito verbosa e tipos ruins em TypeScript

**Onde usamos:**
- mscustomers (Prisma)
- msorders (Prisma)
- msdelivery (Prisma)
- mstracking (Prisma)
- msnotifications (TypeORM - decisão anterior, mantivemos)
- msrouting (só Redis, sem banco SQL)

---

## 7. Um Banco para Cada Serviço

Essa foi uma decisão importante: ao invés de ter um banco compartilhado, cada microserviço tem seu próprio banco PostgreSQL.

**Por que fizemos assim:**
- Cada serviço é realmente independente
- Se um banco cair, não derruba todo o sistema
- Podemos escalar os bancos separadamente
- Seguindo os princípios de microserviços que estudamos

---


## 8. Redis para Cache

Percebemos que algumas operações eram muito pesadas:
- Calcular rotas chamando API externa toda hora
- Buscar notificações repetidamente

A solução foi usar Redis como cache. É super rápido porque guarda tudo em memória.

**Como usamos:**
- **msrouting**: Salva rotas calculadas por 1 hora (pra não chamar a API de mapas o tempo todo)
- **msnotifications**: Guarda notificações recentes por 7 dias

**Benefícios:**
- Sistema ficou bem mais rápido
- Economiza chamadas a APIs externas
- Cache compartilhado se subir várias instâncias

---

## 9. NestJS como Framework

Precisávamos escolher um framework Node.js. Poderíamos usar Express puro, mas queríamos algo mais estruturado.

**Por que NestJS:**
- Tem estrutura de módulos que organiza bem o código
- Dependency Injection facilita muito os testes
- Suporte excelente para GraphQL e gRPC (que já íamos usar)
- Documentação muito boa
- É inspirado no Angular, então quem conhece já entende a estrutura

---


---

## 10. Domain-Driven Design (DDD) e Arquitetura Hexagonal

**Contexto do problema:**

No início do projeto, os microserviços tinham uma arquitetura mais simples, com camadas tradicionais (controller, service, repository). À medida que a complexidade da lógica de negócio cresceu, identificamos alguns problemas:
- Lógica de negócio misturada com código de infraestrutura
- Dificuldade para testar regras de domínio isoladamente
- Acoplamento forte com frameworks e tecnologias
- Falta de expressividade nas regras de negócio

**Por que DDD e Arquitetura Hexagonal:**

Refatoramos os microserviços principais para seguir DDD e Arquitetura Hexagonal.

**Estrutura implementada:**

```
src/
├── domain/                    # Núcleo - Lógica de negócio pura
│   ├── entities/             # Entidades de domínio
│   ├── value-objects/        # Objetos de valor imutáveis
│   ├── aggregates/           # Agregados (Order, Rota)
│   ├── repositories/         # Interfaces (ports)
│   └── services/             # Serviços de domínio
├── application/              # Casos de uso
│   ├── use-cases/           # Lógica de aplicação
│   ├── dtos/                # Transferência de dados
│   └── mappers/             # Conversão entre camadas
├── infrastructure/           # Adapters (implementações)
│   ├── persistence/         # Repositórios Prisma
│   ├── adapters/            # gRPC, REST clients
│   └── mappers/             # Prisma ↔ Domain
└── presentation/             # Interface externa
    ├── graphql/             # Resolvers GraphQL
    └── grpc/                # Controllers gRPC
```

**Conceitos DDD implementados:**

1. **Entities**: Objetos com identidade (Cliente, Pedido, Entregador)
2. **Value Objects**: Objetos imutáveis (Email, CPF, Coordenada, Distancia)
3. **Aggregates**: Clusters de entidades (Order com OrderItems)
4. **Domain Events**: OrderCreated, DeliveryAssigned
5. **Use Cases**: CreateOrder, AssignDelivery, CalculateRoute
6. **Repositories (Interfaces)**: Contratos no domínio, implementação na infraestrutura

**Benefícios:**
- **Testabilidade**: Domínio testável sem banco de dados ou frameworks
- **Independência**: Lógica de negócio não depende de Prisma, gRPC, NestJS
- **Expressividade**: Use Cases deixam claro o que o sistema faz
- **Manutenibilidade**: Mudanças de tecnologia não afetam o núcleo
- **Validações**: Value Objects garantem dados sempre válidos

**Exemplo de Value Object:**

```typescript
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!email.includes('@')) {
      throw new Error('Email inválido');
    }
    return new Email(email);
  }

  getValue(): string {
    return this.value;
  }
}
// Email sempre válido - impossível criar Email inválido
```

**Exemplo de Use Case:**

```typescript
@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(CUSTOMER_VALIDATOR)
    private readonly customerValidator: ICustomerValidator,
  ) {}

  async execute(input: CreateOrderInput): Promise<OrderDto> {
    // Valida cliente
    await this.customerValidator.validate(input.customerId);
    
    // Cria aggregate
    const order = Order.create(input);
    
    // Persiste
    await this.orderRepository.save(order);
    
    // Retorna DTO
    return OrderMapper.toDto(order);
  }
}
```

**Trade-offs:**
- Mais arquivos e camadas de abstração
- Curva de aprendizado para equipe
- Overhead inicial de desenvolvimento
- **Mas**: Compensado pela qualidade e manutenibilidade a longo prazo

---

## 11. Coreografia de Microsserviços com RabbitMQ

**Contexto do problema:**

Com múltiplos microserviços interdependentes, surge a necessidade de comunicação assíncrona confiável. Quando um pedido é criado no msorders, vários serviços precisam reagir:
- msdelivery precisa criar uma entrega
- msnotifications precisa notificar o cliente
- mstracking precisa iniciar o rastreamento

Utilizar comunicação síncrona (gRPC direto) cria acoplamento forte e pontos únicos de falha.

**Vantagens do modelo de Coreografia:**
- **Desacoplamento**: Serviços não precisam conhecer uns aos outros
- **Autonomia**: Cada serviço decide como reagir aos eventos
- **Resiliência**: Se um serviço cai, as mensagens ficam na fila
- **Escalabilidade**: Múltiplas instâncias podem consumir da mesma fila
- **Auditoria**: Todas as mensagens ficam registradas

**Arquitetura implementada:**

```
[msorders]
    |
    | Publica: OrderCreatedEvent
    v
[RabbitMQ Exchange: events]
    |
    +----> [Queue: orders.created] ----> [msdelivery] (cria entrega)
    |
    +----> [Queue: orders.created] ----> [msnotifications] (notifica cliente)
    |
    +----> [Queue: orders.created] ----> [mstracking] (inicia rastreamento)
```

**Exemplo de implementação**

```typescript
// msorders - Publicando evento
export class OrderCreatedEvent {
  constructor(
    public readonly orderId: number,
    public readonly customerId: number,
    public readonly total: number,
    public readonly items: OrderItem[],
  ) {}
}

@Injectable()
export class OrderEventsPublisher {
  constructor(
    @Inject('RABBITMQ_CLIENT')
    private readonly rabbitClient: ClientProxy,
  ) {}

  async publishOrderCreated(order: Order): Promise<void> {
    const event = new OrderCreatedEvent(
      order.id,
      order.customerId,
      order.total,
      order.items,
    );

    await this.rabbitClient.emit('order.created', event).toPromise();
  }
}

// msdelivery - Consumindo evento
@Controller()
export class OrderEventsConsumer {
  constructor(private readonly createDeliveryUseCase: CreateDeliveryUseCase) {}

  @EventPattern('order.created')
  async handleOrderCreated(data: OrderCreatedEvent): Promise<void> {
    console.log(`Recebido evento: order.created para pedido ${data.orderId}`);

    // Criar entrega automaticamente
    await this.createDeliveryUseCase.execute({
      orderId: data.orderId,
      customerId: data.customerId,
    });
  }
}
```

**Protobuf para serialização:**

Usamos Protocol Buffers (Protobuf) para serializar as mensagens, garantindo:
- **Eficiência**: Mensagens menores que JSON
- **Tipagem**: Schema bem definido
- **Versionamento**: Compatibilidade retroativa
- **Performance**: Serialização/deserialização rápida

```protobuf
// events.proto
syntax = "proto3";

package events;

message OrderCreatedEvent {
  int32 order_id = 1;
  int32 customer_id = 2;
  double total = 3;
  repeated OrderItem items = 4;
}

message OrderItem {
  int32 product_id = 1;
  string name = 2;
  int32 quantity = 3;
  double price = 4;
}
```

**Configuração do RabbitMQ:**

```typescript
// app.module.ts
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_CLIENT',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'events_queue',
          queueOptions: {
            durable: true, // Mensagens persistem se RabbitMQ reiniciar
          },
          // Protobuf
          serializer: new ProtobufSerializer('events.proto'),
          deserializer: new ProtobufDeserializer('events.proto'),
        },
      },
    ]),
  ],
})
export class AppModule {}
```

**Padrão de eventos implementados:**

| Evento | Publisher | Consumers |
|--------|-----------|----------|
| `order.created` | msorders | msdelivery, msnotifications, mstracking |
| `order.status.changed` | msorders | msnotifications, mstracking |
| `delivery.assigned` | msdelivery | msnotifications, mstracking |
| `delivery.picked_up` | msdelivery | msnotifications, mstracking |
| `delivery.delivered` | msdelivery | msorders, msnotifications |
| `customer.created` | mscustomers | msnotifications |

**Garantias de entrega:**

1. **Durabilidade**: Filas e mensagens marcadas como `durable: true`
2. **Acknowledgment**: Consumidor confirma processamento com `ack()`
3. **Dead Letter Queue**: Mensagens com erro vão para DLQ para análise
4. **Retry**: Tentativas automáticas em caso de falha temporária

**Monitoramento:**

- RabbitMQ Management UI (porta 15672)
- Métricas: taxa de publicação, consumo, filas com backlog
- Alertas: filas crescendo indefinidamente, consumidores inativos


## 12. Testes de Performance e Escalabilidade

**Contexto do problema:**

Para validar que o sistema é realmente escalável e pode suportar carga de produção, precisamos:
- Medir throughput (requisições/segundo)
- Identificar gargalos de performance
- Validar comportamento sob alta carga
- Verificar se escala horizontalmente
- Testar resiliência sob stress

**Por que Apache JMeter:**

Escolhemos **Apache JMeter** como ferramenta de teste de carga e performance.

**Vantagens do JMeter:**
- Open source e maduro
- Suporta múltiplos protocolos (HTTP, WebSocket, gRPC via plugins)
- Interface gráfica para criar testes
- Relatórios detalhados com gráficos
- Pode simular milhares de usuários concorrentes
- Integração com CI/CD

**Resultados dos testes:**

Os testes de performance e escalabilidade estão documentados em:

**[docs/Performace/](../Performace/)**




