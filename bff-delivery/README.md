# BFF Delivery

Backend For Frontend (BFF) service para msdelivery. Este serviço traduz requisições GraphQL do frontend para chamadas gRPC internas ao msdelivery.

## Arquitetura

```
Frontend → Kong Gateway → BFF (GraphQL) → msdelivery (gRPC)
```

## Propósito

O BFF implementa a separação de protocolos recomendada:
- **Frontend**: Comunica via GraphQL para facilitar queries flexíveis
- **Microserviços internos**: Comunicam via gRPC para performance e type safety

Isso evita o acoplamento de múltiplos protocolos em um único microserviço.

## Desenvolvimento

```bash
npm install
npm run start:dev
```

## GraphQL Playground

Acesse http://localhost:3006/graphql

## Queries e Mutations

### Queries

```graphql
query {
  getDeliveryPerson(deliveryPersonId: "uuid") {
    id
    name
    status
    vehicleType
  }
  
  findAvailableDeliveryPersons(input: {
    latitude: -23.5505
    longitude: -46.6333
    radiusKm: 5.0
    vehicleType: "MOTORCYCLE"
  }) {
    id
    name
    vehicleType
  }
  
  getDeliveryByOrder(orderId: "uuid") {
    id
    status
    deliveryPerson {
      name
    }
  }
  
  getActiveDeliveries {
    id
    orderId
    status
  }
}
```

### Mutations

```graphql
mutation {
  updateDeliveryPersonStatus(input: {
    deliveryPersonId: "uuid"
    status: "AVAILABLE"
  }) {
    id
    status
  }
  
  updateDeliveryPersonLocation(input: {
    deliveryPersonId: "uuid"
    latitude: -23.5505
    longitude: -46.6333
    speed: 30.5
    heading: 180.0
    accuracy: 10.0
  }) {
    id
    currentLatitude
    currentLongitude
  }
}
```

## Docker

```bash
docker build -t bff-delivery .
docker run -p 3006:3006 \
  -e DELIVERY_GRPC_URL=msdelivery:50056 \
  bff-delivery
```
