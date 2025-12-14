# Padrões de Projeto Implementados

Este documento detalha os 5 padrões implementados no sistema de delivery. Cada padrão foi escolhido para resolver problemas específicos de design e melhorar a qualidade, manutenibilidade e escalabilidade do código.


## 1. Strategy Pattern

### Descrição
O Strategy Pattern define uma família de algoritmos, encapsula cada um deles e os torna intercambiáveis. O algoritmo pode variar independentemente dos clientes que o utilizam, permitindo seleção em tempo de execução.

### Implementações no Projeto

#### 1.1 Cálculo de Preços (msorders)

**Localização:** `msorders/src/orders/strategies/`

**Problema resolvido:** Diferentes tipos de clientes e entregas precisam de diferentes formas de calcular preços e taxas de entrega.

**Estrutura:**

```typescript
// Interface comum
interface IPriceCalculator {
  calculateSubtotal(items: OrderItem[]): number;
  calculateDeliveryFee(address: OrderAddress): number;
  calculateDeliveryTime(address: OrderAddress): number;
}

// Estratégias concretas
class BasicPriceCalculator implements IPriceCalculator { }
class PremiumPriceCalculator implements IPriceCalculator { }
class ExpressPriceCalculator implements IPriceCalculator { }

// Contexto
class PriceCalculatorContext {
  private strategies: Map<PriceStrategy, IPriceCalculator>;
  
  calculateSubtotal(strategy: PriceStrategy, items: OrderItem[]): number {
    const calculator = this.getCalculator(strategy);
    return calculator.calculateSubtotal(items);
  }
}
```

**Benefícios:**
- **Open/Closed Principle**: Fácil adicionar novas estratégias sem modificar código existente
- **Single Responsibility**: Cada estratégia tem uma única responsabilidade
- **Testabilidade**: Cada estratégia pode ser testada isoladamente
- **Flexibilidade**: Seleção de algoritmo em tempo de execução
- **Eliminação de condicionais**: Substitui múltiplos if/else por polimorfismo

**Justificativa de uso:**
O sistema possui diferentes tipos de clientes (básico, premium) e diferentes urgências de entrega (normal, expressa). Cada combinação requer cálculos distintos de preço, taxa de entrega e tempo estimado. O Strategy Pattern permite adicionar novos tipos de cálculo sem impactar o código existente, respeitando o princípio Open/Closed.


---

## 2. Observer Pattern

### Descrição
O Observer Pattern define uma dependência um-para-muitos entre objetos, de modo que quando um objeto muda de estado, todos os seus dependentes são notificados e atualizados automaticamente.

### Implementações no Projeto

#### 2.1 Sistema de Notificações (msnotifications)

**Localização:** `msnotifications/src/infrastructure/adapters/`

**Problema resolvido:** Enviar notificações através de múltiplos canais (terminal, logs, email, SMS) sem acoplar o código de notificação aos canais específicos. Quando um evento ocorre, todos os observadores registrados devem ser notificados.

**Estrutura:**

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

  unsubscribe(observer: NotificationObserverPort): void {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  async notify(notification: NotificationData): Promise<void> {
    const promises = this.observers.map(observer => 
      observer.update(notification)
    );
    await Promise.all(promises);
  }
}

// Concrete Observers
@Injectable()
class TerminalNotifierObserver implements NotificationObserverPort {
  async update(notification: NotificationData): Promise<void> {
    console.log(`[NOTIFICACAO] ${notification.message}`);
  }
}

@Injectable()
class NotificationLoggerObserver implements NotificationObserverPort {
  async update(notification: NotificationData): Promise<void> {
    // Loga em arquivo estruturado
  }
}
```

**Uso no sistema:**
```typescript
// No módulo de inicialização
notificationSubject.subscribe(terminalNotifier);
notificationSubject.subscribe(loggerObserver);
notificationSubject.subscribe(emailObserver);

// Quando um evento ocorre
await notificationSubject.notify({
  orderId: '123',
  userId: 'user-456',
  status: 'CONFIRMED',
  message: 'Seu pedido foi confirmado!'
});
// Todos os observadores são notificados automaticamente
```

**Benefícios:**
- **Baixo acoplamento**: Subject não conhece detalhes dos observers
- **Open/Closed**: Novos observers podem ser adicionados sem modificar o subject
- **Broadcast communication**: Um evento notifica múltiplos interessados
- **Flexibilidade**: Observers podem ser adicionados/removidos em runtime

**Justificativa de uso:**
O sistema precisa notificar clientes através de diferentes canais quando eventos importantes ocorrem (pedido confirmado, entrega a caminho, etc.). O Observer Pattern permite adicionar novos canais de notificação (WhatsApp, Push notifications) sem modificar a lógica central do sistema.

#### 2.2 Rastreamento de Entregas (mstracking)

**Localização:** `mstracking/src/tracking/services/tracking.service.ts`

**Problema resolvido:** Notificar múltiplos componentes quando a posição do entregador é atualizada, sem acoplar o serviço de rastreamento aos componentes interessados.

**Estrutura:**

```typescript
interface PositionObserver {
  update(position: TrackingPosition): void;
}

@Injectable()
class TrackingService {
  private observers: PositionObserver[] = [];

  attach(observer: PositionObserver): void {
    this.observers.push(observer);
  }

  detach(observer: PositionObserver): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  private notifyObservers(position: TrackingPosition): void {
    this.observers.forEach(observer => observer.update(position));
  }

  async updatePosition(data: UpdatePositionInput): Promise<void> {
    const position = await this.savePosition(data);
    this.notifyObservers(position); // Notifica todos os interessados
    await this.pubSub.publish('positionUpdated', { positionUpdated: position });
  }
}
```

**Benefícios:**
- WebSocket, GraphQL subscriptions e outros componentes são notificados automaticamente
- Fácil adicionar novos componentes interessados em atualizações de posição
- Desacoplamento entre tracking service e consumers

**Justificativa de uso:**
Atualizações de posição do entregador interessam a múltiplos componentes: WebSocket para clientes em tempo real, sistema de notificações, histórico de rastreamento, cálculo de ETA. O Observer permite que todos sejam notificados sem criar dependências diretas.

---

## 3. Adapter Pattern

### Descrição
O Adapter Pattern converte a interface de uma classe em outra interface que os clientes esperam. Permite que classes com interfaces incompatíveis trabalhem juntas.

### Implementações no Projeto

#### 3.1 Adaptadores de Serviços Externos (msorders)

**Localização:** `msorders/src/infrastructure/adapters/`

**Problema resolvido:** Os use cases da camada de aplicação não devem depender de implementações específicas de gRPC, HTTP ou outras tecnologias de comunicação. Os adaptadores convertem as interfaces externas para as interfaces (ports) esperadas pela aplicação.

**Estrutura (Arquitetura Hexagonal):**

```typescript
// Port (interface da aplicação)
interface IRoutingCalculator {
  calculateRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
  ): Promise<RouteData>;
}

// Adapter (implementação usando gRPC)
@Injectable()
class RoutingAdapter implements IRoutingCalculator {
  constructor(private readonly grpcClient: RoutingGrpcClient) {}

  async calculateRoute(origin, destination): Promise<RouteData> {
    // Converte para formato gRPC
    const grpcRequest = {
      origin: { lat: origin.latitude, lng: origin.longitude },
      destination: { lat: destination.latitude, lng: destination.longitude }
    };
    
    // Chama serviço externo via gRPC
    const grpcResponse = await this.grpcClient.calculateRoute(grpcRequest);
    
    // Converte resposta gRPC para formato da aplicação
    return {
      distance: grpcResponse.distanceMeters / 1000,
      duration: grpcResponse.durationSeconds / 60,
      estimatedFee: grpcResponse.fee
    };
  }
}
```

**Outros Adaptadores no projeto:**

```typescript
// Adapta cliente gRPC para interface de validação de clientes
@Injectable()
class CustomersGrpcAdapter implements ICustomerValidator {
  constructor(private readonly grpcClient: CustomersGrpcClient) {}
  
  async validateCustomer(customerId: number): Promise<boolean> {
    const customer = await this.grpcClient.findById(customerId);
    return !!customer && customer.isActive;
  }
}

// Adapta serviço de notificações
@Injectable()
class NotificationAdapter implements INotificationSender {
  constructor(private readonly grpcClient: NotificationsGrpcClient) {}
  
  async sendNotification(data: NotificationData): Promise<void> {
    await this.grpcClient.createNotification({
      user_id: data.userId,
      order_id: data.orderId,
      message: data.message
    });
  }
}
```

**Configuração no módulo:**

```typescript
@Module({
  providers: [
    {
      provide: 'IRoutingCalculator',
      useClass: RoutingAdapter, // Facilmente substituível
    },
    {
      provide: 'ICustomerValidator',
      useClass: CustomersGrpcAdapter,
    },
    {
      provide: 'INotificationSender',
      useClass: NotificationAdapter,
    },
  ],
})
export class AdaptersModule {}
```

**Benefícios:**
- **Dependency Inversion**: Aplicação depende de abstrações (ports), não de implementações concretas
- **Testabilidade**: Fácil criar mocks dos adaptadores para testes
- **Flexibilidade**: Trocar gRPC por REST sem alterar a lógica de negócio
- **Isolamento**: Mudanças em APIs externas ficam contidas nos adaptadores

**Justificativa de uso:**
O projeto segue Arquitetura Hexagonal (Ports & Adapters). A camada de aplicação define interfaces (ports) que representam o que ela precisa do mundo externo. Os adaptadores implementam essas interfaces usando tecnologias específicas (gRPC, REST, etc.). Isso permite trocar tecnologias de comunicação sem impactar a lógica de negócio.

---

## 4. Decorator Pattern

### Descrição
O Decorator Pattern anexa responsabilidades adicionais a um objeto dinamicamente. Decorators fornecem uma alternativa flexível ao uso de subclasses para estender funcionalidades.

### Implementações no Projeto

#### 4.1 Repository com Logging (mscustomers)

**Localização:** `mscustomers/src/customers/repositories/`

**Problema resolvido:** Adicionar logging às operações de repositório sem modificar a implementação original, respeitando o princípio Open/Closed.

**Estrutura:**

```typescript
// Interface base
interface ICustomerRepository {
  findAll(): Promise<Customer[]>;
  findById(id: number): Promise<Customer | null>;
  create(data: CreateCustomerInput): Promise<Customer>;
  update(id: number, data: UpdateCustomerInput): Promise<Customer>;
  delete(id: number): Promise<boolean>;
}

// Implementação base
@Injectable()
class CustomerRepository implements ICustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Customer[]> {
    return this.prisma.customer.findMany();
  }

  async findById(id: number): Promise<Customer | null> {
    return this.prisma.customer.findById(id);
  }

  // ... outras operações
}

// Decorator - adiciona logging SEM modificar CustomerRepository
@Injectable()
export class CustomerRepositoryLoggerDecorator implements IRepositorioCliente {
  private readonly logger = new Logger('CustomerRepository');

  constructor(
    @Inject('CUSTOMER_REPOSITORY_BASE')
    private readonly repository: IRepositorioCliente
  ) {}

  async buscarTodos(): Promise<Cliente[]> {
    this.logger.log('Buscando todos os clientes');
    const startTime = Date.now();
    
    const result = await this.repository.buscarTodos();
    
    const duration = Date.now() - startTime;
    this.logger.log(`${result.length} clientes encontrados em ${duration}ms`);
    
    return result;
  }

  async buscarPorId(id: number): Promise<Cliente | null> {
    this.logger.log(`Buscando cliente com ID: ${id}`);
    const startTime = Date.now();
    
    const result = await this.repository.buscarPorId(id);
    
    const duration = Date.now() - startTime;
    this.logger.log(result 
      ? `Cliente encontrado em ${duration}ms` 
      : `Cliente não encontrado em ${duration}ms`
    );
    return result;
  }

  // ... delega e adiciona logging para todas as operações
}
```

**Configuração no módulo:**

```typescript
@Module({
  providers: [
    PrismaCustomerRepository,
    {
      provide: 'CUSTOMER_REPOSITORY_BASE',
      useExisting: PrismaCustomerRepository,
    },
    {
      provide: 'CUSTOMER_REPOSITORY',
      useClass: CustomerRepositoryLoggerDecorator, // Usa o decorator
    },
  ],
})
export class InfrastructureModule {}
```

**Benefícios:**
- **Open/Closed Principle**: Funcionalidade adicionada sem modificar código original
- **Single Responsibility**: Logging separado da lógica de persistência
- **Flexibilidade**: Fácil adicionar/remover decorators
- **Composição**: Múltiplos decorators podem ser empilhados (logging, cache, validação)

**Justificativa de uso:**
Logging, métricas e auditoria são concerns transversais que não devem poluir a lógica de negócio. O Decorator Pattern permite adicionar essas funcionalidades de forma limpa e desacoplada, mantendo o repository original focado apenas em persistência.

---

## 5. Factory Method Pattern

### Descrição
O Factory Method define uma interface para criar objetos, mas permite que subclasses decidam qual classe instanciar. Factory Method permite que uma classe delegue a instanciação para subclasses.

### Implementações no Projeto

#### 5.1 Factory de Notificações (mstracking)

**Localização:** `mstracking/src/domain/notifications/notification.factory.ts`

**Problema resolvido:** Criar diferentes tipos de notificações (Email, SMS) de forma consistente, encapsulando a lógica de criação e permitindo extensibilidade.

**Estrutura:**

```typescript
// Classe abstrata - Creator
export abstract class NotificationFactory {
  /**
   * Factory Method - Método abstrato que subclasses devem implementar
   */
  protected abstract createNotification(
    recipient: string,
    message: string,
    deliveryId: string,
    orderId: string
  ): INotification;

  /**
   * Template Method - Define o fluxo geral de envio
   */
  async sendNotification(
    recipient: string,
    message: string,
    deliveryId: string,
    orderId: string
  ): Promise<void> {
    // Usa o factory method para criar a notificação apropriada
    const notification = this.createNotification(
      recipient,
      message,
      deliveryId,
      orderId
    );

    // Envia a notificação
    await notification.send();
    
    // Log
    const info = notification.getInfo();
    console.log(`[${info.type}] Notificação enviada para ${info.recipient}`);
  }
}

// Concrete Creator - Email
export class EmailNotificationFactory extends NotificationFactory {
  protected createNotification(
    recipient: string,
    message: string,
    deliveryId: string,
    orderId: string
  ): INotification {
    return new EmailNotification(recipient, message, deliveryId, orderId);
  }
}

// Concrete Creator - SMS
export class SmsNotificationFactory extends NotificationFactory {
  protected createNotification(
    recipient: string,
    message: string,
    deliveryId: string,
    orderId: string
  ): INotification {
    return new SmsNotification(recipient, message, deliveryId, orderId);
  }
}
```

**Uso:**

```typescript
@Injectable()
export class NotificationService {
  private factories: Map<NotificationType, NotificationFactory>;

  constructor(
    private readonly emailFactory: EmailNotificationFactory,
    private readonly smsFactory: SmsNotificationFactory,
  ) {
    this.factories = new Map([
      [NotificationType.EMAIL, emailFactory],
      [NotificationType.SMS, smsFactory],
    ]);
  }

  async notify(
    type: NotificationType,
    recipient: string,
    message: string,
    deliveryId: string,
    orderId: string
  ): Promise<void> {
    // Seleciona a factory apropriada
    const factory = this.factories.get(type);
    
    if (!factory) {
      throw new Error(`Factory não encontrada para tipo: ${type}`);
    }

    // Factory cria e envia a notificação
    await factory.sendNotification(recipient, message, deliveryId, orderId);
  }
}
```

**Benefícios:**
- **Encapsulamento**: Lógica de criação centralizada
- **Consistência**: Todas as entidades criadas da mesma forma
- **Validação**: Garante que objetos sejam válidos antes da criação
- **Manutenibilidade**: Mudanças na criação ficam em um único lugar

**Justificativa de uso:**
O sistema precisa enviar notificações através de diferentes canais (Email, SMS, Push). Cada canal tem sua própria lógica de criação e configuração. O Factory Method permite adicionar novos tipos de notificação sem modificar o código cliente, encapsulando a lógica de criação em factories específicas. Além disso, combina o padrão com Template Method para definir um fluxo comum de envio.

---

## Resumo dos Padrões Implementados

| Padrão | Microserviço | Problema Resolvido | Benefício Principal |
|--------|--------------|-------------------|---------------------|
| **Strategy** | orders, routing | Múltiplos algoritmos intercambiáveis | Flexibilidade e extensibilidade |
| **Observer** | notifications, tracking | Notificação de múltiplos interessados | Baixo acoplamento, broadcast |
| **Adapter** | orders, delivery | Integração com serviços externos | Isolamento de tecnologias |
| **Decorator** | customers | Adicionar funcionalidades dinamicamente | Open/Closed, composição |
| **Factory Method** | tracking | Criação de diferentes tipos de notificação | Encapsulamento, extensibilidade |

---

## Justificativa Geral

**Strategy Pattern**: Essencial para o domínio de delivery com múltiplas formas de cálculo de preço e roteamento. Permite adicionar novos algoritmos sem modificar código existente.

**Observer Pattern**: Fundamental para sistema de notificações e rastreamento em tempo real. Múltiplos componentes precisam ser notificados quando eventos ocorrem, sem acoplamento direto.

**Adapter Pattern**: Crucial para arquitetura hexagonal e integração com serviços externos via gRPC. A camada de aplicação não depende de tecnologias específicas de comunicação.

**Decorator Pattern**: Permite adicionar concerns transversais (logging, métricas, auditoria) aos repositories sem poluir a lógica de negócio e respeitando Open/Closed Principle.

**Factory Method**: Encapsula a criação de diferentes tipos de notificações (Email, SMS), permitindo adicionar novos canais sem modificar o código existente. Combina com Template Method para definir fluxo comum de envio.

---

## Localização das Implementações

### Strategy Pattern
- **msorders**: `src/orders/strategies/` (BasicPriceCalculator, PremiumPriceCalculator, ExpressPriceCalculator, PriceCalculatorContext)
- **msrouting**: `src/presentation/graphql/types/route.type.ts` (RouteStrategy enum), `src/application/use-cases/` (implementação de estratégias)

### Observer Pattern
- **msnotifications**: `src/infrastructure/adapters/` (NotificationSubjectAdapter, Observers para diferentes canais)
- **mstracking**: `src/application/use-cases/` (TrackingService com observers)

### Adapter Pattern
- **msorders**: `src/infrastructure/adapters/` (RoutingGrpcAdapter, CustomersGrpcAdapter, NotificationAdapter)
- **msdelivery**: `src/infrastructure/adapters/` (Adapters para serviços externos)

### Decorator Pattern
- **mscustomers**: `src/infrastructure/persistence/decorators/customer-repository-logger.decorator.ts` (CustomerRepositoryLoggerDecorator)
- Configuração em: `src/infrastructure/infrastructure.module.ts`

### Factory Method Pattern
- **mstracking**: `src/domain/notifications/notification.factory.ts` (NotificationFactory abstrata)
- **mstracking**: `src/infrastructure/notifications/` (EmailNotificationFactory, SmsNotificationFactory)

---

## Recursos Adicionais

Para entender melhor a arquitetura que suporta estes padrões:
- [DDD e Arquitetura Hexagonal](ddd-hexagonal.md)
- [Decisões Arquiteturais (ADR)](adr.md)

