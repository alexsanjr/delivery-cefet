import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'tracking',
      protoPath: join(__dirname, './grpc/tracking.proto'),
      url: `0.0.0.0:${process.env.GRPC_PORT || 50055}`,
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3005);
  
  console.log(`MSTracking HTTP/GraphQL running on port ${process.env.PORT ?? 3005}`);
  console.log(`MSTracking gRPC running on port ${process.env.GRPC_PORT || 50055}`);
}
bootstrap();
