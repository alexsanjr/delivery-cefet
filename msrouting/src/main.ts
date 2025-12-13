import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { join } from 'path';
import { AppModule } from './app.module';
import { existsSync } from 'fs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting MSRouting service...');

  // Check if proto file exists
  const protoPath = join(process.cwd(), 'src/presentation/grpc/routing.proto');
  logger.log(`Checking proto file: ${protoPath}`);
  logger.log(`Proto exists: ${existsSync(protoPath)}`);

  if (!existsSync(protoPath)) {
    logger.error('Proto file not found!');
    process.exit(1);
  }

  logger.log('Creating HTTP application for GraphQL...');
  const httpPort = process.env.HTTP_PORT || 3000;
  const httpApp = await NestFactory.create(AppModule);
  
  httpApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  httpApp.enableCors({
    origin: '*',
    credentials: true,
  });

  logger.log('Creating gRPC microservice...');
  const grpcPort = process.env.GRPC_PORT || '50054';
  const grpcUrl = `0.0.0.0:${grpcPort}`;

  const grpcMicroservice = httpApp.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'routing.v1',
      protoPath: protoPath,
      url: grpcUrl,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  // Iniciar ambos os servidores
  logger.log('▶️  Starting all services...');
  await httpApp.startAllMicroservices();
  await httpApp.listen(httpPort);

  logger.log('=================================');
  logger.log('✅ MSRouting Service RUNNING');
  logger.log(`🌐 HTTP Server: http://localhost:${httpPort}`);
  logger.log(`🎮 GraphQL Playground: http://localhost:${httpPort}/graphql`);
  logger.log(`📡 gRPC Server: ${grpcUrl}`);
  logger.log('📦 Package: routing.v1');
  logger.log('=================================');
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
