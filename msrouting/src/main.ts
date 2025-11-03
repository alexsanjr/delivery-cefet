// src/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'routing',
      protoPath: join(__dirname, 'shared/protos/routing.proto'),
      url: 'localhost:50055', // ← Mudar para 50055
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3003); // ← Mudar para 3003
  
  console.log('🗺️ MSRouting Service running');
  console.log('📡 gRPC: localhost:50055');
  console.log('🔮 GraphQL: http://localhost:3003/graphql');
}
bootstrap();