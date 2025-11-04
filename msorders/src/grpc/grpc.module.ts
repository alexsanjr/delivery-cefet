import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { CustomersClient } from './customers.client';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CUSTOMERS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'customers',
          protoPath: join(__dirname, 'customers.proto'),
          url: process.env.CUSTOMERS_GRPC_URL || 'localhost:50051',
        },
      },
    ]),
  ],
  providers: [CustomersClient],
  exports: [CustomersClient],
})
export class GrpcModule {}
