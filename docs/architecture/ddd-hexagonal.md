# Domain-Driven Design e Arquitetura Hexagonal

Este documento descreve como **Domain-Driven Design (DDD)** e **Arquitetura Hexagonal (Ports & Adapters)** foram implementados no sistema de delivery.

## Visão Geral

Os microserviços foram refatorados para seguir DDD com Arquitetura Hexagonal, garantindo:

- **Separação clara de responsabilidades** entre camadas
- **Lógica de negócio independente** de frameworks e tecnologias
- **Testabilidade** do domínio sem dependências externas
- **Manutenibilidade** facilitada por estrutura bem definida
- **Expressividade** através de Use Cases e Entities

## Arquitetura em Camadas

### Estrutura Padrão (Microserviços DDD)

```
src/
├── domain/                    # NÚCLEO - Lógica de negócio pura
│   ├── entities/             # Objetos com identidade
│   ├── value-objects/        # Objetos imutáveis com validação
│   ├── aggregates/           # Clusters de entidades 
│   ├── repositories/         # Interfaces (Ports)
│   ├── services/             # Serviços de domínio 
│   └── events/               # Domain Events 
│
├── application/              # CASOS DE USO
│   ├── use-cases/           # Orquestração da lógica
│   ├── dtos/                # Data Transfer Objects
│   └── mappers/             # Conversão entre camadas
│
├── infrastructure/           # IMPLEMENTAÇÕES (Adapters)
│   ├── persistence/         # Repositórios (Prisma, TypeORM)
│   ├── adapters/            # Clientes externos (gRPC, REST)
│   ├── messaging/           # RabbitMQ 
│   └── mappers/             # Prisma ↔ Domain
│
├── presentation/             # INTERFACE EXTERNA
│   ├── graphql/             # Resolvers GraphQL (mscustomers)
│   └── grpc/                # Controllers gRPC (todos)
│
└── grpc/                     # Protobuf definitions (alguns serviços)
```

### Fluxo de Dados

```
GraphQL/gRPC Request
       ↓
[Presentation Layer]
       ↓
  Use Case (Application)
       ↓
  Domain Entity/Aggregate
       ↓
  Repository Interface (Port)
       ↓
  Repository Implementation (Adapter)
       ↓
    Prisma/Database
```

## Conceitos DDD Implementados

### 1. Entities (Entidades)

Objetos com identidade única que mantêm estado e comportamento.

**Exemplo: DeliveryEntity (msdelivery)**

```typescript
export class DeliveryEntity {
  constructor(
    public readonly id: number,
    public readonly orderId: number,
    public readonly customerLocation: Location,
    private status: DeliveryStatus,
    private deliveryPersonId?: number,
  ) {}

  // Regra de negócio encapsulada
  assign(deliveryPersonId: number): void {
    if (this.status !== DeliveryStatus.PENDING) {
      throw new Error('Entrega só pode ser atribuída se estiver PENDING');
    }
    this.deliveryPersonId = deliveryPersonId;
    this.status = DeliveryStatus.ASSIGNED;
  }

  updateStatus(newStatus: DeliveryStatus): void {
    // Validação de transição de status
    // ...
  }
}
```

**Características:**
- Tem identidade (id)
- Encapsula regras de negócio
- Valida mudanças de estado
- Não depende de frameworks

### 2. Value Objects (Objetos de Valor)

Objetos imutáveis que representam conceitos do domínio com validação integrada.

**Exemplo: Email (mscustomers, msdelivery)**

```typescript
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('Email inválido');
    }
    return new Email(email.toLowerCase());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

**Exemplo: Coordenada (msrouting)**

```typescript
export class Coordenada {
  private constructor(
    private readonly latitude: number,
    private readonly longitude: number,
  ) {}

  static criar(latitude: number, longitude: number): Coordenada {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude deve estar entre -90 e 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude deve estar entre -180 e 180');
    }
    return new Coordenada(latitude, longitude);
  }

  obterLatitude(): number {
    return this.latitude;
  }

  obterLongitude(): number {
    return this.longitude;
  }

  distanciaAte(outra: Coordenada): number {
    // Cálculo de distância Haversine
    // ...
  }
}
```

**Outros Value Objects Implementados:**

**msdelivery:**
- `Email`: Validação de email
- `Phone`: Validação de telefone brasileiro
- `Cpf`: Validação de CPF com dígitos verificadores
- `Location`: Coordenadas geográficas (latitude/longitude)

**mscustomers:**
- `Email`: Validação de email
- `Telefone`: Validação de telefone
- `Cep`: Validação de CEP brasileiro

**msrouting:**
- `Coordenada`: Coordenadas geográficas com validação de limites
- `Distancia`: Distância em metros com validação
- `Duracao`: Duração em segundos

**msorders:**
- Value Objects para cálculos de preço e validações

**Benefícios:**
- **Imutabilidade**: Não pode ser alterado após criação
- **Validação**: Impossível criar objeto inválido
- **Encapsulamento**: Lógica de validação centralizada
- **Reusabilidade**: Pode ser usado em diferentes contextos
- **Segurança de tipos**: TypeScript garante tipo correto

### 3. Aggregates (Agregados)

Cluster de entidades tratadas como uma unidade, com um Aggregate Root que gerencia o ciclo de vida.

**Exemplo: Order Aggregate (msorders)**

```typescript
export class Order extends AggregateRoot {
  private constructor(
    public readonly id: number,
    private customerId: number,
    private items: OrderItem[],
    private status: OrderStatus,
    private subtotal: number,
    private deliveryFee: number,
  ) {
    super(); // Para Domain Events
  }

  // Factory Method
  static create(customerId: number, items: OrderItem[]): Order {
    if (!items || items.length === 0) {
      throw new Error('Pedido deve ter pelo menos 1 item');
    }

    const order = new Order(0, customerId, items, OrderStatus.PENDING, 0, 0);
    order.calculateTotals();
    
    // Domain Event
    order.addDomainEvent(new OrderCreatedEvent(order));
    
    return order;
  }

  // Regra: só adiciona item se PENDING
  addItem(item: OrderItem): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new Error('Só pode adicionar itens em pedidos PENDING');
    }
    this.items.push(item);
    this.calculateTotals();
  }

  // Regra: validação de transição de status
  updateStatus(newStatus: OrderStatus): void {
    const validTransitions = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      // ...
    };

    if (!validTransitions[this.status].includes(newStatus)) {
      throw new Error(`Transição inválida: ${this.status} -> ${newStatus}`);
    }

    this.status = newStatus;
    this.addDomainEvent(new OrderStatusChangedEvent(this.id, newStatus));
  }

  private calculateTotals(): void {
    this.subtotal = this.items.reduce((sum, item) => sum + item.getTotalPrice(), 0);
  }
}
```

**Exemplo: Rota Aggregate (msrouting)**

```typescript
export class Rota {
  private constructor(
    public readonly id: string,
    public readonly origem: Coordenada,
    public readonly destino: Coordenada,
    private distancia: Distancia,
    private duracao: Duracao,
    private passos: PassoRota[],
  ) {}

  static criar(
    origem: Coordenada,
    destino: Coordenada,
    distancia: Distancia,
    duracao: Duracao,
    passos: PassoRota[],
  ): Rota {
    // Validações
    if (passos.length === 0) {
      throw new Error('Rota deve ter pelo menos 1 passo');
    }

    return new Rota(
      uuidv4(),
      origem,
      destino,
      distancia,
      duracao,
      passos,
    );
  }

  // Regra de negócio: calcular custo baseado em veículo
  calcularCusto(tipoVeiculo: TipoVeiculo): number {
    const custoBase = this.distancia.obterMetros() / 1000; // por km
    const multiplicador = this.obterMultiplicadorVeiculo(tipoVeiculo);
    return custoBase * multiplicador;
  }
}
```

**Características:**
- Aggregate Root controla acesso às entidades internas
- Garante consistência do cluster
- Emite Domain Events para mudanças importantes
- Encapsula regras de negócio complexas

### 4. Domain Events (Eventos de Domínio)

Representam algo importante que aconteceu no domínio.

**Exemplo: OrderCreatedEvent (msorders)**

```typescript
export class OrderCreatedEvent {
  constructor(
    public readonly orderId: number,
    public readonly customerId: number,
    public readonly total: number,
  ) {}
}

// Handler
@Injectable()
export class OrderCreatedEventHandler {
  constructor(
    private readonly notificationService: INotificationService,
    private readonly deliveryService: IDeliveryService,
  ) {}

  async handle(event: OrderCreatedEvent): Promise<void> {
    // Notificar cliente
    await this.notificationService.sendOrderConfirmation(event.customerId);
    
    // Criar entrega no msdelivery
    await this.deliveryService.createDelivery(event.orderId);
  }
}
```

**Benefícios:**
- Desacoplamento entre agregados
- Comunicação assíncrona
- Auditoria e rastreamento
- Facilita implementação de Saga Pattern

### 5. Use Cases (Casos de Uso)

Representam as intenções de negócio da aplicação. Orquestram entidades e serviços de domínio.

**Exemplo: CreateOrderUseCase (msorders)**

```typescript
@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: IOrderRepository,
    @Inject(CUSTOMER_VALIDATOR)
    private readonly customerValidator: ICustomerValidator,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateOrderInput): Promise<OrderDto> {
    // 1. Validar cliente via gRPC
    const customer = await this.customerValidator.validate(input.customerId);

    // 2. Criar Aggregate Order
    const order = Order.create(input.customerId, input.items);

    // 3. Aplicar Strategy de pricing
    const strategy = customer.isPremium ? PriceStrategy.PREMIUM : PriceStrategy.BASIC;
    const deliveryFee = this.calculateDeliveryFee(strategy, customer.address);
    order.setDeliveryFee(deliveryFee);

    // 4. Persistir
    const savedOrder = await this.orderRepo.save(order);

    // 5. Publicar Domain Events
    order.getDomainEvents().forEach(event => this.eventBus.publish(event));

    // 6. Retornar DTO
    return OrderMapper.toDto(savedOrder);
  }
}
```

**Exemplo: AssignDeliveryUseCase (msdelivery)**

```typescript
@Injectable()
export class AssignDeliveryUseCase {
  constructor(
    @Inject(DELIVERY_REPOSITORY)
    private readonly deliveryRepo: IDeliveryRepository,
    @Inject(DELIVERY_PERSON_REPOSITORY)
    private readonly personRepo: IDeliveryPersonRepository,
  ) {}

  async execute(deliveryId: number, deliveryPersonId: number): Promise<DeliveryDto> {
    // Buscar entidades
    const delivery = await this.deliveryRepo.findById(deliveryId);
    const person = await this.personRepo.findById(deliveryPersonId);

    // Validar regras de negócio
    if (!person.isAvailable()) {
      throw new Error('Entregador não está disponível');
    }

    // Executar ação de domínio
    delivery.assign(deliveryPersonId);
    person.changeStatus(DeliveryPersonStatus.BUSY);

    // Persistir
    await this.deliveryRepo.save(delivery);
    await this.personRepo.save(person);

    return DeliveryMapper.toDto(delivery);
  }
}
```

**Estrutura típica de Use Case:**
1. Validar pré-condições
2. Buscar entidades necessárias
3. Executar lógica de negócio (encapsulada nas entities)
4. Persistir mudanças
5. Publicar eventos (se necessário)
6. Retornar DTO

### 6. Repository Interfaces (Ports)

Interfaces definidas no domínio, implementadas na infraestrutura.

**Exemplo: IDeliveryRepository (msdelivery)**

```typescript
// domain/repositories/delivery.repository.interface.ts
export const DELIVERY_REPOSITORY = Symbol('DELIVERY_REPOSITORY');

export interface IDeliveryRepository {
  findById(id: number): Promise<DeliveryEntity>;
  findByOrderId(orderId: number): Promise<DeliveryEntity>;
  findByStatus(status: DeliveryStatus): Promise<DeliveryEntity[]>;
  findByDeliveryPerson(deliveryPersonId: number): Promise<DeliveryEntity[]>;
  save(delivery: DeliveryEntity): Promise<DeliveryEntity>;
  delete(id: number): Promise<void>;
}

// infrastructure/persistence/delivery.repository.ts
@Injectable()
export class DeliveryRepository implements IDeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<DeliveryEntity> {
    const prismaDelivery = await this.prisma.delivery.findUnique({
      where: { id },
    });
    
    if (!prismaDelivery) {
      throw new Error('Entrega não encontrada');
    }

    return PrismaMapper.toDomainDelivery(prismaDelivery);
  }

  async save(delivery: DeliveryEntity): Promise<DeliveryEntity> {
    const prismaData = PrismaMapper.toPrismaDelivery(delivery);
    
    const saved = await this.prisma.delivery.upsert({
      where: { id: delivery.id },
      create: prismaData,
      update: prismaData,
    });

    return PrismaMapper.toDomainDelivery(saved);
  }
}
```

**Benefícios:**
- Inversão de dependência (domínio não depende de Prisma)
- Facilita testes (mock da interface)
- Permite trocar ORM sem afetar domínio
- Contratos claros

### 7. Mappers

Convertem dados entre camadas mantendo separação.

**Exemplo: DeliveryMapper (msdelivery)**

```typescript
export class DeliveryMapper {
  // Domain Entity -> DTO (para GraphQL)
  static toDto(entity: DeliveryEntity): DeliveryDto {
    return {
      id: entity.id,
      orderId: entity.orderId,
      customerLatitude: entity.customerLocation.getLatitude(),
      customerLongitude: entity.customerLocation.getLongitude(),
      customerAddress: entity.customerAddress,
      status: entity.status,
      deliveryPersonId: entity.deliveryPersonId,
    };
  }

  // DTO -> Domain Entity
  static toDomain(dto: CreateDeliveryDto): DeliveryEntity {
    return new DeliveryEntity(
      0,
      dto.orderId,
      Location.create(dto.customerLatitude, dto.customerLongitude),
      dto.customerAddress,
      DeliveryStatus.PENDING,
    );
  }
}

// PrismaMapper (infrastructure)
export class PrismaMapper {
  // Prisma Model -> Domain Entity
  static toDomainDelivery(prisma: PrismaDelivery): DeliveryEntity {
    return new DeliveryEntity(
      prisma.id,
      prisma.orderId,
      Location.create(prisma.customerLatitude, prisma.customerLongitude),
      prisma.customerAddress,
      prisma.status as DeliveryStatus,
      prisma.deliveryPersonId,
    );
  }

  // Domain Entity -> Prisma Data
  static toPrismaDelivery(entity: DeliveryEntity): any {
    return {
      id: entity.id,
      orderId: entity.orderId,
      customerLatitude: entity.customerLocation.getLatitude(),
      customerLongitude: entity.customerLocation.getLongitude(),
      customerAddress: entity.customerAddress,
      status: entity.status,
      deliveryPersonId: entity.deliveryPersonId,
    };
  }
}
```

## Arquitetura Hexagonal (Ports & Adapters)

### Princípios

1. **Núcleo de negócio independente**: Domain não depende de nada
2. **Portas (Interfaces)**: Contratos definidos no domínio
3. **Adaptadores**: Implementações concretas na infraestrutura
4. **Inversão de dependência**: Fluxo de dentro para fora

### Ports (Portas)

**Primary Ports (Driving)**: Interfaces usadas pela aplicação

```typescript
// Use Case é um Primary Port
export interface ICreateOrderUseCase {
  execute(input: CreateOrderInput): Promise<OrderDto>;
}
```

**Secondary Ports (Driven)**: Interfaces implementadas pela infraestrutura

```typescript
// Repository é um Secondary Port
export interface IOrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: number): Promise<Order>;
}
```

### Adapters (Adaptadores)

**Primary Adapters (Driving)**: GraphQL Resolvers, gRPC Controllers

```typescript
// presentation/graphql/delivery.resolver.ts
@Resolver()
export class DeliveryResolver {
  constructor(private readonly createDeliveryUseCase: CreateDeliveryUseCase) {}

  @Mutation()
  async createDelivery(@Args('input') input: CreateDeliveryInput): Promise<DeliveryDto> {
    return this.createDeliveryUseCase.execute(input);
  }
}
```

**Secondary Adapters (Driven)**: Prisma Repository, gRPC Client

```typescript
// infrastructure/persistence/delivery.repository.ts
@Injectable()
export class DeliveryRepository implements IDeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}
  // Implementação...
}

// infrastructure/adapters/routing-grpc.adapter.ts
@Injectable()
export class RoutingGrpcAdapter implements IRoutingService {
  constructor(@Inject('ROUTING_GRPC') private readonly grpcClient: any) {}
  
  async calculateRoute(origin: Location, destination: Location): Promise<Route> {
    const response = await this.grpcClient.calculateRoute({
      origin: { lat: origin.getLatitude(), lng: origin.getLongitude() },
      destination: { lat: destination.getLatitude(), lng: destination.getLongitude() },
    });
    return RouteMapper.fromGrpc(response);
  }
}
```

---


## Conclusão

A implementação de DDD com Arquitetura Hexagonal nos microserviços principais do sistema de delivery trouxe **clareza arquitetural**, **testabilidade** e **manutenibilidade** ao projeto. 

Cada microserviço possui um domínio rico com regras de negócio encapsuladas em Entities e Value Objects, Use Cases que orquestram a lógica, e Adapters que isolam dependências externas.

**Documentação relacionada:**
- [ADR - Decisões Arquiteturais](adr.md)
- [Design Patterns Implementados](design-patterns.md)
```

