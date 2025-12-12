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

#### 1.2 Algoritmos de Roteamento (msrouting)

**Localização:** `msrouting/src/routing/strategies/`

**Problema resolvido:** Diferentes situações exigem diferentes algoritmos para calcular a melhor rota de entrega.

**Estrutura:**

```typescript
interface IRouteStrategy {
  calculateRoute(origin: Location, destination: Location): Route;
  getName(): string;
}

class FastestRouteStrategy implements IRouteStrategy { }
class ShortestRouteStrategy implements IRouteStrategy { }
class EconomicalRouteStrategy implements IRouteStrategy { }
class EcoFriendlyRouteStrategy implements IRouteStrategy { }
```

**Estratégias disponíveis:**
- **Fastest**: Prioriza tempo, pode usar vias expressas
- **Shortest**: Menor distância, independente do tempo
- **Economical**: Otimiza custo de combustível
- **Eco-Friendly**: Minimiza emissões de carbono

**Benefícios:**
- Cada algoritmo encapsulado e independente
- Fácil adicionar novos algoritmos de roteamento
- Cliente escolhe estratégia conforme necessidade em runtime
- Evita código condicional complexo

**Justificativa de uso:**
O cálculo de rotas pode priorizar diferentes critérios: velocidade, distância, economia de combustível ou sustentabilidade. O Strategy Pattern permite que o sistema escolha dinamicamente o algoritmo mais adequado baseado no contexto da entrega, tipo de veículo do entregador ou preferências do cliente.

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
class CustomerRepositoryLogger implements ICustomerRepository {
  private readonly logger = new Logger('CustomerRepository');

  constructor(
    @Inject('CustomerRepository')
    private readonly repository: ICustomerRepository
  ) {}

  async findAll(): Promise<Customer[]> {
    this.logger.log('Buscando todos os clientes');
    const startTime = Date.now();
    
    const result = await this.repository.findAll();
    
    const duration = Date.now() - startTime;
    this.logger.log(`${result.length} clientes encontrados em ${duration}ms`);
    
    return result;
  }

  async findById(id: number): Promise<Customer | null> {
    this.logger.log(`Buscando cliente com ID: ${id}`);
    const result = await this.repository.findById(id);
    this.logger.log(result ? 'Cliente encontrado' : 'Cliente não encontrado');
    return result;
  }

  // ... delega e adiciona logging para todas as operações
}
```

**Configuração no módulo:**

```typescript
@Module({
  providers: [
    CustomerRepository,
    {
      provide: 'ICustomerRepository',
      useClass: CustomerRepositoryLogger, // Usa o decorator
    },
  ],
})
export class CustomersModule {}
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

#### 5.1 Factory de Entities (mstracking)

**Localização:** `mstracking/src/prisma/prisma.service.ts`

**Problema resolvido:** Criar entidades de tracking com validação e inicialização consistentes, encapsulando a lógica de criação.

**Estrutura:**

```typescript
@Injectable()
export class PrismaService extends PrismaClient {
  
  // Factory Method - Cria TrackingPosition com validação
  createTrackingPosition(data: {
    delivery_id: string;
    order_id: string;
    latitude: number;
    longitude: number;
    delivery_person_id: string;
  }): TrackingPosition {
    // Validações
    if (!data.delivery_id || !data.order_id) {
      throw new Error('delivery_id e order_id são obrigatórios');
    }

    if (data.latitude < -90 || data.latitude > 90) {
      throw new Error('Latitude inválida');
    }

    if (data.longitude < -180 || data.longitude > 180) {
      throw new Error('Longitude inválida');
    }

    // Criação com valores padrão e inicialização
    return {
      id: crypto.randomUUID(),
      ...data,
      timestamp: new Date(),
      accuracy: 10, // metros de precisão
      speed: 0,
      heading: null,
      createdAt: new Date(),
    };
  }

  // Factory Method - Cria DeliveryTracking
  createDeliveryTracking(deliveryId: string, orderId: string): DeliveryTracking {
    return {
      id: crypto.randomUUID(),
      delivery_id: deliveryId,
      order_id: orderId,
      status: 'ACTIVE',
      startedAt: new Date(),
      estimatedArrival: null,
      completedAt: null,
    };
  }
}
```

**Uso:**

```typescript
@Injectable()
class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async updatePosition(data: UpdatePositionInput) {
    // Usa factory ao invés de construir manualmente
    const position = this.prisma.createTrackingPosition({
      delivery_id: data.deliveryId,
      order_id: data.orderId,
      latitude: data.latitude,
      longitude: data.longitude,
      delivery_person_id: data.deliveryPersonId,
    });

    // Salva no banco
    return this.prisma.trackingPosition.create({ data: position });
  }
}
```

**Benefícios:**
- **Encapsulamento**: Lógica de criação centralizada
- **Consistência**: Todas as entidades criadas da mesma forma
- **Validação**: Garante que objetos sejam válidos antes da criação
- **Manutenibilidade**: Mudanças na criação ficam em um único lugar

**Justificativa de uso:**
Criar entidades de tracking requer validações complexas (coordenadas geográficas válidas, IDs obrigatórios) e inicialização com valores padrão. O Factory Method encapsula essa complexidade, garantindo que todas as entidades sejam criadas de forma consistente e válida.

---

## Resumo dos Padrões Implementados

| Padrão | Microserviço | Problema Resolvido | Benefício Principal |
|--------|--------------|-------------------|---------------------|
| **Strategy** | orders, routing | Múltiplos algoritmos intercambiáveis | Flexibilidade e extensibilidade |
| **Observer** | notifications, tracking | Notificação de múltiplos interessados | Baixo acoplamento, broadcast |
| **Adapter** | orders, delivery | Integração com serviços externos | Isolamento de tecnologias |
| **Decorator** | customers | Adicionar funcionalidades dinamicamente | Open/Closed, composição |
| **Factory Method** | tracking | Criação consistente de objetos | Encapsulamento, validação |

---

## Justificativa Geral

**Strategy Pattern**: Essencial para o domínio de delivery com múltiplas formas de cálculo de preço e roteamento. Permite adicionar novos algoritmos sem modificar código existente.

**Observer Pattern**: Fundamental para sistema de notificações e rastreamento em tempo real. Múltiplos componentes precisam ser notificados quando eventos ocorrem, sem acoplamento direto.

**Adapter Pattern**: Crucial para arquitetura hexagonal e integração com serviços externos via gRPC. A camada de aplicação não depende de tecnologias específicas de comunicação.

**Decorator Pattern**: Permite adicionar concerns transversais (logging, métricas, auditoria) aos repositories sem poluir a lógica de negócio e respeitando Open/Closed Principle.

**Factory Method**: Garante criação consistente e válida de entidades complexas (coordenadas geográficas, tracking positions) com regras de negócio e validações encapsuladas.

