import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  // Criar aplicação apenas como microserviço gRPC com múltiplos serviços
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: ['delivery', 'deliveryperson'],
      protoPath: [
        join(__dirname, '../proto/delivery.proto'),
        join(__dirname, '../proto/delivery-person.proto'),
      ],
      url: `0.0.0.0:${process.env.GRPC_PORT || 50053}`,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // forbidNonWhitelisted removido para permitir campos extras via gRPC
      transform: true,
    }),
  );

  await app.listen();
  console.log(`gRPC Delivery Server is running on: 0.0.0.0:${process.env.GRPC_PORT || 50053}`);
}

bootstrap();
