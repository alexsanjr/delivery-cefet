import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos que não estão no DTO
      forbidNonWhitelisted: true, // lança erro se vier campo extra
      transform: true, // transforma tipos automaticamente
    }),
  );

  // Configura o microservice gRPC para expor dados de pedidos
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'orders',
      protoPath: join(__dirname, './grpc/orders.proto'),
      url: '0.0.0.0:50052',
    },
  });

  await app.startAllMicroservices();
  console.log('gRPC Orders Server is running on: 0.0.0.0:50052');

  await app.listen(process.env.PORT ?? 3000);
  console.log('Application is running on: http://localhost:3000');
}

void bootstrap();
