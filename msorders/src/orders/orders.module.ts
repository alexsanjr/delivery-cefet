import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersDatasource } from './orders.datasource';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [OrdersResolver, OrdersService, OrdersDatasource, PrismaService],
})
export class OrdersModule {}
