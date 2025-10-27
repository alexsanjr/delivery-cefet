import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersDatasource } from './orders.datasource';
import { PrismaService } from '../prisma/prisma.service';
import { BasicPriceCalculator } from './strategies/basic-price-calculator.strategy';
import { PremiumPriceCalculator } from './strategies/premium-price-calculator.strategy';
import { ExpressPriceCalculator } from './strategies/express-price-calculator.strategy';
import { PriceCalculatorContext } from './strategies/price-calculator.context';
import { GrpcModule } from 'src/grpc/grpc.module';

@Module({
  imports: [GrpcModule],
  providers: [
    OrdersResolver,
    OrdersService,
    OrdersDatasource,
    PrismaService,
    BasicPriceCalculator,
    PremiumPriceCalculator,
    ExpressPriceCalculator,
    PriceCalculatorContext,
  ],
})
export class OrdersModule {}
