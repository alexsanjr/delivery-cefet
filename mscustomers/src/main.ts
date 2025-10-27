import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'customers',
      protoPath: join(__dirname, 'grpc/customers.proto'),
      url: '0.0.0.0:50051',
    },
  });

  await app.startAllMicroservices();

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000'); //TODO: VER ROTA
  console.log('📡 mscustomers gRPC: localhost:50051');
}
bootstrap();
