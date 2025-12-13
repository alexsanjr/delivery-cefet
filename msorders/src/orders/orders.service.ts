import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateOrderInput,
  PaymentMethod,
  OrderItemInput,
} from './dto/create-order.input';
import { OrdersDatasource } from './orders.datasource';
import { UpdateOrderInput } from './dto/update-order.input';
import { OrderStatus } from '../../generated/prisma';
import {
  IOrderValidator,
  PriceStrategy,
  OrderItem,
  OrderAddress,
  CustomerGrpcResponse,
} from './interfaces';
import { PriceCalculatorContext } from './strategies/price-calculator.context';
import { CustomersRabbitMQClient } from '../rabbitmq/customers-rabbitmq.client';
import { NotificationsClient } from '../grpc/notifications.client';
import { CustomersEventsConsumer } from '../infrastructure/consumers/customers-events.consumer';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService implements IOrderValidator {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersDatasource: OrdersDatasource,
    private readonly priceCalculatorContext: PriceCalculatorContext,
    private readonly customersRabbitMQClient: CustomersRabbitMQClient,
    private readonly notificationsClient: NotificationsClient,
    private readonly customersConsumer: CustomersEventsConsumer,
  ) {}

  async create(createOrderInput: CreateOrderInput) {
    this.logger.log(
      `Criando novo pedido para customer: ${createOrderInput.customerId}`,
    );

    try {
      this.validateCreateOrderInput(createOrderInput);

      if (!createOrderInput.customerId) {
        throw new BadRequestException('ID do cliente é obrigatório');
      }

      // Tenta buscar do cache primeiro (sincronizado via RabbitMQ)
      const customerData = await this.getCustomerData(
        createOrderInput.customerId,
      );

      // Determinar estratégia baseada no tipo de pedido ou cliente
      const strategy = this.determineStrategy(createOrderInput, customerData);

      this.logger.log(
        `Estratégia selecionada: ${strategy} | Cliente Premium: ${customerData.isPremium} | Pagamento: ${createOrderInput.paymentMethod}`,
      );

      // Cálculos de negócio usando Strategy Pattern
      const items = await this.mapOrderItems(createOrderInput.items);
      const address = this.mapOrderAddress();

      const subtotal = this.priceCalculatorContext.calculateSubtotal(
        strategy,
        items,
      );
      const deliveryFee = this.priceCalculatorContext.calculateDeliveryFee(
        strategy,
        address,
      );
      const total = subtotal + deliveryFee;
      const estimatedDeliveryTime =
        this.priceCalculatorContext.calculateDeliveryTime(strategy, address);

      const orderData = {
        ...createOrderInput,
        customerId: createOrderInput.customerId,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        subtotal,
        deliveryFee,
        total,
        estimatedDeliveryTime,
        status: OrderStatus.PENDING,
      };

      const createdOrder = await this.ordersDatasource.create(orderData);
      this.logger.log(`Pedido criado com sucesso: ID ${createdOrder.id}`);

      await this.connectClientToNotifications(
        createOrderInput.customerId,
        createdOrder.id,
      );

      return createdOrder;
    } catch (error) {
      this.logger.error(
        `Erro ao criar pedido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
    }
  }
  /**
   * Busca dados do cliente:
   * 1. Tenta do cache local (sincronizado via RabbitMQ eventos)
   * 2. Se não existir no cache, usa RabbitMQ Request-Reply
   */
  private async getCustomerData(
    customerId: number,
  ): Promise<{ name: string; phone: string; isPremium: boolean }> {
    // Tentar buscar do cache primeiro
    const cachedCustomer = this.customersConsumer.getCustomerFromCache(customerId);
    
    if (cachedCustomer) {
      this.logger.log(
        `✅ Cliente obtido do cache local: ${cachedCustomer.name}, isPremium: ${cachedCustomer.isPremium}`,
      );
      return {
        name: cachedCustomer.name,
        phone: cachedCustomer.phone,
        isPremium: cachedCustomer.isPremium,
      };
    }

    // Fallback para RabbitMQ Request-Reply se não estiver no cache
    this.logger.warn(
      `⚠️ Cliente ${customerId} não encontrado no cache, fazendo fallback para RabbitMQ Request-Reply`,
    );
    return this.getCustomerDataViaRabbitMQ(customerId);
  }

  private async getCustomerDataViaRabbitMQ(
    customerId: number,
  ): Promise<{ name: string; phone: string; isPremium: boolean }> {
    try {
      this.logger.log(`🔄 Buscando dados do cliente via RabbitMQ: ${customerId}`);

      const customer = await this.customersRabbitMQClient.getCustomer(customerId);

      if (customer.error) {
        throw new HttpException(
          `Erro ao buscar dados do cliente: ${customer.error}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        `📡 Dados do cliente obtidos via RabbitMQ: ${customer.name}, isPremium: ${customer.isPremium}`,
      );

      return {
        name: customer.name,
        phone: customer.phone,
        isPremium: customer.isPremium,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`❌ Erro na comunicação RabbitMQ: ${errorMessage}`);
      throw new HttpException(
        'Erro ao buscar dados do cliente',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async connectClientToNotifications(
    customerId: number,
    orderId: number,
  ): Promise<void> {
    try {
      const userId = `customer-${customerId}`;
      this.logger.log(
        `Conectando cliente ${userId} ao sistema de notificações (Order ID: ${orderId})`,
      );

      const result = await firstValueFrom(
        this.notificationsClient.connectClient(userId),
      );

      if (result.success) {
        this.logger.log(
          `Cliente ${userId} conectado com sucesso: ${result.message}`,
        );
      } else {
        this.logger.warn(
          `Falha ao conectar cliente ${userId}: ${result.message}`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.warn(
        `Erro ao conectar cliente ao sistema de notificações: ${errorMessage}`,
      );
    }
  }

  public validateCreateOrderInput(input: CreateOrderInput): void {
    if (!input) {
      throw new BadRequestException('Dados do pedido são obrigatórios');
    }

    if (!input.customerId || input.customerId <= 0) {
      throw new BadRequestException(
        'ID do cliente é obrigatório e deve ser maior que zero',
      );
    }

    if (!input.paymentMethod) {
      throw new BadRequestException('Método de pagamento é obrigatório');
    }

    const validPaymentMethods = Object.values(PaymentMethod);
    if (!validPaymentMethods.includes(input.paymentMethod)) {
      throw new BadRequestException(
        `Método de pagamento inválido: ${input.paymentMethod}`,
      );
    }
  }

  async findAll() {
    this.logger.log('Buscando todos os pedidos');

    try {
      const orders = await this.ordersDatasource.findAll();
      this.logger.log(`Encontrados ${orders.length} pedidos`);
      return orders;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
    }
  }

  async findById(id: number) {
    this.logger.log(`Buscando pedido com ID: ${id}`);

    if (!id || id <= 0) {
      throw new BadRequestException(
        'ID do pedido é obrigatório e deve ser maior que zero',
      );
    }

    try {
      const order = await this.ordersDatasource.findById(id);

      if (!order) {
        this.logger.warn(`Pedido não encontrado: ID ${id}`);
        throw new NotFoundException(`Pedido ${id} não encontrado`);
      }

      this.logger.log(`Pedido encontrado: ID ${id}`);
      return order;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Erro ao buscar pedido ${id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw new Error(`Erro interno ao buscar pedido ${id}`);
    }
  }

  async updateStatus(updateOrderInput: UpdateOrderInput) {
    this.logger.log(
      `Atualizando status do pedido: ID ${updateOrderInput.id} para ${updateOrderInput.status}`,
    );

    try {
      await this.validateUpdateOrderInput(updateOrderInput);

      await this.findById(updateOrderInput.id);

      const updatedOrder =
        await this.ordersDatasource.updateStatus(updateOrderInput);
      this.logger.log(
        `Status do pedido ${updateOrderInput.id} atualizado com sucesso para ${updateOrderInput.status}`,
      );

      return updatedOrder;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar pedido ${updateOrderInput.id}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
    }
  }

  public async validateUpdateOrderInput(
    input: UpdateOrderInput,
  ): Promise<void> {
    if (!input) {
      throw new BadRequestException('Dados de atualização são obrigatórios');
    }

    if (!input.id || input.id <= 0) {
      throw new BadRequestException(
        'ID do pedido é obrigatório e deve ser maior que zero',
      );
    }

    if (!input.status) {
      throw new BadRequestException('Status é obrigatório');
    }

    const validStatuses = Object.values(OrderStatus);
    if (!validStatuses.includes(input.status)) {
      throw new BadRequestException(`Status inválido: ${input.status}`);
    }

    await this.validateStatusTransition(input.id, input.status);
  }

  private async validateStatusTransition(
    orderId: number,
    newStatus: OrderStatus,
  ): Promise<void> {
    const currentOrder = await this.ordersDatasource.findById(orderId);
    if (!currentOrder) {
      throw new NotFoundException(`Pedido ${orderId} não encontrado`);
    }

    const currentStatus = currentOrder.status;

    if (currentStatus === newStatus) {
      return;
    }

    // PENDING → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → ARRIVING → DELIVERED
    // PENDING/CONFIRMED/PREPARING/OUT_FOR_DELIVERY → CANCELLED
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.OUT_FOR_DELIVERY]: [
        OrderStatus.ARRIVING,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.ARRIVING]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const allowedTransitions = validTransitions[currentStatus];

    if (!allowedTransitions.includes(newStatus)) {
      const allowedStatusList =
        allowedTransitions.length > 0
          ? allowedTransitions.join(', ')
          : 'nenhum (status final)';

      throw new BadRequestException(
        `Transição inválida: não é possível mudar de ${currentStatus} para ${newStatus}. ` +
          `Transições permitidas: ${allowedStatusList}`,
      );
    }

    this.logger.log(
      `Transição válida: ${currentStatus} -> ${newStatus} para pedido ${orderId}`,
    );
  }

  async findByCustomer(customerId: number) {
    this.logger.log(`Buscando pedidos do cliente: ${customerId}`);

    if (!customerId || customerId <= 0) {
      throw new BadRequestException(
        'ID do cliente é obrigatório e deve ser maior que zero',
      );
    }

    try {
      const orders = await this.ordersDatasource.findByCustomer(customerId);
      this.logger.log(
        `Encontrados ${orders.length} pedidos para o cliente ${customerId}`,
      );
      return orders;
    } catch (error) {
      this.logger.error(
        `Erro ao buscar pedidos do cliente ${customerId}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
    }
  }

  private determineStrategy(
    createOrderInput: CreateOrderInput,
    customerData: { isPremium: boolean },
  ): PriceStrategy {
    // Clientes Premium sempre usam estratégia PREMIUM (desconto e frete grátis)
    if (customerData.isPremium) {
      return PriceStrategy.PREMIUM;
    }

    // Pedidos com cartão de crédito (não-premium) usam EXPRESS (entrega rápida)
    if (createOrderInput.paymentMethod === PaymentMethod.CREDIT_CARD) {
      return PriceStrategy.EXPRESS;
    }

    // Estratégia padrão para outros casos (PIX, dinheiro, etc)
    return PriceStrategy.BASIC;
  }

  private async mapOrderItems(
    items?: OrderItemInput[],
  ): Promise<OrderItem[] | undefined> {
    if (!items || items.length === 0) {
      return undefined;
    }

    return Promise.all(
      items.map(async (item: OrderItemInput) => {
        // Busca o preço do produto
        const product = await this.ordersDatasource.findProductById(
          item.productId,
        );
        if (!product) {
          throw new Error(`Produto com ID ${item.productId} não encontrado`);
        }

        return {
          price: Number(product.price) || 0,
          quantity: Number(item.quantity) || 1,
        };
      }),
    );
  }

  private mapOrderAddress(): OrderAddress | undefined {
    // Se houver informações de endereço no input, mapear para OrderAddress
    // Por enquanto, retornando um endereço com distância padrão
    // No futuro poderia receber parâmetros de endereço para calcular distância real
    return {
      distance: 5, // km - valor padrão
    };
  }
}
