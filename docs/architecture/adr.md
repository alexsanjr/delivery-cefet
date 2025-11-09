# Decisões Arquiteturais

Aqui estão documentadas as principais decisões técnicas que tomamos durante o desenvolvimento do projeto. 

## 1. Arquitetura de Microserviços (Obrigatório)

O projeto foi especificado para ser desenvolvido em microserviços. Dividimos o sistema em 6 serviços independentes:
- mscustomers (clientes)
- msorders (pedidos)
- msdelivery (entregas)
- msnotifications (notificações)
- msrouting (roteamento)
- mstracking (rastreamento)

**Por que faz sentido para este projeto:**
- Cada domínio (clientes, pedidos, entregas) tem suas próprias regras de negócio
- Serviços críticos como tracking podem escalar independentemente se necessário
- Falhas ficam isoladas (se notificações caírem, o resto continua funcionando)
- Facilita organizar o trabalho da equipe em paralelo

---

## 2. TypeScript (Obrigatório)

TypeScript foi definido como a linguagem do projeto.

**Por que faz sentido para este projeto:**
- Tipagem estática ajuda muito a evitar bugs durante o desenvolvimento
- Autocomplete da IDE funciona perfeitamente
- Facilita refatoração do código com segurança
- Integração perfeita com NestJS

---

## 3. GraphQL (Obrigatório)

GraphQL foi definido como a API para clientes externos (web/mobile).

**Por que faz sentido para este projeto:**
- Cliente pode pedir só os dados que precisa (evita over-fetching)
- Schema auto-documentado facilita o desenvolvimento
- Apollo Playground ajuda muito nos testes
- Uma única query pode buscar dados de vários serviços

---

## 4. gRPC (Obrigatório)

gRPC foi definido para comunicação entre os microserviços.

**Por que faz sentido para este projeto:**
- Muito mais rápido que REST (usa Protocol Buffers binário)
- Tipagem forte através dos arquivos .proto
- Gera código automaticamente para os clientes
- Ideal para comunicação servidor-servidor

---

## 5. API Gateway (Obrigatório)

API Gateway foi definido como ponto de entrada único. Escolhemos Kong Gateway.

**Por que faz sentido para este projeto:**
- Centraliza autenticação JWT em um lugar só
- Rate limiting protege os serviços
- CORS configurado uma única vez
- Cliente só precisa conhecer um endpoint

**Desafio:** Adiciona latência extra, mas os benefícios compensam.

---

## 6. Prisma como ORM

Precisávamos de alguma forma de acessar o banco PostgreSQL. Pesquisamos algumas opções e decidimos usar Prisma na maioria dos serviços.

**Por que Prisma:**
- Os tipos do TypeScript funcionam perfeitamente
- As migrações são automáticas e funcionam bem
- O Prisma Studio ajuda muito a visualizar os dados
- A integração com NestJS é muito boa
- O schema é bem mais legível que decorators

**Outras opções:**
- TypeORM: mais antigo e popular, mas os tipos dão muito problema
- Sequelize: API muito verbosa e tipos ruins em TypeScript

**Onde usamos:**
- mscustomers (Prisma)
- msorders (Prisma)
- msdelivery (Prisma)
- mstracking (Prisma)
- msnotifications (TypeORM - decisão anterior, mantivemos)
- msrouting (só Redis, sem banco SQL)

---

## 7. Um Banco para Cada Serviço

Essa foi uma decisão importante: ao invés de ter um banco compartilhado, cada microserviço tem seu próprio banco PostgreSQL.

**Por que fizemos assim:**
- Cada serviço é realmente independente
- Se um banco cair, não derruba todo o sistema
- Podemos escalar os bancos separadamente
- Seguindo os princípios de microserviços que estudamos

---

## 8. Strategy Pattern para Cálculos

Estudamos vários design patterns e percebemos que precisávamos de algo para lidar com múltiplos algoritmos de cálculo. O Strategy Pattern foi uma ótima solução.

**Onde usamos:**

1. **Cálculo de Preços (msorders):**
   - Preço básico
   - Preço premium (com desconto)
   - Preço expresso (mais caro, mais rápido)

2. **Cálculo de Rotas (msrouting):**
   - Rota mais rápida
   - Rota mais curta
   - Rota econômica
   - Rota eco-friendly

**Por que funcionou:**
- Fácil adicionar novos tipos de cálculo
- Cada estratégia é testável sozinha
- Código fica mais limpo e organizado
- Cliente escolhe qual estratégia usar

---

## 9. Redis para Cache

Percebemos que algumas operações eram muito pesadas:
- Calcular rotas chamando API externa toda hora
- Buscar notificações repetidamente

A solução foi usar Redis como cache. É super rápido porque guarda tudo em memória.

**Como usamos:**
- **msrouting**: Salva rotas calculadas por 1 hora (pra não chamar a API de mapas o tempo todo)
- **msnotifications**: Guarda notificações recentes por 7 dias

**Benefícios:**
- Sistema ficou bem mais rápido
- Economiza chamadas a APIs externas
- Cache compartilhado se subir várias instâncias

---

## 10. NestJS como Framework

Precisávamos escolher um framework Node.js. Poderíamos usar Express puro, mas queríamos algo mais estruturado.

**Por que NestJS:**
- Tem estrutura de módulos que organiza bem o código
- Dependency Injection facilita muito os testes
- Suporte excelente para GraphQL e gRPC (que já íamos usar)
- Documentação muito boa
- É inspirado no Angular, então quem conhece já entende a estrutura

---

## 11. DataLoader para Resolver o Problema N+1

Esse foi um problema que só descobrimos depois que implementamos o GraphQL. Quando buscávamos uma lista de pedidos, o sistema fazia uma chamada gRPC para cada pedido buscar o cliente. Muito ineficiente!

**O problema:**
```
Busca 10 pedidos
Cada pedido precisa buscar o cliente via gRPC
= 10 chamadas gRPC (sendo que alguns clientes se repetem!)
```

**A solução (DataLoader):**
```
Busca 10 pedidos
DataLoader agrupa as buscas de clientes
= 1 chamada gRPC buscando todos os clientes únicos de uma vez
```

É um pattern bem conhecido na comunidade GraphQL. Além de agrupar requisições, também faz cache durante a mesma requisição (se buscar o mesmo cliente duas vezes, usa o cache).

---

