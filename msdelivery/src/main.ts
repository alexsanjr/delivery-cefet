import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.API_GATEWAY_URL || 'http://localhost:8000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'deliveryperson',
      protoPath: join(__dirname, '../proto/delivery-person.proto'),
      url: `0.0.0.0:${process.env.GRPC_PORT || 50053}`,
    },
  });

  await app.startAllMicroservices();
  console.log(` gRPC server ${process.env.GRPC_PORT || 50053}`);

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(` HTTP/GraphQL http://localhost:${port}/graphql`);
  console.log(` WebSocket server ${process.env.WS_PORT || 3103}`);
}

bootstrap();
