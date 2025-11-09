# MS Orders - Microserviço de Pedidos

Microserviço responsável pelo gerenciamento de pedidos e produtos no sistema de delivery.

## Responsabilidades

Este serviço é o coração do sistema de delivery, gerenciando:

- Catálogo de produtos disponíveis
- Criação e gerenciamento de pedidos
- Cálculo dinâmico de preços e taxas de entrega
- Estimativa de tempo de entrega
- Acompanhamento de status dos pedidos
- Integração com outros serviços via gRPC

## Tecnologias Utilizadas

- **NestJS**: Framework principal
- **TypeScript**: Linguagem de programação
- **GraphQL**: API para clientes externos com Apollo Server
- **gRPC**: Comunicação entre microserviços
- **Prisma**: ORM com schema isolado
- **PostgreSQL**: Banco de dados relacional
- **DataLoader**: Otimização de queries N+1
- **Class Validator**: Validação de dados

## Estrutura do Projeto

```
msorders/
├── src/
│   ├── orders/                    # Módulo de pedidos
│   │   ├── dto/                  # Data Transfer Objects
│   │   │   ├── create-order.input.ts
│   │   │   ├── update-order.input.ts
│   │   │   └── order-item.input.ts
│   │   ├── interfaces/           # Contratos TypeScript
│   │   │   ├── price-calculator.interface.ts
│   │   │   └── order-datasource.interface.ts
│   │   ├── strategies/           # Strategy Pattern
│   │   │   ├── basic-price-calculator.strategy.ts
│   │   │   ├── premium-price-calculator.strategy.ts
│   │   │   ├── express-price-calculator.strategy.ts
│   │   │   └── price-calculator.context.ts
│   │   ├── customers-dataloader.service.ts
│   │   ├── orders.datasource.ts
│   │   ├── orders.service.ts
│   │   ├── orders.resolver.ts
│   │   ├── orders.module.ts
│   │   └── orders.graphql
│   ├── product/                  # Módulo de produtos
│   │   ├── dto/
│   │   ├── product.service.ts
│   │   ├── product.resolver.ts
│   │   └── product.module.ts
│   ├── grpc/                     # Configuração gRPC
│   │   ├── grpc-orders.module.ts
│   │   └── grpc-orders.service.ts
│   ├── prisma/
│   │   └── prisma.service.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── proto/
│   └── orders.proto
└── package.json
```

## Modelo de Dados

### Order (Pedido)

```prisma
model Order {
  id                    Int           @id @default(autoincrement())
  customerId            Int
  status                OrderStatus   @default(PENDING)
  items                 OrderItem[]
  subtotal              Decimal
  deliveryFee           Decimal
  total                 Decimal
  paymentMethod         PaymentMethod
  estimatedDeliveryTime Int?
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
}

enum OrderStatus {
  PENDING           // Aguardando confirmação
  CONFIRMED         // Confirmado
  PREPARING         // Em preparação
  OUT_FOR_DELIVERY  // Saiu para entrega
  ARRIVING          // Chegando
  DELIVERED         // Entregue
  CANCELLED         // Cancelado
}

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  PIX
  CASH
}
```

### OrderItem (Item do Pedido)

```prisma
model OrderItem {
  id          Int      @id @default(autoincrement())
  orderId     Int
  order       Order    @relation(fields: [orderId], references: [id])
  productId   Int
  product     Product? @relation(fields: [productId], references: [id])
  name        String
  description String?
  quantity    Int
  price       Decimal
}
```

### Product (Produto)

```prisma
model Product {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  price       Decimal
  category    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## API GraphQL

### Queries

```graphql
type Query {
  # Listar todos os pedidos
  orders: [Order!]!
  
  # Buscar pedido por ID
  order(id: Int!): Order
  
  # Listar pedidos de um cliente
  ordersByCustomer(customerId: Int!): [Order!]!
  
  # Listar pedidos por status
  ordersByStatus(status: OrderStatus!): [Order!]!
  
  # Listar todos os produtos
  products: [Product!]!
  
  # Buscar produto por ID
  product(id: Int!): Product
}
```

### Mutations

```graphql
type Mutation {
  # Criar novo pedido
  createOrder(input: CreateOrderInput!): Order!
  
  # Atualizar status do pedido
  updateOrderStatus(id: Int!, status: OrderStatus!): Order!
  
  # Criar produto
  createProduct(input: CreateProductInput!): Product!
  
  # Atualizar produto
  updateProduct(id: Int!, input: UpdateProductInput!): Product!
}
```

### Tipos

```graphql
type Order {
  id: Int!
  customerId: Int!
  customer: Customer!  # Carregado via DataLoader
  status: OrderStatus!
  items: [OrderItem!]!
  subtotal: Float!
  deliveryFee: Float!
  total: Float!
  paymentMethod: PaymentMethod!
  estimatedDeliveryTime: Int
  createdAt: DateTime!
  updatedAt: DateTime!
}

type OrderItem {
  id: Int!
  orderId: Int!
  productId: Int!
  product: Product
  name: String!
  description: String
  quantity: Int!
  price: Float!
}

type Product {
  id: Int!
  name: String!
  description: String
  price: Float!
  category: String
  isActive: Boolean!
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PREPARING
  OUT_FOR_DELIVERY
  ARRIVING
  DELIVERED
  CANCELLED
}

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  PIX
  CASH
}
```

## Padrões de Projeto Implementados

### 1. Strategy Pattern - Cálculo de Preços

O sistema implementa diferentes estratégias de cálculo de preço dependendo do tipo de entrega e cliente.

#### Interface

```typescript
interface IPriceCalculator {
  calculateSubtotal(items?: OrderItem[]): number;
  calculateDeliveryFee(address?: OrderAddress): number;
  calculateDeliveryTime(address?: OrderAddress): number;
}
```

#### Estratégias

**BasicPriceCalculator** (Padrão)
```typescript
// Taxa fixa de entrega
deliveryFee = 5.00

// Tempo padrão
deliveryTime = 45 minutos
```

**PremiumPriceCalculator** (Clientes Premium)
```typescript
// Desconto de 50% na entrega
deliveryFee = subtotal * 0.5

// Prioridade na entrega
deliveryTime = 30 minutos
```

**ExpressPriceCalculator** (Entrega Expressa)
```typescript
// Taxa adicional pela velocidade
deliveryFee = subtotal * 1.5

// Entrega mais rápida
deliveryTime = 20 minutos
```

#### Contexto

```typescript
@Injectable()
class PriceCalculatorContext {
  private strategies: Map<PriceStrategy, IPriceCalculator>;

  calculateSubtotal(strategy: PriceStrategy, items?: OrderItem[]): number {
    const calculator = this.getCalculator(strategy);
    return calculator.calculateSubtotal(items);
  }

  calculateDeliveryFee(strategy: PriceStrategy, address?: OrderAddress): number {
    const calculator = this.getCalculator(strategy);
    return calculator.calculateDeliveryFee(address);
  }
}
```

#### Uso

```typescript
// No OrdersService
const strategy = customer.isPremium ? PriceStrategy.PREMIUM : PriceStrategy.BASIC;

const subtotal = this.priceContext.calculateSubtotal(strategy, items);
const deliveryFee = this.priceContext.calculateDeliveryFee(strategy, address);
const total = subtotal + deliveryFee;
```

### 2. Datasource Pattern

Separa queries complexas em uma camada dedicada.

```typescript
@Injectable()
class OrdersDatasource implements IOrderDatasource {
  constructor(private readonly prisma: PrismaService) {}

  async create(orderData: CreateOrderData) {
    return this.prisma.order.create({
      data: {
        customerId: orderData.customerId,
        // ... outros campos
        items: {
          create: await Promise.all(
            orderData.items.map(async (item) => {
              const product = await this.prisma.product.findUnique({
                where: { id: item.productId }
              });
              return {
                productId: item.productId,
                name: product.name,
                quantity: item.quantity,
                price: product.price,
              };
            })
          ),
        },
      },
      include: { items: true },
    });
  }
}
```

### 3. DataLoader Pattern

Resolve o problema N+1 ao buscar dados de clientes.

```typescript
@Injectable()
class CustomersDataloaderService {
  private loader: DataLoader<number, Customer>;

  constructor(private grpcClient: GrpcCustomersClient) {
    this.loader = new DataLoader(async (customerIds: number[]) => {
      // Busca todos de uma vez via gRPC
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

**Benefício**: Reduz múltiplas chamadas gRPC para uma única chamada batch.

## API gRPC

### Serviços Expostos

```protobuf
service OrdersService {
  // Buscar pedido por ID
  rpc FindOne (FindOneRequest) returns (Order);
  
  // Buscar itens de um pedido
  rpc FindOrderItems (FindOrderItemsRequest) returns (OrderItemsResponse);
  
  // Atualizar status do pedido
  rpc UpdateStatus (UpdateStatusRequest) returns (Order);
}
```

### Consumidores

- **msdelivery**: Busca detalhes do pedido para criar entrega
- **msnotifications**: Obtém dados do pedido para notificações
- **mstracking**: Acompanha status do pedido

## Configuração

### Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db_orders"

# Server
PORT=3000
GRAPHQL_PATH=/graphql

# gRPC
GRPC_PORT=50050

# Microservices
GRPC_CUSTOMERS_URL=localhost:50051
GRPC_DELIVERY_URL=localhost:50053
GRPC_NOTIFICATIONS_URL=localhost:50052
```

### Instalação

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## Executando

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

Acesso:
- GraphQL: http://localhost:3000/graphql
- gRPC: localhost:50050

## Exemplos de Uso

### Criar Pedido

```graphql
mutation {
  createOrder(input: {
    customerId: 1
    items: [
      { productId: 1, quantity: 2 }
      { productId: 3, quantity: 1 }
    ]
    paymentMethod: CREDIT_CARD
  }) {
    id
    status
    subtotal
    deliveryFee
    total
    estimatedDeliveryTime
    items {
      name
      quantity
      price
    }
    customer {
      name
      email
    }
  }
}
```

### Atualizar Status

```graphql
mutation {
  updateOrderStatus(id: 1, status: OUT_FOR_DELIVERY) {
    id
    status
    updatedAt
  }
}
```

### Buscar Pedidos do Cliente

```graphql
query {
  ordersByCustomer(customerId: 1) {
    id
    status
    total
    createdAt
    items {
      name
      quantity
      price
    }
  }
}
```

## Fluxo de Criação de Pedido

```
1. Cliente envia mutation createOrder
2. OrdersResolver recebe requisição
3. OrdersService processa:
   a. Busca dados do cliente via DataLoader (gRPC)
   b. Valida produtos existentes
   c. Calcula preços usando Strategy Pattern
   d. Persiste pedido via Datasource
4. Notifica outros serviços:
   a. msdelivery - Cria entrega
   b. msnotifications - Envia confirmação
5. Retorna pedido criado
```

## Regras de Negócio

1. **Validação de produtos**: Todos os produtos devem existir e estar ativos
2. **Cliente válido**: CustomerId deve existir no mscustomers
3. **Cálculo automático**: Preços são calculados no momento da criação
4. **Status sequencial**: Pedidos seguem fluxo de status definido
5. **Imutabilidade de preços**: Preços no pedido não mudam após criação
6. **Quantidade mínima**: Cada item deve ter quantidade >= 1

## Testes

```bash
# Unitários
npm run test

# E2E
npm run test:e2e

# Coverage
npm run test:cov
```

## Monitoramento

Logs estruturados em cada operação:

```typescript
this.logger.log('Order created', { 
  orderId: order.id, 
  customerId: order.customerId,
  total: order.total 
});
```

## Troubleshooting

### Erro ao calcular preço

Verificar se estratégia está registrada no contexto:

```typescript
// price-calculator.context.ts
this.strategies = new Map([
  [PriceStrategy.BASIC, this.basicCalculator],
  [PriceStrategy.PREMIUM, this.premiumCalculator],
  [PriceStrategy.EXPRESS, this.expressCalculator],
]);
```

### DataLoader não está cacheando

Verificar se o DataLoader é criado por requisição:

```typescript
// orders.resolver.ts
@ResolveField()
async customer(@Parent() order: Order, @Context() ctx) {
  return ctx.dataloader.load(order.customerId);
}
```

### Produto não encontrado

```bash
# Popular produtos de exemplo
npm run prisma:seed
```
