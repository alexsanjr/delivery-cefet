# MS Delivery - Microserviço de Entregas

Microserviço responsável pelo gerenciamento de entregadores e coordenação de entregas no sistema.

## Responsabilidades

Este serviço gerencia toda a logística de entregas:

- Cadastro e gerenciamento de entregadores
- Controle de disponibilidade e status dos entregadores
- Atribuição inteligente de entregas para entregadores
- Acompanhamento de localização em tempo real
- Gestão de tipos de veículos
- Cálculo de rotas otimizadas via integração com msrouting
- Atualização de status das entregas

## Tecnologias Utilizadas

- **NestJS**: Framework principal
- **TypeScript**: Linguagem de programação
- **GraphQL**: API para interface com clientes
- **gRPC**: Comunicação entre microserviços
- **Prisma**: ORM para banco de dados
- **PostgreSQL**: Armazenamento de dados
- **Apollo Server**: Servidor GraphQL com Code First
- **WebSocket**: Atualizações em tempo real (futuro)

## Estrutura do Projeto

```
msdelivery/
├── src/
│   ├── delivery-persons/          # Módulo de entregadores
│   │   ├── dto/
│   │   │   ├── create-delivery-person.input.ts
│   │   │   ├── update-delivery-person.input.ts
│   │   │   └── update-location.input.ts
│   │   ├── delivery-persons.service.ts
│   │   ├── delivery-persons.resolver.ts
│   │   └── delivery-persons.module.ts
│   ├── deliveries/                # Módulo de entregas
│   │   ├── dto/
│   │   │   ├── create-delivery.input.ts
│   │   │   └── update-delivery-status.input.ts
│   │   ├── deliveries.service.ts
│   │   ├── deliveries.resolver.ts
│   │   └── deliveries.module.ts
│   ├── grpc/                      # Configuração gRPC
│   │   ├── delivery-grpc.module.ts
│   │   ├── delivery-grpc.service.ts
│   │   └── grpc.module.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── prisma.service.ts
│   ├── utils/
│   │   └── location.utils.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── proto/
│   ├── delivery.proto
│   └── delivery-person.proto
└── package.json
```

## Modelo de Dados

### DeliveryPerson (Entregador)

```prisma
model DeliveryPerson {
  id              Int                  @id @default(autoincrement())
  name            String
  email           String               @unique
  phone           String               @unique
  cpf             String               @unique
  vehicleType     VehicleType
  licensePlate    String?              @unique
  status          DeliveryPersonStatus @default(OFFLINE)
  rating          Float                @default(5.0)
  totalDeliveries Int                  @default(0)
  
  currentLatitude    Float?
  currentLongitude   Float?
  lastLocationUpdate DateTime?
  
  isActive Boolean  @default(true)
  joinedAt DateTime @default(now())
  
  deliveries Delivery[]
}

enum DeliveryPersonStatus {
  AVAILABLE  // Disponível para receber entregas
  BUSY       // Em entrega
  OFFLINE    // Offline
  ON_BREAK   // Em pausa
}

enum VehicleType {
  BIKE       // Bicicleta
  MOTORCYCLE // Moto
  CAR        // Carro
  SCOOTER    // Patinete
  WALKING    // A pé
}
```

### Delivery (Entrega)

```prisma
model Delivery {
  id               Int            @id @default(autoincrement())
  orderId          Int            @unique
  deliveryPersonId Int?
  deliveryPerson   DeliveryPerson? @relation(fields: [deliveryPersonId], references: [id])
  
  status DeliveryStatus @default(PENDING)
  
  customerLatitude  Float
  customerLongitude Float
  customerAddress   String
  
  assignedAt   DateTime?
  pickedUpAt   DateTime?
  deliveredAt  DateTime?
  cancelledAt  DateTime?
  
  estimatedDeliveryTime Int?
  actualDeliveryTime    Int?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum DeliveryStatus {
  PENDING      // Aguardando atribuição
  ASSIGNED     // Atribuída a entregador
  PICKED_UP    // Coletada
  IN_TRANSIT   // Em trânsito
  DELIVERED    // Entregue
  CANCELLED    // Cancelada
  FAILED       // Falhou
}
```

## API GraphQL

### Queries

```graphql
type Query {
  # Entregadores
  deliveryPersons: [DeliveryPerson!]!
  deliveryPerson(id: Int!): DeliveryPerson
  availableDeliveryPersons: [DeliveryPerson!]!
  
  # Entregas
  deliveries: [Delivery!]!
  delivery(id: Int!): Delivery
  deliveryByOrder(orderId: Int!): Delivery
  deliveriesByPerson(deliveryPersonId: Int!): [Delivery!]!
  deliveriesByStatus(status: DeliveryStatus!): [Delivery!]!
}
```

### Mutations

```graphql
type Mutation {
  # Entregadores
  createDeliveryPerson(input: CreateDeliveryPersonInput!): DeliveryPerson!
  updateDeliveryPerson(id: Int!, input: UpdateDeliveryPersonInput!): DeliveryPerson!
  updateDeliveryPersonStatus(id: Int!, status: DeliveryPersonStatus!): DeliveryPerson!
  updateDeliveryPersonLocation(id: Int!, latitude: Float!, longitude: Float!): DeliveryPerson!
  
  # Entregas
  createDelivery(input: CreateDeliveryInput!): Delivery!
  assignDelivery(deliveryId: Int!, deliveryPersonId: Int!): Delivery!
  updateDeliveryStatus(id: Int!, status: DeliveryStatus!): Delivery!
  cancelDelivery(id: Int!, reason: String): Delivery!
}
```

### Tipos

```graphql
type DeliveryPerson {
  id: Int!
  name: String!
  email: String!
  phone: String!
  cpf: String!
  vehicleType: VehicleType!
  licensePlate: String
  status: DeliveryPersonStatus!
  rating: Float!
  totalDeliveries: Int!
  
  currentLatitude: Float
  currentLongitude: Float
  lastLocationUpdate: DateTime
  
  isActive: Boolean!
  joinedAt: DateTime!
  deliveries: [Delivery!]!
}

type Delivery {
  id: Int!
  orderId: Int!
  deliveryPersonId: Int
  deliveryPerson: DeliveryPerson
  
  status: DeliveryStatus!
  
  customerLatitude: Float!
  customerLongitude: Float!
  customerAddress: String!
  
  assignedAt: DateTime
  pickedUpAt: DateTime
  deliveredAt: DateTime
  cancelledAt: DateTime
  
  estimatedDeliveryTime: Int
  actualDeliveryTime: Int
  
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum DeliveryPersonStatus {
  AVAILABLE
  BUSY
  OFFLINE
  ON_BREAK
}

enum VehicleType {
  BIKE
  MOTORCYCLE
  CAR
  SCOOTER
  WALKING
}

enum DeliveryStatus {
  PENDING
  ASSIGNED
  PICKED_UP
  IN_TRANSIT
  DELIVERED
  CANCELLED
  FAILED
}
```

## API gRPC

### Serviços Expostos

```protobuf
service DeliveryService {
  // Criar entrega quando pedido é confirmado
  rpc CreateDelivery (CreateDeliveryRequest) returns (Delivery);
  
  // Buscar entrega por ID do pedido
  rpc FindByOrder (FindByOrderRequest) returns (Delivery);
  
  // Atualizar status da entrega
  rpc UpdateStatus (UpdateStatusRequest) returns (Delivery);
  
  // Atribuir entregador automaticamente
  rpc AssignDelivery (AssignDeliveryRequest) returns (Delivery);
}

service DeliveryPersonService {
  // Buscar entregadores disponíveis
  rpc FindAvailable (Empty) returns (DeliveryPersonsResponse);
  
  // Atualizar localização do entregador
  rpc UpdateLocation (UpdateLocationRequest) returns (DeliveryPerson);
}
```

### Consumidores

- **msorders**: Cria entrega quando pedido é confirmado
- **mstracking**: Busca dados da entrega para rastreamento
- **msnotifications**: Obtém informações para notificar status

## Algoritmo de Atribuição de Entregas

O sistema usa um algoritmo simples mas eficaz para atribuir entregas:

```typescript
async assignBestDeliveryPerson(delivery: Delivery): Promise<DeliveryPerson> {
  // 1. Buscar entregadores disponíveis
  const available = await this.findAvailableDeliveryPersons();
  
  if (available.length === 0) {
    throw new Error('No delivery persons available');
  }
  
  // 2. Calcular scores baseado em:
  const scores = available.map(person => ({
    person,
    score: this.calculateScore(person, delivery)
  }));
  
  // 3. Ordenar por score e retornar o melhor
  scores.sort((a, b) => b.score - a.score);
  
  return scores[0].person;
}

private calculateScore(person: DeliveryPerson, delivery: Delivery): number {
  let score = 0;
  
  // Rating do entregador (peso 40%)
  score += person.rating * 0.4;
  
  // Proximidade (peso 40%)
  if (person.currentLatitude && person.currentLongitude) {
    const distance = this.calculateDistance(
      person.currentLatitude, 
      person.currentLongitude,
      delivery.customerLatitude,
      delivery.customerLongitude
    );
    score += (1 / (1 + distance)) * 0.4;
  }
  
  // Tipo de veículo (peso 20%)
  const vehicleScore = {
    MOTORCYCLE: 1.0,
    CAR: 0.8,
    BIKE: 0.6,
    SCOOTER: 0.5,
    WALKING: 0.3
  };
  score += vehicleScore[person.vehicleType] * 0.2;
  
  return score;
}
```

## Integração com MS Routing

Para cada entrega atribuída, o serviço solicita a melhor rota:

```typescript
async calculateRoute(delivery: Delivery): Promise<Route> {
  // Buscar localização do entregador
  const person = await this.findDeliveryPerson(delivery.deliveryPersonId);
  
  // Chamar msrouting via gRPC
  const route = await this.routingClient.calculateRoute({
    origin: {
      latitude: person.currentLatitude,
      longitude: person.currentLongitude
    },
    destination: {
      latitude: delivery.customerLatitude,
      longitude: delivery.customerLongitude
    },
    strategy: 'FASTEST', // ou SHORTEST, ECONOMICAL, ECO_FRIENDLY
    vehicleType: person.vehicleType
  });
  
  return route;
}
```

## Configuração

### Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db_delivery"

# Server
PORT=3003
GRAPHQL_PATH=/graphql

# gRPC
GRPC_PORT=50053

# Microservices
GRPC_ROUTING_URL=localhost:50054
GRPC_TRACKING_URL=localhost:50055
GRPC_NOTIFICATIONS_URL=localhost:50052
```

### Instalação

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
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
- GraphQL: http://localhost:3003/graphql
- gRPC: localhost:50053

## Exemplos de Uso

### Cadastrar Entregador

```graphql
mutation {
  createDeliveryPerson(input: {
    name: "Carlos Silva"
    email: "carlos@delivery.com"
    phone: "11988887777"
    cpf: "12345678900"
    vehicleType: MOTORCYCLE
    licensePlate: "ABC-1234"
  }) {
    id
    name
    status
    rating
  }
}
```

### Atualizar Localização

```graphql
mutation {
  updateDeliveryPersonLocation(
    id: 1
    latitude: -23.5505
    longitude: -46.6333
  ) {
    id
    currentLatitude
    currentLongitude
    lastLocationUpdate
  }
}
```

### Atribuir Entrega

```graphql
mutation {
  assignDelivery(
    deliveryId: 1
    deliveryPersonId: 1
  ) {
    id
    status
    deliveryPerson {
      name
      vehicleType
    }
    estimatedDeliveryTime
  }
}
```

### Atualizar Status da Entrega

```graphql
mutation {
  updateDeliveryStatus(
    id: 1
    status: IN_TRANSIT
  ) {
    id
    status
    pickedUpAt
  }
}
```

## Fluxo de Uma Entrega

```
1. msorders cria pedido confirmado
2. msorders chama gRPC createDelivery
3. msdelivery cria registro de entrega (status: PENDING)
4. msdelivery atribui entregador automaticamente:
   a. Busca entregadores disponíveis
   b. Calcula score de cada um
   c. Atribui ao melhor
5. msdelivery chama msrouting para calcular rota
6. msdelivery atualiza status para ASSIGNED
7. msnotifications notifica entregador
8. Entregador atualiza localização periodicamente
9. mstracking monitora progresso
10. Entregador atualiza status para PICKED_UP
11. Entregador atualiza status para IN_TRANSIT
12. Entregador atualiza status para DELIVERED
13. msnotifications notifica cliente
```

## Regras de Negócio

1. **CPF único**: Cada entregador tem CPF único
2. **Email e telefone únicos**: Não pode haver duplicatas
3. **Placa única**: Para veículos motorizados
4. **Status automático**: Quando entrega é atribuída, entregador fica BUSY
5. **Localização obrigatória**: Entregador deve ter localização para receber entregas
6. **Rating**: Calculado baseado em avaliações de entregas
7. **Uma entrega por vez**: Entregador BUSY não recebe novas entregas
8. **Timeout**: Entregas PENDING por mais de 30min são canceladas

## Testes

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## Monitoramento

```typescript
this.logger.log('Delivery assigned', {
  deliveryId: delivery.id,
  deliveryPersonId: person.id,
  estimatedTime: route.estimatedTime
});
```


## Troubleshooting

### Nenhum entregador disponível

```bash
# Verificar entregadores no banco
npm run prisma:studio

# Popular dados de teste
npm run seed
```

### Erro ao calcular rota

Verificar se msrouting está rodando:

```bash
# Testar conexão gRPC
grpcurl -plaintext localhost:50054 list
```

### Localização não atualiza

Verificar se campos latitude/longitude estão sendo enviados:

```graphql
mutation {
  updateDeliveryPersonLocation(
    id: 1
    latitude: -23.5505  # Verificar se valores são válidos
    longitude: -46.6333
  ) {
    lastLocationUpdate  # Deve ser atualizado
  }
}
```
