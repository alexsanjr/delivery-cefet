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

**Elementos principais:**
- Clientes e Entregadores como usuários
- Sistema de Delivery central
- Integrações externas: Pagamentos, Mapas, Email, SMS

### 2. Diagrama de Containers 

Detalha os containers (aplicações e bancos) que compõem o sistema.

**Elementos principais:**
- Kong Gateway como ponto de entrada
- 6 microserviços independentes
- 4 bancos de dados PostgreSQL isolados
- Redis para cache e filas
- Comunicação GraphQL e gRPC

**Observações técnicas:**
- Cada microserviço tem seu próprio banco de dados
- gRPC usado para comunicação síncrona entre serviços
- GraphQL usado para interface com clientes
- Redis compartilhado para cache

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
