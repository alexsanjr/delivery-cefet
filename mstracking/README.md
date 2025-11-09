# MS Tracking - Microserviço de Rastreamento

Microserviço responsável pelo rastreamento em tempo real das entregas.

## Responsabilidades

- Rastreamento de posição em tempo real
- Histórico de localizações
- Cálculo de ETA (Estimated Time of Arrival)
- WebSocket para atualizações live
- Notificações de proximidade
- Geofencing para zonas de entrega

## Tecnologias Utilizadas

- **NestJS**: Framework principal
- **TypeScript**: Linguagem
- **GraphQL**: API com subscriptions
- **gRPC**: Comunicação entre serviços
- **Prisma**: ORM
- **PostgreSQL**: Banco de dados
- **WebSocket**: Atualizações em tempo real

## Estrutura do Projeto

```
mstracking/
├── src/
│   ├── tracking/
│   │   ├── dto/
│   │   ├── tracking.service.ts
│   │   ├── tracking.resolver.ts
│   │   ├── tracking.gateway.ts    # WebSocket
│   │   └── tracking.module.ts
│   ├── grpc/
│   │   ├── tracking-grpc.service.ts
│   │   └── grpc.module.ts
│   ├── prisma/
│   │   └── prisma.service.ts
│   └── main.ts
└── package.json
```

## Modelo de Dados

### TrackingPoint

```prisma
model TrackingPoint {
  id               Int      @id @default(autoincrement())
  deliveryId       Int
  deliveryPersonId Int
  
  latitude  Float
  longitude Float
  accuracy  Float?  // Precisão em metros
  altitude  Float?
  speed     Float?  // km/h
  heading   Float?  // Direção (0-360)
  
  timestamp DateTime @default(now())
  
  @@index([deliveryId])
  @@index([deliveryPersonId])
  @@index([timestamp])
}
```

## API GraphQL

### Queries

```graphql
type Query {
  # Localização atual da entrega
  currentLocation(deliveryId: Int!): TrackingPoint
  
  # Histórico de localizações
  trackingHistory(deliveryId: Int!): [TrackingPoint!]!
  
  # ETA estimado
  estimatedArrival(deliveryId: Int!): ETAInfo
}
```

### Subscriptions

```graphql
type Subscription {
  # Atualização de localização em tempo real
  locationUpdated(deliveryId: Int!): TrackingPoint!
  
  # Notificação de proximidade
  deliveryNearby(deliveryId: Int!): ProximityAlert!
}
```

### Mutations

```graphql
type Mutation {
  # Registrar nova posição
  updateLocation(input: UpdateLocationInput!): TrackingPoint!
}
```

## WebSocket Gateway

```typescript
@WebSocketGateway({
  cors: { origin: '*' }
})
export class TrackingGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('trackDelivery')
  handleTrackDelivery(@MessageBody() deliveryId: number) {
    return this.trackingService.getCurrentLocation(deliveryId);
  }

  // Emitir atualização para todos os clientes
  emitLocationUpdate(deliveryId: number, location: TrackingPoint) {
    this.server
      .to(`delivery-${deliveryId}`)
      .emit('locationUpdate', location);
  }

  // Cliente entra na sala da entrega
  @SubscribeMessage('joinDelivery')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() deliveryId: number
  ) {
    client.join(`delivery-${deliveryId}`);
  }
}
```

## Cálculo de ETA

```typescript
@Injectable()
export class TrackingService {
  async calculateETA(deliveryId: number): Promise<ETAInfo> {
    const delivery = await this.getDelivery(deliveryId);
    const currentLocation = await this.getCurrentLocation(deliveryId);
    
    if (!currentLocation) {
      return null;
    }

    // Calcular distância restante
    const distance = DistanceCalculator.calculate(
      currentLocation.latitude,
      currentLocation.longitude,
      delivery.customerLatitude,
      delivery.customerLongitude
    );

    // Estimar velocidade média baseada em histórico
    const avgSpeed = await this.calculateAverageSpeed(deliveryId);
    
    // ETA em segundos
    const eta = (distance / 1000) / avgSpeed * 3600;

    return {
      distanceRemaining: distance,
      estimatedTimeSeconds: Math.round(eta),
      estimatedArrivalTime: new Date(Date.now() + eta * 1000),
      averageSpeed: avgSpeed
    };
  }

  private async calculateAverageSpeed(deliveryId: number): Promise<number> {
    const recentPoints = await this.prisma.trackingPoint.findMany({
      where: {
        deliveryId,
        timestamp: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Últimos 10min
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    if (recentPoints.length < 2) {
      return 30; // Velocidade padrão 30 km/h
    }

    // Calcula velocidade média entre pontos
    let totalSpeed = 0;
    for (let i = 1; i < recentPoints.length; i++) {
      const prev = recentPoints[i - 1];
      const curr = recentPoints[i];
      
      const distance = DistanceCalculator.calculate(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
      
      const timeDiff = (curr.timestamp.getTime() - prev.timestamp.getTime()) / 1000;
      const speed = (distance / timeDiff) * 3.6; // m/s para km/h
      
      totalSpeed += speed;
    }

    return totalSpeed / (recentPoints.length - 1);
  }
}
```

## Geofencing

Detecta quando entregador entra em zona de proximidade:

```typescript
@Injectable()
export class GeofencingService {
  private readonly PROXIMITY_RADIUS = 500; // 500 metros

  async checkProximity(location: TrackingPoint): Promise<boolean> {
    const delivery = await this.getDelivery(location.deliveryId);
    
    const distance = DistanceCalculator.calculate(
      location.latitude,
      location.longitude,
      delivery.customerLatitude,
      delivery.customerLongitude
    );

    if (distance <= this.PROXIMITY_RADIUS) {
      await this.notifyProximity(delivery);
      return true;
    }

    return false;
  }

  private async notifyProximity(delivery: Delivery) {
    // Notificar cliente via msnotifications
    await this.notificationsClient.send({
      userId: delivery.customerId,
      type: 'DELIVERY_NEARBY',
      message: 'Seu entregador está chegando!'
    });

    // Emitir via WebSocket
    this.trackingGateway.emitProximityAlert(delivery.id);
  }
}
```

## Configuração

### Variáveis de Ambiente

```env
DATABASE_URL="postgresql://user:password@localhost:5432/db_tracking"
PORT=3005
GRPC_PORT=50055
WEBSOCKET_PORT=3006
```

## Exemplos de Uso

### Cliente WebSocket (Frontend)

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3006');

// Entrar na sala da entrega
socket.emit('joinDelivery', deliveryId);

// Escutar atualizações
socket.on('locationUpdate', (location) => {
  console.log('Nova localização:', location);
  updateMapMarker(location.latitude, location.longitude);
});

// Escutar proximidade
socket.on('proximityAlert', (alert) => {
  console.log('Entregador próximo!');
  showNotification('Seu pedido está chegando!');
});
```

### Atualizar Localização via gRPC

```typescript
// No msdelivery quando entregador move
await this.trackingClient.updateLocation({
  deliveryId: delivery.id,
  deliveryPersonId: person.id,
  latitude: newLat,
  longitude: newLng,
  speed: speed,
  heading: heading
});
```

### Consultar ETA via GraphQL

```graphql
query {
  estimatedArrival(deliveryId: 1) {
    distanceRemaining
    estimatedTimeSeconds
    estimatedArrivalTime
    averageSpeed
  }
}
```

## Regras de Negócio

1. **Frequência**: Localização atualizada a cada 10-30 segundos
2. **Histórico**: Mantido por 30 dias
3. **Precisão**: Mínimo 50m de precisão
4. **Geofencing**: Alerta aos 500m do destino
5. **Privacy**: Histórico só visível durante entrega ativa


## Troubleshooting

### WebSocket não conecta

```bash
# Verificar porta
netstat -ano | findstr :3006

# Testar conexão
wscat -c ws://localhost:3006
```

### ETA impreciso

Verificar se há pontos de tracking suficientes no histórico recente.
