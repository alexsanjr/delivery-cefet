import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'customers',
      protoPath: join(__dirname, 'presentation/grpc/proto/customers.proto'),
      url: '0.0.0.0:50051',
    },
  });

  await app.startAllMicroservices();

  await app.listen(3000);
  logger.log('Application is running on: http://localhost:3000');
  logger.log('mscustomers gRPC is running on: localhost:50051');
}
bootstrap();
