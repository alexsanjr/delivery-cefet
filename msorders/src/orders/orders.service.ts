import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateOrderInput } from './dto/create-order.input';
import { OrdersDatasource } from './orders.datasource';
import { UpdateOrderInput } from './dto/update-order.input';
import { OrderStatus, PaymentMethod } from 'generated/prisma';
import { IOrderValidator } from './interfaces/IOrderValidator.interface';
import { IPriceCalculator } from './interfaces/IPriceCalculator.interface';

@Injectable()
export class OrdersService implements IOrderValidator, IPriceCalculator {
  private readonly logger = new Logger(OrdersService.name);
  constructor(private readonly ordersDatasource: OrdersDatasource) {}

  async create(createOrderInput: CreateOrderInput) {
    this.logger.log(
      `Criando novo pedido para customer: ${createOrderInput.customerId}`,
    );

    try {
      this.validateCreateOrderInput(createOrderInput);

      // Cálculos de negócio
      const subtotal = this.calculateSubtotal();
      const deliveryFee = this.calculateDeliveryFee();
      const total = subtotal + deliveryFee;
      const estimatedDeliveryTime = this.calculateDeliveryTime();

      // Preparar dados para persistência
      const orderData = {
        ...createOrderInput,
        subtotal,
        deliveryFee,
        total,
        estimatedDeliveryTime,
        status: 'PENDING' as const,
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

  public calculateSubtotal(): number {
    // items?: any[]
    // Por enquanto valor fixo, mas aqui viria o cálculo real baseado nos items
    // TODO: implementar cálculo real quando tiver items
    return 100.0;
  }

  public calculateDeliveryFee(): number {
    // address?: any
    // Lógica de negócio para calcular taxa de entrega
    // TODO: implementar baseado na distância, valor do pedido, etc.
    return 5.0;
  }

  public calculateDeliveryTime(): number {
    // address?: any
    // Tempo estimado em minutos
    // TODO: implementar baseado na distância, horário, etc.
    return 30;
  }
}
