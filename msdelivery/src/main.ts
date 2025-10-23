import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  const config = new DocumentBuilder()
    .setTitle('Delivery Persons API')
    .setDescription('API para gerenciamento de entregadores')
    .setVersion('1.0')
    .addTag('delivery-persons')
    .addServer(`http://localhost:${process.env.PORT || 3003}`, 'Local')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

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
  console.log(` Swagger http://localhost:${port}/api`);
}

bootstrap();
