# Microserviço de Clientes

Microserviço responsável pelo gerenciamento completo de clientes e endereços no sistema de delivery.

## Sobre o Projeto

Este serviço foi desenvolvido aplicando Domain-Driven Design (DDD) e Arquitetura Hexagonal, garantindo código limpo, manutenível e testável. A escolha por manter os nomes de métodos e variáveis em português busca facilitar o entendimento e manutenção por equipes brasileiras.

## Responsabilidades

- Cadastro e atualização de dados de clientes
- Gerenciamento de múltiplos endereços de entrega
- Controle de clientes premium
- Validação de dados (email, telefone, CPF, CEP)
- Comunicação com outros serviços via gRPC
- API GraphQL para consultas e mutações

## Arquitetura

O projeto segue uma estrutura em camadas bem definida:

### Domain (Domínio)
Contém toda a lógica de negócio e regras do sistema. É independente de frameworks e tecnologias.

- **Entities**: Cliente (aggregate root) e Endereço
- **Value Objects**: Email, Telefone, CPF e CEP com validações integradas
- **Repository Interfaces**: Contratos para persistência de dados

### Application (Aplicação)
Orquestra a lógica de negócio através de casos de uso específicos.

- **Use Cases**: Operações como criar cliente, adicionar endereço, etc.
- **DTOs**: Objetos para transferência de dados entre camadas
- **Mappers**: Conversão entre entidades de domínio e DTOs

### Infrastructure (Infraestrutura)
Implementações concretas de tecnologias e frameworks.

- **Persistence**: Repositórios usando Prisma ORM
- **Database**: PostgreSQL com migrations gerenciadas

### Presentation (Apresentação)
Adapters que expõem a aplicação para o mundo externo.

- **GraphQL**: API completa com queries e mutations
- **gRPC**: Comunicação entre microserviços

## Estrutura de Pastas

```
src/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/
│   └── services/
├── application/
│   ├── use-cases/
│   ├── dtos/
│   └── mappers/
├── infrastructure/
│   ├── persistence/
│   │   └── repositories/
│   └── prisma/
└── presentation/
    ├── graphql/
    │   ├── inputs/
    │   ├── types/
    │   ├── resolvers/
    │   └── graphql.module.ts
    └── grpc/
        ├── proto/
        ├── customers.grpc-service.ts
        └── grpc.module.ts
```

## Tecnologias

- **NestJS 11**: Framework para construção de aplicações Node.js escaláveis
- **TypeScript**: Tipagem estática para maior segurança
- **Prisma 6**: ORM moderno para acesso ao banco de dados
- **GraphQL**: API flexível e eficiente
- **gRPC**: Comunicação rápida entre microserviços
- **PostgreSQL**: Banco de dados relacional

## Configuração e Execução

### Pré-requisitos
- Node.js 18+
- PostgreSQL
- npm ou yarn

### Instalação

```bash
npm install
```

### Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/mscustomers"
```

### Migrations

```bash
# Executar migrations
npx prisma migrate dev

# Gerar Prisma Client
npx prisma generate
```

### Execução

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod
```

## Endpoints

### GraphQL
Disponível em `http://localhost:3000/graphql`

Exemplos de queries:

```graphql
# Buscar cliente por ID
query {
  cliente(id: 1) {
    id
    nome
    email
    telefone
    ehPremium
    enderecos {
      rua
      cidade
      estado
    }
  }
}

# Criar novo cliente
mutation {
  criarCliente(dados: {
    nome: "João Silva"
    email: "joao@email.com"
    telefone: "(11) 98765-4321"
  }) {
    id
    nome
  }
}
```

### gRPC
Porta: `50051`

Serviços disponíveis:
- `GetCustomer`: Busca cliente por ID
- `ValidateCustomer`: Valida se cliente existe

## Princípios Aplicados

### Domain-Driven Design
- Aggregate Roots para controlar consistência
- Value Objects para garantir validações
- Ubiquitous Language refletida no código

### Arquitetura Hexagonal
- Core independente de frameworks
- Ports (interfaces) definem contratos
- Adapters implementam tecnologias específicas

### SOLID
- Single Responsibility: cada classe tem uma responsabilidade
- Open/Closed: aberto para extensão, fechado para modificação
- Dependency Inversion: dependências apontam para abstrações

## Testes

```bash
# Testes unitários
npm run test

# Testes com coverage
npm run test:cov

# Testes e2e
npm run test:e2e
```

## Decisões Técnicas

### Por que DDD + Hexagonal?
A combinação dessas arquiteturas garante que a lógica de negócio fique isolada e protegida de mudanças tecnológicas. É possível trocar o Prisma por outro ORM ou o GraphQL por REST sem afetar as regras de negócio.

### Por que português nos métodos?
Para equipes brasileiras, usar a linguagem do negócio em português torna o código mais legível e próximo do domínio. Nomes de arquivos seguem padrões internacionais em inglês.

### Value Objects para validação
Ao encapsular validações em Value Objects, garantimos que dados inválidos nunca entrem no sistema. Um email só existe se for válido.

## Contribuindo

Este projeto segue padrões de commits convencionais. Exemplos:

```
feat(dominio): adiciona validação de CPF
fix(aplicacao): corrige busca de endereços
refactor(infra): melhora performance do repositório
```

## Licença

MIT

---

**Desenvolvido com foco em Clean Architecture e boas práticas de desenvolvimento**
│   │   └── prisma.service.ts
│   └── main.ts
├── package.json
└── README.md
```

## Modelo de Dados

### Customer (Cliente)

```prisma
model Customer {
  id        Int       @id @default(autoincrement())
  name      String
  email     String    @unique
  phone     String
  addresses Address[]
  isPremium Boolean   @default(false)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

**Campos principais:**
- `id`: Identificador único
- `name`: Nome completo do cliente
- `email`: Email único para login
- `phone`: Telefone de contato
- `isPremium`: Indica se é cliente premium (recebe benefícios)
- `addresses`: Relação com múltiplos endereços

### Address (Endereço)

```prisma
model Address {
  id           Int      @id @default(autoincrement())
  customerId   Int
  customer     Customer @relation(fields: [customerId], references: [id])
  street       String
  number       String
  neighborhood String
  city         String
  state        String
  zipCode      String
  complement   String?
  latitude     Float?
  longitude    Float?
  isPrimary    Boolean  @default(false)
  createdAt    DateTime @default(now())
}
```

**Campos principais:**
- Informações completas de endereço brasileiro
- `latitude`/`longitude`: Coordenadas para roteamento
- `isPrimary`: Define endereço padrão do cliente
- `complement`: Informações adicionais (apto, bloco, etc)

## API GraphQL

### Queries

```graphql
type Query {
  # Buscar todos os clientes
  customers: [Customer!]!
  
  # Buscar cliente por ID
  customer(id: Int!): Customer
  
  # Buscar cliente por email
  customerByEmail(email: String!): Customer
  
  # Buscar endereços de um cliente
  addressesByCustomer(customerId: Int!): [Address!]!
}
```

### Mutations

```graphql
type Mutation {
  # Criar novo cliente
  createCustomer(input: CreateCustomerInput!): Customer!
  
  # Atualizar dados do cliente
  updateCustomer(id: Int!, input: UpdateCustomerInput!): Customer!
  
  # Adicionar endereço ao cliente
  addAddress(customerId: Int!, input: CreateAddressInput!): Address!
  
  # Definir endereço como principal
  setPrimaryAddress(addressId: Int!): Address!
}
```

### Tipos

```graphql
type Customer {
  id: Int!
  name: String!
  email: String!
  phone: String!
  isPremium: Boolean!
  addresses: [Address!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Address {
  id: Int!
  customerId: Int!
  street: String!
  number: String!
  neighborhood: String!
  city: String!
  state: String!
  zipCode: String!
  complement: String
  latitude: Float
  longitude: Float
  isPrimary: Boolean!
  createdAt: DateTime!
}
```

## API gRPC

### Serviços Expostos

```protobuf
service CustomersService {
  // Buscar cliente por ID
  rpc FindOne (FindOneRequest) returns (Customer);
  
  // Buscar múltiplos clientes por IDs
  rpc FindManyByIds (FindManyRequest) returns (CustomersResponse);
  
  // Verificar se cliente é premium
  rpc IsPremium (FindOneRequest) returns (PremiumResponse);
}
```

### Casos de Uso

O serviço gRPC é usado por:
- **msorders**: Para buscar dados do cliente ao criar pedido
- **msdelivery**: Para obter endereço de entrega
- **msnotifications**: Para enviar notificações ao cliente

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db_customers"

# Server
PORT=3001
GRAPHQL_PATH=/graphql

# gRPC
GRPC_PORT=50051
```

### Instalação

```bash
# Instalar dependências
npm install

# Gerar cliente Prisma
npm run prisma:generate

# Executar migrações
npm run prisma:migrate

# Popular banco com dados iniciais
npm run prisma:seed
```

## Executando o Serviço

### Desenvolvimento

```bash
npm run start:dev
```

O serviço estará disponível em:
- GraphQL Playground: http://localhost:3001/graphql
- gRPC Server: localhost:50051

### Produção

```bash
npm run build
npm run start:prod
```

### Docker

```bash
docker build -t mscustomers .
docker run -p 3001:3001 -p 50051:50051 mscustomers
```

## Exemplos de Uso

### Criar Cliente via GraphQL

```graphql
mutation {
  createCustomer(input: {
    name: "João Silva"
    email: "joao@example.com"
    phone: "11999999999"
    isPremium: false
  }) {
    id
    name
    email
    isPremium
  }
}
```

### Adicionar Endereço

```graphql
mutation {
  addAddress(
    customerId: 1
    input: {
      street: "Rua das Flores"
      number: "123"
      neighborhood: "Centro"
      city: "São Paulo"
      state: "SP"
      zipCode: "01234-567"
      complement: "Apto 45"
      latitude: -23.5505
      longitude: -46.6333
      isPrimary: true
    }
  ) {
    id
    street
    isPrimary
  }
}
```

### Buscar Cliente e Endereços

```graphql
query {
  customer(id: 1) {
    id
    name
    email
    isPremium
    addresses {
      id
      street
      number
      city
      isPrimary
    }
  }
}
```

## Padrões de Projeto

### Repository Pattern
O `PrismaService` atua como repository, abstraindo o acesso ao banco de dados.

### Module Pattern
Código organizado em módulos coesos (CustomersModule, GrpcModule, PrismaModule).

### Dependency Injection
Todas as dependências são injetadas via constructor do NestJS.

### DTO Pattern
Validação de entrada usando DTOs com decorators class-validator.

## Regras de Negócio

1. **Email único**: Não pode haver dois clientes com o mesmo email
2. **Telefone único**: Não pode haver dois clientes com o mesmo telefone
3. **Endereço primário**: Cada cliente pode ter apenas um endereço primário
4. **Clientes premium**: Recebem benefícios em outros serviços (desconto em fretes, prioridade)
5. **Coordenadas**: Latitude e longitude são opcionais mas recomendadas para roteamento preciso

## Comunicação com Outros Serviços

### Consumidores da API gRPC

- **msorders**: 
  - Busca dados do cliente ao criar pedido
  - Verifica se é premium para aplicar descontos

- **msdelivery**:
  - Obtém endereço de entrega
  - Busca coordenadas para roteamento

- **msnotifications**:
  - Obtém dados de contato (email, telefone)
  - Envia notificações personalizadas

### Fluxo Típico

```
1. Cliente cria pedido no msorders
2. msorders chama gRPC do mscustomers
3. mscustomers retorna dados do cliente
4. msorders cria pedido com dados validados
```

## Testes

```bash
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

## Monitoramento

O serviço expõe logs estruturados para facilitar debug:

```typescript
this.logger.log('Customer created', { customerId: customer.id });
this.logger.error('Failed to create customer', error);
```

## Troubleshooting

### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Testar conexão
npm run prisma:studio
```

### Porta já em uso

```bash
# Verificar processo usando a porta
netstat -ano | findstr :3001

# Mudar porta no .env
PORT=3002
```

### Erro no gRPC

```bash
# Verificar se proto está compilado
ls -la node_modules/@grpc/proto-loader

# Regenerar tipos
npm run build
```
