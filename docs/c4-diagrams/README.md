# Diagramas C4 - Sistema de Delivery

Esta pasta contém os diagramas C4 (Context, Container, Component, Code) que documentam a arquitetura do sistema em diferentes níveis de abstração.

## O que é C4?

O modelo C4 é uma técnica de visualização de arquitetura de software que divide a documentação em quatro níveis:
1. **Context** - Visão geral do sistema e seus usuários
2. **Container** - Aplicações e armazenamento de dados
3. **Component** - Componentes dentro de cada container
4. **Code** - Classes e implementação

## Diagramas Disponíveis

### 1. Diagrama de Contexto 

Mostra o sistema de delivery como uma caixa preta, focando nos usuários e sistemas externos com os quais ele interage.

**Atores/Usuários:**
- **Clientes**: Fazem pedidos e acompanham entregas via aplicativo mobile/web
- **Entregadores**: Recebem e realizam entregas, atualizam status

**Sistema Central:**
- **Sistema de Delivery**: Plataforma completa de gerenciamento de entregas

**Sistemas Externos (Integrações):**
- **Geoapify API**: Serviço de geocodificação e cálculo de rotas usado pelo msrouting
- **Nominatim API**: Serviço alternativo de geocodificação usado pelo msdelivery
- **PostgreSQL**: Armazenamento persistente para 4 microserviços (mscustomers, msorders, msdelivery, mstracking)
- **Redis**: Cache para msrouting e armazenamento para msnotifications
- **RabbitMQ**: Mensageria assíncrona para comunicação entre todos os microserviços

**Fluxos principais:**
1. Cliente faz pedido → Sistema processa → Armazena no PostgreSQL
2. Sistema calcula rota → Geoapify API → Retorna melhor caminho e cacheia no Redis
3. Sistema publica eventos → RabbitMQ → Microserviços consomem e processam
4. Entregador atualiza posição → mstracking armazena → Cliente visualiza em tempo real

### 2. Diagrama de Containers 

Detalha os containers (aplicações, bancos de dados e sistemas externos) que compõem o sistema.

**Ponto de Entrada:**
- **Kong Gateway** (Porta 8000): API Gateway com autenticação JWT, rate limiting, CORS
- **Auth Service** (Node.js + Express): Serviço de autenticação integrado ao Kong (apenas JWT, sem Redis)

**BFF (Backend for Frontend):**
- **bff-delivery** (NestJS - Porta 4000): Agregador de dados para o frontend, conecta apenas ao msdelivery

**Microserviços (Backend):**
- **mscustomers** (NestJS - Porta 3001): Gerencia clientes e endereços (DDD + Hexagonal + Prisma)
- **msorders** (NestJS - Porta 3000): Gerencia pedidos com Strategy Pattern para preços (DDD + Hexagonal + Prisma)
- **msdelivery** (NestJS - Porta 3003): Gerencia entregas e entregadores, integra com Nominatim API (DDD + Hexagonal + Prisma)
- **msrouting** (NestJS - Porta 3004): Calcula rotas com Geoapify API (DDD + Hexagonal + Redis)
- **msnotifications** (NestJS - Porta 3002): Observer Pattern para notificações (Redis)
- **mstracking** (NestJS - Porta 3005): Rastreamento em tempo real com Observer Pattern (TypeORM + PostgreSQL)

**Armazenamento de Dados:**
- **db_customers** (PostgreSQL): Banco isolado do mscustomers
- **db_orders** (PostgreSQL): Banco isolado do msorders
- **db_delivery** (PostgreSQL): Banco isolado do msdelivery
- **db_tracking** (PostgreSQL): Banco isolado do mstracking
- **Redis**: Cache para msrouting, armazenamento para msnotifications

**Sistemas Externos Integrados:**
- **Geoapify API**: msrouting usa para cálculo de rotas e geocodificação
- **Nominatim API**: msdelivery usa para geocodificação de endereços
- **RabbitMQ**: Message broker para comunicação assíncrona entre todos os microserviços

**Protocolos de Comunicação:**
- **BFF → msdelivery**: gRPC (comunicação síncrona)
- **msorders ↔ mscustomers/msrouting/mstracking/msnotifications**: gRPC (chamadas síncronas)
- **msdelivery → msorders**: gRPC (busca dados de pedidos)
- **mstracking ↔ msorders/msrouting/msnotifications**: gRPC (integração de rastreamento)
- **Todos os microserviços → RabbitMQ**: Pub/Sub (comunicação assíncrona de eventos)
- **msrouting → Geoapify API**: HTTPS/REST
- **msdelivery → Nominatim API**: HTTPS/REST

**Observações técnicas:**
- Database per Service pattern: 4 bancos PostgreSQL isolados (customers, orders, delivery, tracking)
- msrouting e msnotifications NÃO usam PostgreSQL (apenas Redis)
- gRPC para comunicação síncrona inter-serviços (performance)
- RabbitMQ para eventos assíncronos (desacoplamento)
- Redis como cache (msrouting) e storage (msnotifications)
- Kong como single point of entry (segurança centralizada)
- mstracking usa TypeORM em vez de Prisma

### 3. Diagramas de Componentes

Detalhamos a estrutura interna de cada microserviço mostrando seus componentes, padrões implementados e interações.

**Microserviço de Clientes (mscustomers)**

Gerencia clientes e seus endereços com arquitetura DDD + Hexagonal.

**Elementos principais:**
- **Application Layer**: 8 use cases (CreateCustomer, UpdateCustomer, GetCustomer, GetAllCustomers, DeleteCustomer, AddAddress, UpdateAddress, RemoveAddress)
- **Domain Layer**: Agregado Cliente, Entidade Endereco, Value Objects (Email, PostalCode)
- **Infrastructure Layer**: Prisma Repository, RabbitMQ Publisher
- **Presentation Layer**: gRPC Controller

**Padrão Planejado:**
- **Decorator Pattern**: Adicionar funcionalidades extras aos clientes (Premium, VIP)

**Microserviço de Pedidos (msorders)**

Gerencia pedidos e produtos com cálculo inteligente de preços usando Strategy Pattern.

**Elementos principais:**
- **Application Layer**: Services para Orders e Products, CQRS Handlers
- **Domain Layer**: Agregado Order, Entidades (OrderItem, Product), Value Objects (OrderAddress, Price)
- **Infrastructure Layer**: Prisma Repository, RabbitMQ Publisher, gRPC Clients (customers, routing, tracking, notifications)
- **Presentation Layer**: gRPC Controller

**Padrões implementados:**
- **Strategy Pattern**: Cálculo de preços com 3 estratégias (BasicPriceCalculator, PremiumPriceCalculator, ExpressPriceCalculator)
- **CQRS**: Separação de Commands e Queries
- **Repository Pattern**: Acesso a dados via Prisma

**Microserviço de Entregas (msdelivery)**

Gerencia entregas e entregadores com integração à API de geocodificação.

**Elementos principais:**
- **Application Layer**: Services para Deliveries e DeliveryPersons, Nominatim Service
- **Domain Layer**: Agregados Delivery e DeliveryPerson, Entidade Location
- **Infrastructure Layer**: Prisma Repository, RabbitMQ Consumer/Publisher, gRPC Client (orders), HTTP Client (Nominatim API)
- **Presentation Layer**: gRPC Controller

**Padrões implementados:**
- **Adapter Pattern**: NominatimApiAdapter para integração com API externa de geocodificação
- **Repository Pattern**: Acesso a dados via Prisma

**Microserviço de Roteamento (msrouting)**

Calcula rotas otimizadas usando API externa Geoapify com cache Redis.

**Elementos principais:**
- **Application Layer**: RoutingService para cálculo de rotas, Geoapify Service
- **Domain Layer**: Agregado Rota, Entidade Ponto, Value Objects (Coordenadas)
- **Infrastructure Layer**: Redis Cache Service, RabbitMQ Consumer, HTTP Client (Geoapify API)
- **Presentation Layer**: gRPC Controller

**Padrões implementados:**
- **Adapter Pattern**: GeoapifyApiAdapter para integração com API externa de mapas
- **Cache Pattern**: Redis para cachear rotas já calculadas

**Observação importante:**
- NÃO usa PostgreSQL, apenas Redis para cache e armazenamento temporário

**Microserviço de Notificações (msnotifications)**

Implementa Observer Pattern para notificar múltiplos observadores quando eventos ocorrem.

**Elementos principais:**
- **Application Layer**: Notification Service com Subject Adapter
- **Domain Layer**: Notification Ports (Subject e Observer)
- **Infrastructure Layer**: Redis Storage, RabbitMQ Consumer, Observers concretos (TerminalNotifierObserver, NotificationLoggerObserver)
- **Presentation Layer**: gRPC Controller

**Padrões implementados:**
- **Observer Pattern**: NotificationSubjectPort/Adapter notifica múltiplos NotificationObserverPort quando eventos de notificação são disparados

**Observação importante:**
- NÃO usa PostgreSQL, apenas Redis para armazenamento de notificações

**Microserviço de Rastreamento (mstracking)**

Rastreia posições de entregas em tempo real usando Observer Pattern.

**Elementos principais:**
- **Application Layer**: Position Service com Subject Adapter
- **Domain Layer**: Position Ports (Subject e Observer), Entidade DeliveryTracking
- **Infrastructure Layer**: TypeORM Repository, RabbitMQ Consumer, gRPC Clients (orders, routing, notifications), Observers concretos (PositionLoggerObserver)
- **Presentation Layer**: gRPC Controller

**Padrões implementados:**
- **Observer Pattern**: PositionSubjectPort/Adapter notifica múltiplos PositionObserverPort quando posição é atualizada

**Padrão Planejado:**
- **Factory Method**: Criar diferentes tipos de notificações (Email, SMS) via factories

**Observação importante:**
- Usa TypeORM em vez de Prisma para acesso ao PostgreSQL

### 4. Diagrama de Código 

Mostra as principais classes e seus relacionamentos em todos os 6 microserviços, incluindo os padrões implementados e planejados.

**MS Orders - Strategy Pattern:**
- Interface `IPriceCalculator` com 3 implementações (Basic, Premium, Express)
- Context `PriceCalculatorContext` que usa as estratégias
- Agregado `Order` com items e totalAmount

**MS Customers - Decorator Pattern (Planejado):**
- Interface `ICliente` 
- Decorador abstrato `ClienteDecorator`
- Decoradores concretos: `ClientePremiumDecorator`, `ClienteVipDecorator`
- Domain model: `Cliente`, `Endereco`, Value Objects (`Email`, `PostalCode`)

**MS Delivery - Adapter Pattern:**
- Agregados: `Delivery`, `DeliveryPerson`
- Value Object: `Location`
- Adapter: `OrdersGrpcAdapter` para integração com msorders

**MS Routing - Adapter Pattern:**
- Agregado `Rota` com composição de `Ponto[]`
- Interface `IGeoapifyService` e implementação `GeoapifyApiAdapter`
- `RedisService` para cache

**MS Notifications - Observer Pattern:**
- Ports: `NotificationSubjectPort`, `NotificationObserverPort`
- Adapter: `NotificationSubjectAdapter` que gerencia observers
- Observers concretos: `TerminalNotifierObserver`, `NotificationLoggerObserver`

**MS Tracking - Observer + Factory Method:**
- Observer Pattern: `PositionSubjectPort/Adapter` notifica `PositionObserverPort/PositionLoggerObserver`
- Factory Method (Planejado): `NotificationFactory` abstrata com factories concretas (`EmailNotificationFactory`, `SmsNotificationFactory`) que criam produtos `INotification` (`EmailNotification`, `SmsNotification`)


