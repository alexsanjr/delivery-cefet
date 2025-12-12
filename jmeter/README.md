# 🚀 Guia de Testes de Carga com JMeter - msOrders

## 📋 Visão Geral

Este plano de teste JMeter foi criado para avaliar a **escalabilidade** e **performance** do microsserviço **msOrders** com:
- ✅ RabbitMQ + Protobuf (mensageria assíncrona)
- ✅ DDD (Domain-Driven Design)
- ✅ PostgreSQL
- ✅ GraphQL API

## 🎯 Cenários de Teste

### 1. **Criar Pedidos** (Carga Pesada)
- **Threads**: 50 usuários simultâneos
- **Ramp-up**: 10 segundos
- **Duração**: 60 segundos
- **Operação**: Mutation `createOrder`
- **Objetivo**: Testar criação de pedidos com publicação no RabbitMQ

### 2. **Consultar Pedidos** (Carga Leve)
- **Threads**: 20 usuários simultâneos
- **Ramp-up**: 5 segundos
- **Duração**: 60 segundos
- **Operação**: Query `orders`
- **Objetivo**: Testar consultas de leitura

### 3. **Atualizar Status** (Carga Média)
- **Threads**: 30 usuários simultâneos
- **Ramp-up**: 8 segundos
- **Duração**: 60 segundos
- **Operação**: Mutation `updateOrderStatus`
- **Objetivo**: Testar atualizações com eventos de domínio

## 📊 Métricas Coletadas

- **Tempo de Resposta** (mínimo, médio, máximo, percentil 90/95/99)
- **Throughput** (requisições por segundo)
- **Taxa de Erro** (%)
- **Latência** (tempo de conexão)
- **Concorrência** (threads ativas)

## 🛠️ Como Executar

### 1. Baixar e Instalar JMeter

```bash
# Windows
# Baixe: https://jmeter.apache.org/download_jmeter.cgi
# Extraia e execute: bin/jmeter.bat

# Linux/Mac
wget https://downloads.apache.org/jmeter/binaries/apache-jmeter-5.6.3.tgz
tar -xzf apache-jmeter-5.6.3.tgz
cd apache-jmeter-5.6.3/bin
./jmeter
```

### 2. Subir o Docker Compose

```bash
cd kong-gateway
docker-compose up -d
```

### 3. Aguardar Serviços Ficarem Healthy

```bash
docker-compose ps
# Aguarde até msorders estar "healthy"
```

### 4. Executar o Teste

#### Modo GUI (Interface Gráfica)

```bash
# Windows
jmeter.bat -t /caminho/para/msorders-load-test.jmx

# Linux/Mac
./jmeter -t /caminho/para/msorders-load-test.jmx
```

#### Modo CLI (Linha de Comando - Recomendado para testes de carga)

```bash
# Windows
jmeter.bat -n -t msorders-load-test.jmx -l resultados/resultado-teste.jtl -e -o resultados/html-report

# Linux/Mac
./jmeter -n -t msorders-load-test.jmx -l resultados/resultado-teste.jtl -e -o resultados/html-report
```

**Parâmetros**:
- `-n`: Modo non-GUI (sem interface)
- `-t`: Arquivo do plano de teste
- `-l`: Arquivo de log dos resultados (.jtl)
- `-e`: Gerar relatório HTML
- `-o`: Diretório de saída do relatório HTML

### 5. Customizar Parâmetros

Você pode alterar as variáveis via linha de comando:

```bash
jmeter -n -t msorders-load-test.jmx \
  -JTHREADS=100 \
  -JRAMP_UP=20 \
  -JDURATION=120 \
  -JHOST=localhost \
  -JPORT=3001 \
  -l resultados/teste-100-users.jtl \
  -e -o resultados/html-report-100
```

## 📈 Interpretando Resultados

### Relatório HTML (Gerado Automaticamente)

Após executar em modo CLI, abra: `resultados/html-report/index.html`

**Métricas Importantes**:

1. **Response Time** (Tempo de Resposta)
   - ✅ Bom: < 500ms
   - ⚠️ Aceitável: 500ms - 2s
   - ❌ Ruim: > 2s

2. **Throughput** (Vazão)
   - Requisições processadas por segundo
   - Quanto maior, melhor

3. **Error Rate** (Taxa de Erro)
   - ✅ Ideal: 0%
   - ⚠️ Aceitável: < 1%
   - ❌ Crítico: > 5%

4. **Percentil 90/95/99**
   - 90% das requisições completam em X ms
   - 95% das requisições completam em Y ms
   - 99% das requisições completam em Z ms

### Exemplo de Resultados Esperados

```
Label                    Samples  Average  Median  90%  95%  99%   Min   Max    Error%  Throughput
Criar Pedido             3000     250ms    200ms   400  500  800   100   1200   0.5%    50/s
Consultar Pedidos        1200     150ms    120ms   250  300  450   50    800    0.0%    20/s
Atualizar Status         1800     180ms    150ms   300  380  600   80    900    0.2%    30/s
```

## 🔍 Analisando Performance do RabbitMQ

Durante o teste, você pode monitorar o RabbitMQ:

### 1. Acessar RabbitMQ Management UI

```
http://localhost:15672
Usuário: guest
Senha: guest
```

### 2. Verificar Métricas

- **Queues**: Veja `notifications.queue`
  - Message rate (mensagens/s)
  - Consumers
  - Messages (total em fila)
  
- **Connections**: Número de conexões ativas
- **Channels**: Canais de comunicação abertos

### 3. Logs do msOrders

```bash
docker logs -f kong-gateway-msorders-1 | grep -E "RabbitMQ|Protobuf|Published"
```

Você deve ver:
```
[RabbitMQService] 📤 Published message to orders.events with key order.created
[ProtobufService] ✅ Serialized message OrderCreatedEvent (size: 245 bytes)
```

## 📊 Cenários de Teste Avançados

### Teste de Stress (Encontrar Limites)

```bash
# Aumentar gradualmente até falhar
jmeter -n -t msorders-load-test.jmx \
  -JTHREADS=200 \
  -JRAMP_UP=30 \
  -JDURATION=180 \
  -l resultados/stress-test.jtl \
  -e -o resultados/stress-report
```

### Teste de Spike (Pico Repentino)

```bash
# Threads sobem rápido (simula Black Friday)
jmeter -n -t msorders-load-test.jmx \
  -JTHREADS=150 \
  -JRAMP_UP=5 \
  -JDURATION=60 \
  -l resultados/spike-test.jtl \
  -e -o resultados/spike-report
```

### Teste de Soak (Duração Prolongada)

```bash
# Executar por 1 hora para detectar memory leaks
jmeter -n -t msorders-load-test.jmx \
  -JTHREADS=50 \
  -JRAMP_UP=10 \
  -JDURATION=3600 \
  -l resultados/soak-test.jtl \
  -e -o resultados/soak-report
```

## 🐳 Monitorando Docker Durante Testes

### Ver Uso de Recursos

```bash
# CPU e Memória dos containers
docker stats

# Logs em tempo real
docker-compose logs -f msorders rabbitmq postgres-orders
```

### Métricas a Observar

1. **msorders**
   - CPU: Deve ficar < 80%
   - Memory: Observar memory leaks (uso crescente)
   
2. **rabbitmq**
   - Messages/s: Taxa de publicação
   - Queue depth: Não deve crescer indefinidamente
   
3. **postgres-orders**
   - Connections: Número de conexões ativas
   - CPU: Queries lentas causam CPU alto

## 🎯 Metas de Performance

### Para Produção

| Métrica | Meta | Crítico |
|---------|------|---------|
| Tempo Resposta Médio | < 300ms | > 1s |
| Percentil 95 | < 500ms | > 2s |
| Throughput | > 100 req/s | < 50 req/s |
| Taxa de Erro | < 0.5% | > 2% |
| CPU (msorders) | < 70% | > 90% |
| Memory (msorders) | Estável | Crescente |
| RabbitMQ Queue | < 100 msgs | > 1000 msgs |

## 🔧 Troubleshooting

### Problema: Alta Taxa de Erro

```bash
# Ver logs de erros
docker logs kong-gateway-msorders-1 | grep ERROR

# Verificar conexões com banco
docker exec kong-gateway-postgres-orders-1 psql -U orders -c "SELECT count(*) FROM pg_stat_activity;"
```

### Problema: Tempo de Resposta Alto

```bash
# Analisar queries lentas no PostgreSQL
docker exec kong-gateway-postgres-orders-1 psql -U orders -d orders -c "SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Ver se RabbitMQ está atrasado
curl -u guest:guest http://localhost:15672/api/queues
```

### Problema: Memory Leak

```bash
# Monitorar memória ao longo do tempo
watch -n 5 'docker stats --no-stream msorders'

# Se memória crescer constantemente, reiniciar:
docker-compose restart msorders
```

## 📝 Checklist Antes do Teste

- [ ] Docker Compose rodando (`docker-compose ps`)
- [ ] msorders está healthy
- [ ] RabbitMQ está healthy
- [ ] PostgreSQL está healthy
- [ ] Diretório `resultados/` criado
- [ ] JMeter instalado e funcionando
- [ ] Portas 3001 e 15672 acessíveis

## 🎓 Boas Práticas

1. **Sempre execute testes em modo CLI** para produção
2. **Comece com carga baixa** e aumente gradualmente
3. **Monitore recursos** (CPU, RAM, rede) durante testes
4. **Execute múltiplas vezes** para garantir consistência
5. **Limpe dados entre testes** se necessário
6. **Salve resultados** com nomes descritivos
7. **Compare resultados** antes/depois de otimizações

## 📚 Recursos Adicionais

- [JMeter Documentation](https://jmeter.apache.org/usermanual/)
- [Best Practices](https://jmeter.apache.org/usermanual/best-practices.html)
- [Performance Testing Guide](https://www.blazemeter.com/blog/performance-testing-guide)

## 🎉 Conclusão

Este plano de teste JMeter fornece uma base sólida para avaliar a escalabilidade do msOrders. Use os resultados para:

- ✅ Identificar gargalos de performance
- ✅ Validar capacidade de carga
- ✅ Verificar comportamento sob stress
- ✅ Comparar antes/depois de otimizações
- ✅ Documentar SLAs e SLOs

**Boa sorte com seus testes!** 🚀
