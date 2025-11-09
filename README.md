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

### Microserviços

1. **mscustomers** (Porta 3001)
   - Gerenciamento de clientes e endereços
   - Suporte a clientes premium
   - Expõe GraphQL e gRPC

2. **msorders** (Porta 3000)
   - Gestão de pedidos e produtos
   - Cálculo de preços com diferentes estratégias
   - Estimativa de tempo de entrega
   - Expõe GraphQL e gRPC

3. **msdelivery** (Porta 3003)
   - Cadastro de entregadores
   - Atribuição de entregas
   - Controle de status e localização
   - Expõe GraphQL e gRPC

4. **msnotifications** (Porta 3002)
   - Envio de notificações assíncronas
   - Cache com Redis
   - Suporta múltiplos canais
   - Expõe GraphQL e gRPC

5. **msrouting** (Porta 3004)
   - Cálculo de rotas otimizadas
   - Múltiplos algoritmos de roteamento
   - Cache de rotas calculadas
   - Comunicação via gRPC

6. **mstracking** (Porta 3005)
   - Rastreamento em tempo real
   - Histórico de posições
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

### Infraestrutura
- **Kong**: API Gateway
- **Docker**: Containerização

## Estrutura do Projeto

```
delivery-cefet/
├── docs/                       # Documentação completa
│   ├── architecture/           # Decisões arquiteturais
│   ├── c4-diagrams/           # Diagramas C4 em PlantUML
│   └── microservices/         # Documentação individual
├── kong-gateway/              # Configuração do Kong
│   ├── kong/declarative/      # Configurações declarativas
│   └── auth-service.js        # Serviço de autenticação
├── mscustomers/               # Microserviço de clientes
├── msorders/                  # Microserviço de pedidos
├── msdelivery/                # Microserviço de entregas
├── msnotifications/           # Microserviço de notificações
├── msrouting/                 # Microserviço de roteamento
├── mstracking/                # Microserviço de rastreamento
└── start-all-services.ps1     # Script para iniciar serviços
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

O projeto implementa diversos padrões de projeto para garantir código limpo, manutenível e escalável:

### 1. Strategy Pattern
Utilizado para diferentes estratégias de cálculo de preços e roteamento.
- **Localização**: `msorders/src/orders/strategies/`
- **Uso**: Cálculo de preços (básico, premium, expresso)

### 2. Repository Pattern
Abstração da camada de acesso a dados.
- **Localização**: Múltiplos microserviços
- **Uso**: Isolamento da lógica de persistência

### 3. Datasource Pattern
Separação da lógica de acesso a dados específicos.
- **Localização**: `msorders/src/orders/orders.datasource.ts`
- **Uso**: Queries específicas ao Prisma

### 4. Module Pattern
Organização modular do código.
- **Localização**: Todos os microserviços
- **Uso**: Encapsulamento de funcionalidades relacionadas

### 5. Dependency Injection
Injeção de dependências nativa do NestJS.
- **Localização**: Todo o projeto
- **Uso**: Desacoplamento e testabilidade

Para mais detalhes sobre os padrões implementados, consulte a [documentação de padrões de projeto](docs/architecture/design-patterns.md).

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

Cada microserviço possui seus próprios testes:

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

## Documentação Adicional

- [Diagramas C4](docs/c4-diagrams/) - Visualização da arquitetura em diferentes níveis
- [Padrões de Projeto](docs/architecture/design-patterns.md) - Detalhamento dos patterns utilizados
- [Decisões Arquiteturais](docs/architecture/adr.md) - ADRs das principais decisões
- [Microserviços](docs/microservices/) - Documentação detalhada de cada serviço

