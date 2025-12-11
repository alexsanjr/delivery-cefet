# MS Routing - Microserviço de Roteamento

Microserviço responsável pelo cálculo de rotas otimizadas para entregas.

## Sobre o Projeto

Este serviço foi desenvolvido aplicando **Domain-Driven Design (DDD)** e **Arquitetura Hexagonal**, garantindo código limpo, manutenível e testável.

## Responsabilidades

- Cálculo de rotas entre dois pontos
- Múltiplos algoritmos de otimização
- Cache de rotas calculadas
- Estimativa de tempo e distância
- Consideração de tipo de veículo
- Integração com APIs externas de mapas

## Tecnologias Utilizadas

- **NestJS**: Framework principal
- **TypeScript**: Linguagem de programação
- **gRPC**: Comunicação exclusiva via gRPC
- **Redis**: Cache de rotas
- **Axios**: Cliente HTTP para APIs de mapas
- **IORedis**: Cliente Redis

## Arquitetura

O projeto segue uma estrutura em camadas bem definida:

### Domain (Domínio)
Contém toda a lógica de negócio e regras do sistema. É independente de frameworks e tecnologias.

- **Entities**: Rota (aggregate root), Ponto, PassoRota
- **Value Objects**: Coordenada, Distancia, Duracao com validações integradas
- **Repository Interfaces**: Contratos para persistência e APIs externas
- **Domain Services**: CalculadorCustos para lógica de negócio complexa

### Application (Aplicação)
Orquestra a lógica de negócio através de casos de uso específicos.

- **Use Cases**: CalcularRotaCasoDeUso, CalcularETACasoDeUso
- **DTOs**: Objetos para transferência de dados entre camadas
- **Mappers**: Conversão entre entidades de domínio e DTOs

### Infrastructure (Infraestrutura)
Implementações concretas de tecnologias e frameworks.

- **Persistence**: Repositório Redis para cache de rotas
- **External**: Adapter para Geoapify API (com fallback mock)

### Presentation (Apresentação)
Adapters que expõem a aplicação para o mundo externo.

- **gRPC**: Controller que expõe os use cases via gRPC

## Estrutura do Projeto

```
msrouting/
├── src/
│   ├── domain/                     # Camada de Domínio (Core)
│   │   ├── entities/
│   │   │   ├── rota.entity.ts     # Aggregate Root
│   │   │   └── ponto.entity.ts
│   │   ├── value-objects/
│   │   │   ├── coordenada.vo.ts
│   │   │   ├── distancia.vo.ts
│   │   │   └── duracao.vo.ts
│   │   ├── repositories/           # Ports (Interfaces)
│   │   │   ├── rota.repository.interface.ts
│   │   │   ├── api-mapas.interface.ts
│   │   │   └── injection-tokens.ts
│   │   └── services/
│   │       └── calculador-custos.service.ts
│   │
│   ├── application/                # Camada de Aplicação
│   │   ├── use-cases/
│   │   │   ├── calcular-rota.use-case.ts
│   │   │   └── calcular-eta.use-case.ts
│   │   ├── dtos/
│   │   │   └── rota.dto.ts
│   │   ├── mappers/
│   │   │   └── rota.mapper.ts
│   │   └── application.module.ts
│   │
│   ├── infrastructure/             # Camada de Infraestrutura (Adapters)
│   │   ├── persistence/
│   │   │   └── redis-rota.repository.ts
│   │   ├── external/
│   │   │   └── geoapify-api.adapter.ts
│   │   └── infrastructure.module.ts
│   │
│   ├── presentation/               # Camada de Apresentação (Adapters)
│   │   └── grpc/
│   │       ├── routing-grpc.controller.ts
│   │       └── presentation-grpc.module.ts
│   │
│   ├── redis/                      # Módulos auxiliares
│   │   ├── redis.service.ts
│   │   └── redis.module.ts
│   │
│   ├── app.module.ts              # Módulo raiz
│   └── main.ts
│
├── proto/
│   └── routing.proto
└── package.json
```

## Modelo de Dados

### Route (DTO)

```typescript
export class Route {
  origin: Location;
  destination: Location;
  distance: number;          // em metros
  duration: number;          // em segundos
  estimatedCost: number;     // em R$
  steps: RouteStep[];
  polyline: string;          // Coordenadas codificadas
  strategy: RouteStrategy;
  vehicleType: VehicleType;
}

export class Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export class RouteStep {
  distance: number;
  duration: number;
  instruction: string;
  startLocation: Location;
  endLocation: Location;
}

export enum RouteStrategy {
  FASTEST = 'FASTEST',
  SHORTEST = 'SHORTEST',
  ECONOMICAL = 'ECONOMICAL',
  ECO_FRIENDLY = 'ECO_FRIENDLY'
}

export enum VehicleType {
  BIKE = 'BIKE',
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  SCOOTER = 'SCOOTER',
  WALKING = 'WALKING'
}
```

## API gRPC

### Serviços Expostos

```protobuf
service RoutingService {
  // Calcular rota entre dois pontos
  rpc CalculateRoute (CalculateRouteRequest) returns (RouteResponse);
  
  // Calcular múltiplas rotas (otimização de paradas)
  rpc CalculateMultipleRoutes (MultipleRoutesRequest) returns (MultipleRoutesResponse);
  
  // Estimar tempo de entrega
  rpc EstimateDeliveryTime (EstimateRequest) returns (EstimateResponse);
  
  // Calcular distância entre pontos
  rpc CalculateDistance (DistanceRequest) returns (DistanceResponse);
}
```

### Mensagens

```protobuf
message CalculateRouteRequest {
  Location origin = 1;
  Location destination = 2;
  string strategy = 3;  // FASTEST, SHORTEST, etc
  string vehicleType = 4;
  bool avoidTolls = 5;
  bool avoidHighways = 6;
}

message Location {
  double latitude = 1;
  double longitude = 2;
  string address = 3;
}

message RouteResponse {
  double distance = 1;      // metros
  int32 duration = 2;       // segundos
  double estimatedCost = 3; // R$
  string polyline = 4;
  repeated RouteStep steps = 5;
}
```

## Padrões de Projeto - Strategy Pattern

### Interface Comum

```typescript
export interface IRouteStrategy {
  calculateRoute(
    origin: Location,
    destination: Location,
    vehicleType: VehicleType
  ): Promise<Route>;
  
  getName(): string;
  getDescription(): string;
}
```

### Estratégias Implementadas

#### 1. Fastest Route Strategy

Prioriza tempo, pode usar vias expressas e com pedagio.

```typescript
@Injectable()
export class FastestRouteStrategy implements IRouteStrategy {
  constructor(private mapsApi: MapsApiService) {}

  async calculateRoute(
    origin: Location,
    destination: Location,
    vehicleType: VehicleType
  ): Promise<Route> {
    const route = await this.mapsApi.getRoute(origin, destination, {
      optimize: 'time',
      avoidTolls: false,
      avoidHighways: false,
      vehicleType
    });

    return this.transformToRoute(route, 'FASTEST');
  }

  getName(): string {
    return 'Fastest Route';
  }

  getDescription(): string {
    return 'Rota mais rápida, priorizando tempo de chegada';
  }
}
```

#### 2. Shortest Route Strategy

Minimiza distância percorrida.

```typescript
@Injectable()
export class ShortestRouteStrategy implements IRouteStrategy {
  async calculateRoute(
    origin: Location,
    destination: Location,
    vehicleType: VehicleType
  ): Promise<Route> {
    const route = await this.mapsApi.getRoute(origin, destination, {
      optimize: 'distance',
      avoidTolls: true,
      avoidHighways: false,
      vehicleType
    });

    return this.transformToRoute(route, 'SHORTEST');
  }

  getName(): string {
    return 'Shortest Route';
  }

  getDescription(): string {
    return 'Menor distância, ideal para economia de combustível';
  }
}
```

#### 3. Economical Route Strategy

Otimiza custo considerando combustível e pedágios.

```typescript
@Injectable()
export class EconomicalRouteStrategy implements IRouteStrategy {
  async calculateRoute(
    origin: Location,
    destination: Location,
    vehicleType: VehicleType
  ): Promise<Route> {
    const route = await this.mapsApi.getRoute(origin, destination, {
      optimize: 'distance',
      avoidTolls: true,       // Evita pedágios
      avoidHighways: true,    // Evita vias expressas
      vehicleType
    });

    // Calcula custo estimado
    const fuelCost = this.calculateFuelCost(route.distance, vehicleType);
    route.estimatedCost = fuelCost;

    return this.transformToRoute(route, 'ECONOMICAL');
  }

  private calculateFuelCost(distance: number, vehicleType: VehicleType): number {
    const fuelPricePerLiter = 5.50; // R$ por litro
    
    const consumption = {
      BIKE: 0,              // Sem custo
      SCOOTER: 0.02,        // 50 km/l
      MOTORCYCLE: 0.03,     // 33 km/l
      CAR: 0.10,            // 10 km/l
      WALKING: 0
    };

    const litersUsed = (distance / 1000) * consumption[vehicleType];
    return litersUsed * fuelPricePerLiter;
  }

  getName(): string {
    return 'Economical Route';
  }

  getDescription(): string {
    return 'Rota mais econômica, evita pedágios e minimiza consumo';
  }
}
```

#### 4. Eco-Friendly Route Strategy

Minimiza emissões de carbono.

```typescript
@Injectable()
export class EcoFriendlyStrategy implements IRouteStrategy {
  async calculateRoute(
    origin: Location,
    destination: Location,
    vehicleType: VehicleType
  ): Promise<Route> {
    const route = await this.mapsApi.getRoute(origin, destination, {
      optimize: 'eco',        // Modo eco se disponível
      avoidHighways: true,    // Velocidade constante
      vehicleType
    });

    // Calcula emissões de CO2
    const emissions = this.calculateEmissions(route.distance, vehicleType);
    route.co2Emissions = emissions;

    return this.transformToRoute(route, 'ECO_FRIENDLY');
  }

  private calculateEmissions(distance: number, vehicleType: VehicleType): number {
    // kg de CO2 por km
    const emissionsPerKm = {
      BIKE: 0,
      SCOOTER: 0.02,
      MOTORCYCLE: 0.05,
      CAR: 0.12,
      WALKING: 0
    };

    return (distance / 1000) * emissionsPerKm[vehicleType];
  }

  getName(): string {
    return 'Eco-Friendly Route';
  }

  getDescription(): string {
    return 'Rota sustentável, minimiza emissões de CO2';
  }
}
```

### Contexto

```typescript
@Injectable()
export class RoutingService {
  private strategies: Map<RouteStrategy, IRouteStrategy>;

  constructor(
    private fastestStrategy: FastestRouteStrategy,
    private shortestStrategy: ShortestRouteStrategy,
    private economicalStrategy: EconomicalRouteStrategy,
    private ecoFriendlyStrategy: EcoFriendlyStrategy,
    private cacheService: CacheService
  ) {
    this.strategies = new Map([
      [RouteStrategy.FASTEST, this.fastestStrategy],
      [RouteStrategy.SHORTEST, this.shortestStrategy],
      [RouteStrategy.ECONOMICAL, this.economicalStrategy],
      [RouteStrategy.ECO_FRIENDLY, this.ecoFriendlyStrategy],
    ]);
  }

  async calculateRoute(
    origin: Location,
    destination: Location,
    strategy: RouteStrategy,
    vehicleType: VehicleType
  ): Promise<Route> {
    // Verifica cache
    const cacheKey = this.buildCacheKey(origin, destination, strategy, vehicleType);
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Calcula rota usando estratégia
    const routeStrategy = this.strategies.get(strategy);
    const route = await routeStrategy.calculateRoute(origin, destination, vehicleType);

    // Armazena em cache (1 hora)
    await this.cacheService.set(cacheKey, route, 3600);

    return route;
  }
}
```

## Cache de Rotas

Rotas calculadas são armazenadas em cache para melhorar performance:

```typescript
@Injectable()
export class CacheService {
  constructor(@InjectRedis() private redis: Redis) {}

  private buildKey(
    origin: Location,
    destination: Location,
    strategy: RouteStrategy,
    vehicleType: VehicleType
  ): string {
    return `route:${origin.latitude}:${origin.longitude}:${destination.latitude}:${destination.longitude}:${strategy}:${vehicleType}`;
  }

  async get(key: string): Promise<Route | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(key: string, route: Route, ttl: number): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(route));
  }

  async clear(pattern: string): Promise<void> {
    const keys = await this.redis.keys(`route:${pattern}*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

## Cálculo de Distância

Usa fórmula de Haversine para distância entre coordenadas:

```typescript
export class DistanceCalculator {
  static calculate(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Raio da Terra em metros
    
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
  }
}
```

## Configuração

### Variáveis de Ambiente

```env
# Redis
REDIS_URL="redis://localhost:6379"

# Server
PORT=3004

# gRPC
GRPC_PORT=50054

# Maps API (Google Maps ou similar)
MAPS_API_KEY=your-api-key
MAPS_API_URL=https://maps.googleapis.com/maps/api

# Cache
CACHE_TTL=3600  # 1 hora
```

### Instalação

```bash
npm install
npm run start:dev
```

## Exemplos de Uso

### Via gRPC (de msdelivery)

```typescript
// No DeliveriesService
const route = await this.routingClient.calculateRoute({
  origin: {
    latitude: deliveryPerson.currentLatitude,
    longitude: deliveryPerson.currentLongitude
  },
  destination: {
    latitude: delivery.customerLatitude,
    longitude: delivery.customerLongitude
  },
  strategy: 'FASTEST',
  vehicleType: deliveryPerson.vehicleType,
  avoidTolls: false,
  avoidHighways: false
});

console.log(`Distância: ${route.distance}m`);
console.log(`Tempo estimado: ${route.duration}s`);
console.log(`Custo estimado: R$ ${route.estimatedCost}`);
```

## Integração com API Externa

```typescript
@Injectable()
export class MapsApiService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {}

  async getRoute(
    origin: Location,
    destination: Location,
    options: RouteOptions
  ): Promise<any> {
    const apiKey = this.configService.get('MAPS_API_KEY');
    
    const response = await this.httpService.get(
      `${this.configService.get('MAPS_API_URL')}/directions/json`,
      {
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          mode: this.getMode(options.vehicleType),
          avoid: this.getAvoid(options),
          key: apiKey
        }
      }
    ).toPromise();

    return this.parseResponse(response.data);
  }

  private getMode(vehicleType: VehicleType): string {
    const modes = {
      BIKE: 'bicycling',
      MOTORCYCLE: 'driving',
      CAR: 'driving',
      SCOOTER: 'bicycling',
      WALKING: 'walking'
    };
    return modes[vehicleType];
  }

  private getAvoid(options: RouteOptions): string {
    const avoid = [];
    if (options.avoidTolls) avoid.push('tolls');
    if (options.avoidHighways) avoid.push('highways');
    return avoid.join('|');
  }
}
```

## Fluxo de Cálculo de Rota

```
1. msdelivery solicita rota via gRPC
2. RoutingService recebe requisição
3. Verifica cache Redis
4. Se não em cache:
   a. Seleciona estratégia apropriada
   b. Estratégia chama API externa
   c. Transforma resposta em Route
   d. Armazena em cache
5. Retorna Route ao solicitante
```

## Regras de Negócio

1. **Cache**: Rotas são cacheadas por 1 hora
2. **Fallback**: Se API externa falhar, usa cálculo direto
3. **Timeout**: Requisições à API externa têm timeout de 5s
4. **Validação**: Coordenadas devem ser válidas
5. **Limite**: Máximo 100km de distância

## Testes

```bash
npm run test
npm run test:e2e
```

## Troubleshooting

### API externa não responde

```bash
# Verificar chave da API
echo $MAPS_API_KEY

# Testar endpoint
curl "https://maps.googleapis.com/maps/api/directions/json?..."
```

### Cache não funciona

```bash
# Verificar Redis
redis-cli ping

# Limpar cache
redis-cli flushall
```
