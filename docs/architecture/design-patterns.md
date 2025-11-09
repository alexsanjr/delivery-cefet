# Padrões de Projeto Implementados

Este documento detalha os padrões de projeto (Design Patterns) utilizados no sistema de delivery. Cada padrão foi escolhido para resolver problemas específicos e melhorar a qualidade do código.

## 1. Strategy Pattern

### Descrição
O Strategy Pattern permite definir uma família de algoritmos, encapsular cada um deles e torná-los intercambiáveis. Isso permite que o algoritmo varie independentemente dos clientes que o utilizam.

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
- Fácil adicionar novos tipos de cálculo
- Cada estratégia é testável independentemente
- Código limpo e organizado
- Princípio Open/Closed respeitado

**Quando usar:**
- Quando há múltiplas formas de executar uma operação
- Quando você quer evitar condicionais complexos
- Quando algoritmos devem ser escolhidos em runtime

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
- Cada algoritmo encapsulado
- Fácil adicionar novos algoritmos de roteamento
- Cliente escolhe estratégia conforme necessidade

## 2. Repository Pattern

### Descrição
O Repository Pattern abstrai a lógica de acesso a dados, fornecendo uma interface de coleção para acessar objetos de domínio.

### Implementação no Projeto

**Localização:** Implícito através do Prisma Service em cada microserviço

**Problema resolvido:** Isolar a lógica de negócio da lógica de persistência, facilitando testes e mudanças de tecnologia.

**Estrutura:**

```typescript
@Injectable()
class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// Usado pelos serviços
@Injectable()
class CustomersService {
  constructor(private prisma: PrismaService) {}
  
  async findAll() {
    return this.prisma.customer.findMany();
  }
}
```

**Benefícios:**
- Camada de abstração sobre o banco de dados
- Facilita testes com mocks
- Centraliza queries e lógica de acesso
- Mudança de ORM fica isolada

## 3. Datasource Pattern

### Descrição
Separa a lógica de acesso a dados específicos do domínio, criando uma camada adicional de abstração.

### Implementação no Projeto

**Localização:** `msorders/src/orders/orders.datasource.ts`

**Problema resolvido:** Separar queries complexas e específicas da lógica de negócio principal.

**Estrutura:**

```typescript
@Injectable()
class OrdersDatasource implements IOrderDatasource {
  constructor(private readonly prisma: PrismaService) {}

  async create(orderData: CreateOrderData) {
    return this.prisma.order.create({
      data: {
        // ... dados complexos
        items: {
          create: await Promise.all(/* lógica complexa */)
        }
      }
    });
  }

  async findByCustomer(customerId: number) {
    return this.prisma.order.findMany({
      where: { customerId },
      include: { items: true }
    });
  }
}
```

**Benefícios:**
- Queries complexas isoladas
- Reutilização de lógica de acesso
- Service fica mais limpo
- Testabilidade melhorada

## 4. DataLoader Pattern

### Descrição
Otimiza queries ao banco de dados agrupando múltiplas requisições individuais em uma única query batch.

### Implementação no Projeto

**Localização:** `msorders/src/orders/customers-dataloader.service.ts`

**Problema resolvido:** Problema N+1 quando buscar dados relacionados via gRPC.

**Estrutura:**

```typescript
@Injectable()
class CustomersDataloaderService {
  private loader: DataLoader<number, Customer>;

  constructor(private grpcClient: GrpcCustomersClient) {
    this.loader = new DataLoader(async (customerIds: number[]) => {
      // Busca todos os clientes de uma vez
      const customers = await this.grpcClient.findManyByIds(customerIds);
      // Retorna na ordem correta
      return customerIds.map(id => 
        customers.find(c => c.id === id)
      );
    });
  }

  async load(customerId: number): Promise<Customer> {
    return this.loader.load(customerId);
  }
}
```

**Benefícios:**
- Reduz chamadas ao banco/gRPC
- Melhora significativa de performance
- Cache automático por requisição
- Resolve problema N+1

**Exemplo sem DataLoader:**
```
Pedido 1 -> Busca Cliente 1
Pedido 2 -> Busca Cliente 1 (duplicado!)
Pedido 3 -> Busca Cliente 2
Total: 3 chamadas
```

**Exemplo com DataLoader:**
```
Pedido 1, 2, 3 -> Busca Clientes [1, 2]
Total: 1 chamada
```

## 5. Dependency Injection

### Descrição
As dependências de uma classe são fornecidas externamente ao invés de serem criadas internamente.

### Implementação no Projeto

**Localização:** Todo o projeto (nativo do NestJS)

**Problema resolvido:** Acoplamento forte entre classes, dificuldade de testes, violação do princípio de inversão de dependência.

**Estrutura:**

```typescript
// Serviço que será injetado
@Injectable()
class OrdersService {
  constructor(
    private readonly datasource: OrdersDatasource,
    private readonly priceContext: PriceCalculatorContext,
    private readonly grpcClient: GrpcClientsService,
  ) {}
}

// Módulo que configura a injeção
@Module({
  providers: [
    OrdersService,
    OrdersDatasource,
    PriceCalculatorContext,
  ],
  exports: [OrdersService],
})
class OrdersModule {}
```

**Benefícios:**
- Baixo acoplamento
- Fácil criar mocks para testes
- Flexibilidade para trocar implementações
- Código mais limpo

## 6. Module Pattern

### Descrição
Organiza código relacionado em módulos coesos e reutilizáveis.

### Implementação no Projeto

**Localização:** Todos os microserviços

**Problema resolvido:** Código desorganizado, dependências confusas, dificuldade de manutenção.

**Estrutura:**

```typescript
@Module({
  imports: [PrismaModule, GrpcModule],
  providers: [
    OrdersService,
    OrdersResolver,
    OrdersDatasource,
    // Strategies
    BasicPriceCalculator,
    PremiumPriceCalculator,
    ExpressPriceCalculator,
    PriceCalculatorContext,
  ],
  exports: [OrdersService],
})
class OrdersModule {}
```

**Organização típica de um módulo:**
```
orders/
├── dto/              # Data Transfer Objects
├── interfaces/       # Contratos TypeScript
├── strategies/       # Implementações Strategy
├── orders.module.ts
├── orders.service.ts
├── orders.resolver.ts
├── orders.datasource.ts
└── orders.graphql
```

**Benefícios:**
- Código organizado por domínio
- Dependências explícitas
- Fácil localizar funcionalidades
- Reutilização de módulos

## 7. DTO (Data Transfer Object)

### Descrição
Objetos simples usados para transferir dados entre camadas ou sistemas.

### Implementação no Projeto

**Localização:** Pastas `dto/` em cada módulo

**Problema resolvido:** Validação de dados, documentação de APIs, separação entre modelos de domínio e dados de transferência.

**Estrutura:**

```typescript
class CreateOrderInput {
  @IsNumber()
  customerId: number;

  @IsArray()
  @ValidateNested({ each: true })
  items: OrderItemInput[];

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

class OrderItemInput {
  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}
```

**Benefícios:**
- Validação automática com decorators
- Documentação explícita
- Type-safety
- Separação de responsabilidades

## 8. API Gateway Pattern

### Descrição
Um único ponto de entrada para todas as requisições de clientes, que roteia para os microserviços apropriados.

### Implementação no Projeto

**Localização:** `kong-gateway/`

**Problema resolvido:** Clientes não precisam conhecer todos os microserviços, centralização de autenticação, rate limiting e CORS.

**Estrutura:**

```yaml
# kong.yml
services:
  - name: msorders
    url: http://msorders:3000
    routes:
      - paths: [/orders]
    plugins:
      - name: jwt
      - name: rate-limiting
      - name: cors
```

**Funcionalidades:**
- Roteamento centralizado
- Autenticação JWT
- Rate limiting por serviço
- CORS configurado
- Logging centralizado

## 9. Microservices Pattern

### Descrição
Arquitetura onde a aplicação é dividida em serviços pequenos e independentes.

### Implementação no Projeto

**Características:**
- Cada serviço tem seu próprio banco de dados
- Comunicação via GraphQL (cliente) e gRPC (inter-serviços)
- Deploy independente
- Tecnologias podem variar entre serviços

**Benefícios:**
- Escalabilidade independente
- Falhas isoladas
- Desenvolvimento paralelo
- Flexibilidade tecnológica

**Desafios resolvidos:**
- Comunicação: gRPC para performance
- Consistência: Eventos assíncronos
- Descoberta: Kong como API Gateway
- Monitoramento: Logs estruturados

## 10. Database per Service

### Descrição
Cada microserviço possui seu próprio banco de dados isolado.

### Implementação no Projeto

**Estrutura:**
- `db_customers` - MS Customers
- `db_orders` - MS Orders
- `db_delivery` - MS Delivery
- `db_tracking` - MS Tracking

**Benefícios:**
- Independência total
- Sem acoplamento de schemas
- Tecnologias diferentes possíveis
- Escalabilidade individual

**Como lidar com dados relacionados:**
- Comunicação via gRPC
- DataLoader para otimização
- Cache quando apropriado

## Resumo de Aplicação

| Padrão | Microserviço | Benefício Principal |
|--------|--------------|---------------------|
| Strategy | orders, routing | Flexibilidade de algoritmos |
| Repository | Todos | Abstração de dados |
| Datasource | orders | Queries complexas isoladas |
| DataLoader | orders | Performance (N+1) |
| DI | Todos | Baixo acoplamento |
| Module | Todos | Organização |
| DTO | Todos | Validação e type-safety |
| API Gateway | kong-gateway | Ponto único de entrada |

