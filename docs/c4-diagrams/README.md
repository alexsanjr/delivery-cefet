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
- **Administradores**: Gerenciam sistema, visualizam relatórios

**Sistema Central:**
- **Sistema de Delivery**: Plataforma completa de gerenciamento de entregas

**Sistemas Externos (Integrações):**
- **Serviço de Pagamentos** (ex: Stripe, PagSeguro): Processa pagamentos de pedidos
- **API de Mapas** (ex: Google Maps, Mapbox): Fornece cálculo de rotas e geocodificação
- **Serviço de Email** (SMTP): Envia notificações por email
- **Serviço de SMS** (ex: Twilio): Envia notificações por SMS
- **Banco de Dados PostgreSQL**: Armazenamento persistente (separado por microserviço)
- **Redis**: Cache e mensageria

**Fluxos principais:**
1. Cliente faz pedido → Sistema processa → Gateway de Pagamento
2. Sistema calcula rota → API de Mapas → Retorna melhor caminho
3. Sistema envia notificações → Email/SMS → Usuários recebem atualizações
4. Entregador atualiza posição → Sistema rastreia → Cliente visualiza em tempo real

### 2. Diagrama de Containers 

Detalha os containers (aplicações, bancos de dados e sistemas externos) que compõem o sistema.

**Ponto de Entrada:**
- **Kong Gateway** (Porta 8000): API Gateway com autenticação JWT, rate limiting, CORS
- **Auth Service** (Node.js): Serviço de autenticação integrado ao Kong

**Microserviços (Backend):**
- **mscustomers** (NestJS - Porta 3001): Gerencia clientes e endereços
- **msorders** (NestJS - Porta 3000): Gerencia pedidos e produtos
- **msdelivery** (NestJS - Porta 3003): Gerencia entregas e entregadores
- **msnotifications** (NestJS - Porta 3002): Envia notificações multicanal
- **msrouting** (NestJS - Porta 3004): Calcula rotas otimizadas
- **mstracking** (NestJS - Porta 3005): Rastreamento em tempo real

**Armazenamento de Dados:**
- **db_customers** (PostgreSQL): Banco isolado do mscustomers
- **db_orders** (PostgreSQL): Banco isolado do msorders
- **db_delivery** (PostgreSQL): Banco isolado do msdelivery
- **db_tracking** (PostgreSQL): Banco isolado do mstracking
- **Redis**: Cache compartilhado (notificações, rotas)

**Aplicações Cliente:**
- **Web Application** (React/Angular): Interface web para clientes
- **Admin Panel** (React/Angular): Painel administrativo
- **Mobile App** (React Native/Flutter): Aplicativo móvel

**Sistemas Externos Integrados:**
- **API Google Maps/Mapbox**: msrouting chama para cálculo de rotas
- **SMTP Server** (Gmail/SendGrid): msnotifications envia emails
- **SMS Gateway** (Twilio): msnotifications envia SMS
- **Payment Gateway** (Stripe/PagSeguro): msorders processa pagamentos

**Protocolos de Comunicação:**
- **Cliente → Kong**: HTTPS/GraphQL
- **Kong → Microserviços**: HTTP/GraphQL
- **Microserviços ↔ Microserviços**: gRPC (binário, alta performance)
- **Microserviços → Sistemas Externos**: HTTPS/REST
- **mstracking → Clientes**: WebSocket (tempo real)

**Observações técnicas:**
- Database per Service pattern: cada microserviço tem banco isolado
- gRPC para comunicação inter-serviços (performance)
- GraphQL para interface com clientes (flexibilidade)
- Redis compartilhado apenas para cache, não para dados críticos
- Kong como single point of entry (segurança centralizada)

### 3. Diagramas de Componentes

Detalhamos a estrutura interna de cada microserviço mostrando seus componentes, padrões implementados e interações.

**Microserviço de Clientes**

Gerencia clientes e seus endereços.

**Elementos principais:**
- GraphQL e gRPC APIs
- Resolvers para Customers e Addresses
- Services com lógica de negócio
- Datasources com Prisma
- Suporte a clientes premium

**Microserviço de Pedidos**

Gerencia pedidos e produtos com cálculo inteligente de preços.

**Elementos principais:**
- GraphQL e gRPC APIs
- Strategy Pattern para cálculo de preços (Básico, Premium, Expresso)
- DataLoader para otimização de queries
- Integração com outros serviços via gRPC

**Padrões implementados:**
- Strategy Pattern (cálculo de preços)
- Repository Pattern (datasource)
- DataLoader Pattern (cache de N+1 queries)

**Microserviço de Entregas**

Gerencia entregas e entregadores com sistema de atribuição.

**Elementos principais:**
- GraphQL e gRPC APIs
- Resolvers para Deliveries e DeliveryPersons
- Assignment Service para atribuir entregadores
- Integração com Routing e Notifications
- Gerenciamento de disponibilidade de entregadores

**Microserviço de Roteamento**

Calcula rotas otimizadas com múltiplos algoritmos.

**Elementos principais:**
- Múltiplos algoritmos de roteamento
- Strategy Pattern para seleção de rota
- Cache Redis para rotas calculadas
- Integração com API externa de mapas

**Estratégias de roteamento:**
- Fastest Route: Prioriza tempo
- Shortest Route: Prioriza distância
- Economical Route: Otimiza custos
- Eco-Friendly Route: Reduz emissões

**Microserviço de Notificações**

Envia notificações através de múltiplos canais.

**Elementos principais:**
- GraphQL e gRPC APIs
- Múltiplos serviços de envio (Email, SMS, Push)
- Cache Redis para notificações recentes
- Histórico de notificações em PostgreSQL
- TypeORM como ORM

**Canais suportados:**
- Email (SMTP)
- SMS
- Push Notifications

**Microserviço de Rastreamento**

Rastreia entregas em tempo real.

**Elementos principais:**
- GraphQL API com Subscriptions
- WebSocket Gateway para tempo real
- Event Emitter para notificações
- Histórico completo de posições
- Location Service

**Funcionalidades:**
- Atualização em tempo real via WebSocket
- GraphQL Subscriptions
- Histórico de posições
- Eventos de atualização

### 4. Diagrama de Código 

Mostra as principais classes e seus relacionamentos em todos os microserviços.

**Elementos principais:**
- Entities e DTOs de cada serviço
- Interfaces dos Strategy Patterns
- Services e suas dependências
- Relacionamentos entre classes

**Padrões de código documentados:**
- Strategy Pattern (Orders e Routing)
- Dependency Injection
- Service Layer Pattern
- Repository Pattern
