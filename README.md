# Sistema de Delivery - CEFET

Este projeto implementa um sistema completo de delivery utilizando arquitetura de microserviços. O sistema foi desenvolvido como parte de um trabalho acadêmico focado em boas práticas de desenvolvimento, padrões de projeto e arquitetura distribuída.

## Visão Geral

O sistema é composto por seis microserviços independentes que se comunicam através de GraphQL e gRPC, coordenados por um API Gateway Kong. Cada serviço possui sua própria base de dados PostgreSQL, seguindo o princípio de isolamento de dados da arquitetura de microserviços.

### Funcionalidades Principais

- Cadastro e gerenciamento de clientes e endereços
- Criação e acompanhamento de pedidos
- Gestão de entregadores e suas disponibilidades
- Roteamento inteligente para otimizar entregas
- Rastreamento em tempo real das entregas
- Sistema de notificações para eventos importantes

## Arquitetura

O projeto segue uma arquitetura de microserviços onde cada serviço é responsável por um domínio específico do negócio:

```
┌─────────────────┐
│   Kong Gateway  │  (Porta 8000)
│   + Auth Service│
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────┐
│ GraphQL │ │   gRPC   │
│  Layer  │ │  Layer   │
└────┬────┘ └─────┬────┘
     │            │
     └────┬───────┘
          │
    ┌─────┴──────┐
    │            │
    ▼            ▼
Microserviços + Bancos de Dados
```

### Arquitetura Interna dos Microserviços

Cada microserviço segue a **Arquitetura Hexagonal** com **DDD**:

- **Domain (Núcleo)**: Entities, Value Objects, Aggregates, Domain Services
- **Application**: Use Cases, DTOs, Mappers
- **Infrastructure**: Repositories, Adapters externos (gRPC, REST)
- **Presentation**: GraphQL Resolvers, gRPC Controllers

**Benefícios**:
- Lógica de negócio independente de frameworks
- Facilita testes unitários do domínio
- Use Cases expressam intenções de negócio
- Troca de tecnologias sem impactar o núcleo

### Comunicação entre Serviços

**Síncrona (gRPC):**
- Buscar dados de outros serviços (ex: msorders busca cliente do mscustomers)
- Baixa latência
- Requisição/resposta imediata

**Assíncrona (RabbitMQ + Protobuf):**
- **Padrão**: Saga Coreografado (eventos)
- **Eventos**: OrderCreated, DeliveryAssigned, DeliveryDelivered
- **Garantias**: Entrega confiável, durabilidade, retry automático
- **Desacoplamento**: Serviços não precisam conhecer uns aos outros
- **Exemplo**: Quando pedido é criado → msdelivery cria entrega + msnotifications notifica cliente

Veja [ADR #13](docs/architecture/adr.md) para detalhes da implementação.



### Microserviços

1. **mscustomers** (Porta 3001)
   - Gerenciamento de clientes e endereços
   - Value Objects: Email, Telefone, CPF, CEP
   - Aggregate Root: Cliente
   - Expõe GraphQL e gRPC

2. **msorders** (Porta 3000) 
   - Gestão de pedidos e produtos
   - Aggregate Root: Order (Pedido)
   - Use Cases: CreateOrder, UpdateOrderStatus
   - Domain Events: OrderCreated, OrderStatusChanged
   - Expõe GraphQL e gRPC

3. **msdelivery** (Porta 3003)
   - Cadastro de entregadores e entregas
   - Entities: DeliveryPerson, Delivery
   - Value Objects: Location, Email, Phone, CPF
   - Use Cases: AssignDelivery, UpdateDeliveryStatus
   - Expõe GraphQL e gRPC

4. **msnotifications** (Porta 3002)
   - Envio de notificações assíncronas
   - Observer Pattern para múltiplos canais
   - Cache com Redis
   - Expõe GraphQL e gRPC

5. **msrouting** (Porta 3004)
   - Cálculo de rotas otimizadas
   - Aggregate Root: Rota
   - Value Objects: Coordenada, Distancia, Duracao
   - Strategy Pattern para algoritmos
   - Comunicação via gRPC

6. **mstracking** (Porta 3005)
   - Rastreamento em tempo real
   - Factory Method para entidades
   - WebSocket para atualizações live
   - Expõe GraphQL

### Infraestrutura

- **Kong Gateway**: API Gateway com autenticação JWT, rate limiting e CORS
- **PostgreSQL**: Banco de dados relacional para cada microserviço
- **Redis**: Cache para notificações e rotas
- **Docker**: Containerização dos serviços

## Tecnologias Utilizadas

### Backend
- **NestJS**: Framework principal para todos os microserviços
- **TypeScript**: Linguagem de programação
- **Prisma**: ORM para acesso ao banco de dados
- **GraphQL**: API para comunicação cliente-servidor
- **gRPC**: Comunicação entre microserviços
- **Apollo Server**: Servidor GraphQL

### Banco de Dados
- **PostgreSQL**: Banco de dados principal
- **Redis**: Cache e mensageria

### Mensageria
- **RabbitMQ**: Message broker para comunicação assíncrona
- **Protocol Buffers (Protobuf)**: Serialização de mensagens

### Infraestrutura
- **Kong**: API Gateway
- **Docker**: Containerização

### Testes
- **Jmeter**: Testes de escalabilidade e perfomance

## Estrutura do Projeto

```
delivery-cefet/
├── docs/                       # Documentação completa
│   ├── architecture/           # Decisões arquiteturais (ADRs, DDD, Padrões)
│   ├── c4-diagrams/           # Diagramas C4 em PlantUML
│   ├── microservices/         # Documentação detalhada de cada serviço
│   └── Performace/            # Relatórios JMeter e análises de performance
├── kong-gateway/              # Configuração do Kong Gateway
│   ├── kong/declarative/      # Configurações declarativas
│   ├── auth-service.js        # Serviço de autenticação JWT
│   └── docker-compose.yml     # Orquestração de containers
├── mscustomers/               # Microserviço de clientes (DDD + Hexagonal)
├── msorders/                  # Microserviço de pedidos (DDD + Hexagonal)
├── msdelivery/                # Microserviço de entregas (DDD + Hexagonal)
├── msnotifications/           # Microserviço de notificações (DDD + Hexagonal)
├── msrouting/                 # Microserviço de roteamento (DDD + Hexagonal)
├── mstracking/                # Microserviço de rastreamento (DDD + Hexagonal)
└── bff-delivery/              # Backend For Frontend (GraphQL Federation)
```

## Como Executar

### Pré-requisitos

- Node.js (v18 ou superior)
- Docker e Docker Compose
- PostgreSQL (se não usar Docker)
- Redis (se não usar Docker)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/alexsanjr/delivery-cefet.git
cd delivery-cefet
```

2. Instale as dependências de cada microserviço:
```bash
# Para cada pasta de microserviço
cd mscustomers
npm install
cd ..

cd msorders
npm install
cd ..

# Repita para os demais microserviços
```

3. Configure as variáveis de ambiente criando arquivos `.env` em cada microserviço:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"
PORT=3001
```

4. Execute as migrações do Prisma:
```bash
cd mscustomers
npx prisma migrate dev
cd ..

# Repita para os microserviços que usam Prisma
```

### Executando os Serviços

#### Opção 1: Usar Docker Compose 

```bash
cd kong-gateway
docker-compose up -d
```

#### Opção 2: Executar individualmente 

```bash
# Em terminais separados
cd mscustomers && npm run start:dev
cd msorders && npm run start:dev
cd msdelivery && npm run start:dev
cd msnotifications && npm run start:dev
cd msrouting && npm run start:dev
cd mstracking && npm run start:dev
```


### Executando o Kong Gateway no caso da execução de serviço da opção 2

```bash
cd kong-gateway
.\start-services.ps1  # Windows
# ou
./start-services.sh   # Linux/Mac
```

## Acessando os Serviços

Após iniciar todos os serviços, você pode acessar:

### GraphQL Playgrounds
- **mscustomers**: http://localhost:3001/graphql
- **msorders**: http://localhost:3000/graphql
- **msdelivery**: http://localhost:3003/graphql
- **msnotifications**: http://localhost:3002/graphql
- **mstracking**: http://localhost:3005/graphql

### Kong Gateway
- **API Gateway**: http://localhost:8000
- **Admin API**: http://localhost:8001
- **Auth Service**: http://localhost:3100/auth

### Exemplos de Requisições via Kong

```bash
# Login (obtém token JWT)
curl -X POST http://localhost:8000/auth \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'

# Consulta GraphQL via Kong
curl -X POST http://localhost:8000/customers \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ customers { id name email } }"}'
```

## Padrões de Projeto Implementados

### 1. Strategy Pattern (Comportamental)
Define família de algoritmos intercambiáveis para cálculos.
- **Localização**: `msorders/src/orders/strategies/`, `msrouting/src/strategies/`
- **Uso**: Cálculo de preços (básico, premium, expresso) e algoritmos de roteamento
- **Justificativa**: Diferentes tipos de clientes e urgências exigem cálculos distintos; fácil adicionar novas estratégias

### 2. Observer Pattern (Comportamental)
Notifica múltiplos interessados quando eventos ocorrem.
- **Localização**: `msnotifications/src/infrastructure/adapters/`, `mstracking/src/tracking/`
- **Uso**: Sistema de notificações multicanal e rastreamento em tempo real
- **Justificativa**: Um evento deve notificar vários canais (email, SMS, logs) sem acoplamento

### 3. Adapter Pattern (Estrutural)
Converte interfaces incompatíveis para trabalhar juntas.
- **Localização**: `msorders/src/infrastructure/adapters/`
- **Uso**: Integração com serviços externos via gRPC (routing, customers, notifications)
- **Justificativa**: Arquitetura hexagonal - camada de aplicação não deve depender de tecnologias específicas

### 4. Decorator Pattern (Estrutural)
Adiciona responsabilidades a objetos dinamicamente.
- **Localização**: `mscustomers/src/customers/repositories/`
- **Uso**: Repository com logging sem modificar implementação original
- **Justificativa**: Adicionar logging, métricas e auditoria respeitando Open/Closed Principle

### 5. Factory Method Pattern (Criacional)
Encapsula criação de objetos com validação.
- **Localização**: `mstracking/src/prisma/prisma.service.ts`
- **Uso**: Criação de entidades de tracking com validação de coordenadas geográficas
- **Justificativa**: Garantir que objetos complexos sejam criados de forma consistente e válida

Para detalhes completos, exemplos de código e justificativas, consulte a [documentação de padrões de projeto](docs/architecture/design-patterns.md).

## Decisões Arquiteturais

### Por que Microserviços?

A arquitetura de microserviços foi escolhida para:
- Permitir escalabilidade independente de cada serviço
- Facilitar manutenção e evolução separada
- Possibilitar uso de tecnologias diferentes quando necessário
- Aumentar resiliência do sistema

### Por que GraphQL?

GraphQL foi escolhido para a camada de cliente porque:
- Permite que clientes solicitem apenas os dados necessários
- Reduz over-fetching e under-fetching
- Fornece documentação automática da API
- Oferece melhor experiência de desenvolvimento

### Por que gRPC?

gRPC foi escolhido para comunicação entre microserviços porque:
- Oferece performance superior ao REST
- Suporta streaming bidirecional
- Possui tipagem forte com Protocol Buffers
- Ideal para comunicação servidor-servidor

### Por que Prisma?

Prisma foi escolhido como ORM porque:
- Type-safe em TypeScript
- Migrações automáticas
- Cliente gerado automaticamente
- Ótima integração com NestJS

Para mais detalhes sobre decisões arquiteturais, consulte [ADRs](docs/architecture/adr.md).

## Testes

### Testes Unitários e de Integração

Cada microserviço possui seus próprios testes:

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

### Testes de Performance (JMeter)

O sistema foi testado com **Apache JMeter** para validar escalabilidade horizontal e performance sob carga.

**Documentação completa:**
**[docs/Performace/](docs/Performace/)** 


## Documentação Adicional

### Arquitetura
- **[DDD e Arquitetura Hexagonal](docs/architecture/ddd-hexagonal.md)** - Implementação completa de Domain-Driven Design
- [Padrões de Projeto GoF](docs/architecture/design-patterns.md) - 5 padrões clássicos implementados
- [Decisões Arquiteturais (ADRs)](docs/architecture/adr.md) - Histórico de decisões técnicas
- [Kong Gateway](docs/architecture/kong-gateway.md) - Configuração e uso do API Gateway

### Diagramas e Modelagem
- [Diagramas C4](docs/c4-diagrams/) - Visualização da arquitetura (Context, Container, Component, Code)

### Microserviços
- [Documentação Geral](docs/microservices/) - Visão geral de cada microserviço
- Documentação específica: Ver README de cada pasta (mscustomers, msorders, etc.)

