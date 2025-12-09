import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.API_GATEWAY_URL || 'http://localhost:8000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const port = process.env.PORT || 3006;
  await app.listen(port);
  
  console.log('=================================');
  console.log('✅ BFF Delivery Service RUNNING');
  console.log(`🌐 HTTP Server: http://localhost:${port}`);
  console.log(`🎮 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log('📡 gRPC Client: Connected to msdelivery');
  console.log('=================================');
}

bootstrap();
