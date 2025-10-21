import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  CreateOrderInput,
  PaymentMethod,
  OrderItemInput,
} from './dto/create-order.input';
import { OrdersDatasource } from './orders.datasource';
import { UpdateOrderInput } from './dto/update-order.input';
import { OrderStatus } from 'generated/prisma';
import {
  IOrderValidator,
  PriceStrategy,
  OrderItem,
  OrderAddress,
} from './interfaces';
import { PriceCalculatorContext } from './strategies/price-calculator.context';

@Injectable()
export class OrdersService implements IOrderValidator {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersDatasource: OrdersDatasource,
    private readonly priceCalculatorContext: PriceCalculatorContext,
  ) {}

  async create(createOrderInput: CreateOrderInput) {
    this.logger.log(
      `Criando novo pedido para customer: ${createOrderInput.customerId}`,
    );

    try {
      this.validateCreateOrderInput(createOrderInput);

      // Determinar estratégia baseada no tipo de pedido ou cliente
      const strategy = this.determineStrategy(createOrderInput);

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

      // Preparar dados para persistência
      const orderData = {
        ...createOrderInput,
        customerId: createOrderInput.customerId || 1, // Default temporário
        subtotal,
        deliveryFee,
        total,
        estimatedDeliveryTime,
        status: OrderStatus.PENDING,
      };

      const createdOrder = await this.ordersDatasource.create(orderData);
      this.logger.log(`Pedido criado com sucesso: ID ${createdOrder.id}`);

      return createdOrder;
    } catch (error) {
      this.logger.error(
        `Erro ao criar pedido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      );
      throw error;
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

    // Validação defensiva
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

  // Métodos auxiliares para Strategy Pattern
  private determineStrategy(createOrderInput: CreateOrderInput): PriceStrategy {
    // Lógica para determinar qual estratégia usar
    // Pode ser baseada no tipo de cliente, valor do pedido, urgência, etc.

    // TODO: Implementar essa lógica verificando se cliente é premium
    const customerIdStr = String(createOrderInput.customerId);
    if (customerIdStr.includes('premium')) {
      return PriceStrategy.PREMIUM;
    }

    // Pedidos urgentes ou express são pagos com cartão de crédito
    if (createOrderInput.paymentMethod === PaymentMethod.CREDIT_CARD) {
      return PriceStrategy.EXPRESS;
    }

    // Estratégia padrão
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
