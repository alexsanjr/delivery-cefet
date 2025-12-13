import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { OrderItemResolver } from './order-item.resolver';
import { OrdersDatasource } from './orders.datasource';
import { PrismaService } from '../prisma/prisma.service';
import { BasicPriceCalculator } from './strategies/basic-price-calculator.strategy';
import { PremiumPriceCalculator } from './strategies/premium-price-calculator.strategy';
import { ExpressPriceCalculator } from './strategies/express-price-calculator.strategy';
import { PriceCalculatorContext } from './strategies/price-calculator.context';
import { GrpcModule } from '../grpc/grpc.module';
import { CustomersDataloaderService } from './customers-dataloader.service';
import { ConsumersModule } from '../infrastructure/consumers/consumers.module';

@Module({
  imports: [GrpcModule, ConsumersModule],
  providers: [
    OrdersResolver,
    OrderItemResolver,
    OrdersService,
    OrdersDatasource,
    PrismaService,
    BasicPriceCalculator,
    PremiumPriceCalculator,
    ExpressPriceCalculator,
    PriceCalculatorContext,
    CustomersDataloaderService,
  ],
  exports: [OrdersService, OrdersDatasource, CustomersDataloaderService],
})
export class OrdersModule {}
