# Testes de Carga com JMeter

Este diretório contém planos de teste para o JMeter.

## Pré-requisitos

- JMeter instalado e configurado no PATH (variável de ambiente).
- Aplicação rodando (Docker containers up).

## Executando o teste

### Microsserviço de Pedidos (msorders)

Para rodar o teste de carga do microsserviço de pedidos (`msorders`), execute o seguinte comando no terminal:

```bash
jmeter -n -f -t msorders-load-test.jmx -l results-orders.jtl -e -o report-orders
```

### Microsserviço de Clientes (mscustomers)

Para rodar o teste de carga do microsserviço de clientes (`mscustomers`), execute o seguinte comando no terminal:

```bash
jmeter -n -f -t mscustomers-load-test.jmx -l results-customers.jtl -e -o report-customers
```

### Microsserviço de Notificações (msnotifications)

Para rodar o teste de carga do microsserviço de notificações (`msnotifications`), execute o seguinte comando no terminal:

```bash
jmeter -n -f -t msnotifications-load-test.jmx -l results-notifications.jtl -e -o report-notifications
```

### Microsserviço de Rastreamento (mstracking)

Para rodar o teste de carga do microsserviço de rastreamento (`mstracking`), execute o seguinte comando no terminal:

```bash
jmeter -n -f -t mstracking-load-test.jmx -l results-tracking.jtl -e -o report-tracking
```

### Microsserviço de Roteamento (msrouting)

Para rodar o teste de carga do microsserviço de roteamento (`msrouting`), execute o seguinte comando no terminal:

```bash
jmeter -n -f -t msrouting-load-test.jmx -l results-routing.jtl -e -o report-routing
```

### Microsserviço de Entregas (msdelivery)

Para rodar o teste de carga do microsserviço de entregas (`msdelivery`), execute o seguinte comando no terminal:

```bash
jmeter -n -f -t msdelivery-load-test.jmx -l results-delivery.jtl -e -o report-delivery
```

### Teste de Integração (RabbitMQ)

Este teste verifica o fluxo assíncrono entre `msorders` e `msnotifications` via RabbitMQ.
Ele cria um pedido, atualiza o status e verifica se a notificação foi criada.

```bash
jmeter -n -f -t rabbitmq-integration-test.jmx -l results-rabbitmq.jtl
```

### Parâmetros:
- `-n`: Modo não-GUI (CLI mode).
- `-f`: Força a exclusão de arquivos de resultado existentes.
- `-t`: Arquivo do plano de teste (.jmx).
- `-l`: Arquivo de log de resultados (.jtl).
- `-e`: Gerar relatório HTML ao final.
- `-o`: Pasta de saída do relatório HTML.

## Visualizando Resultados

Após a execução, abra o arquivo `report/index.html` no seu navegador para ver os gráficos e estatísticas de performance.
