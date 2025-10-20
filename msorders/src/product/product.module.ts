import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductResolver } from './product.resolver';
import { ProductDatasource } from './product.datasource';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [
    ProductResolver,
    ProductService,
    ProductDatasource,
    PrismaService,
  ],
})
export class ProductModule {}
