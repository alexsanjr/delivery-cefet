import { Module } from '@nestjs/common';
import { PersistenceModule } from '../infrastructure/persistence/persistence.module';
import { AdaptersModule } from '../infrastructure/adapters/adapters.module';
import { DeliveryFeeCalculator } from '../domain/services/delivery-fee-calculator.service';
import { CreateOrderUseCase } from './use-cases/create-order/create-order.use-case';
import { UpdateOrderStatusUseCase } from './use-cases/update-order-status/update-order-status.use-case';
import { GetOrderUseCase } from './use-cases/get-order/get-order.use-case';
import { ListOrdersUseCase } from './use-cases/list-orders/list-orders.use-case';

@Module({
  imports: [PersistenceModule, AdaptersModule],
  providers: [
    DeliveryFeeCalculator,
    CreateOrderUseCase,
    UpdateOrderStatusUseCase,
    GetOrderUseCase,
    ListOrdersUseCase,
  ],
  exports: [
    CreateOrderUseCase,
    UpdateOrderStatusUseCase,
    GetOrderUseCase,
    ListOrdersUseCase,
  ],
})
export class ApplicationModule {}