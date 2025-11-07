import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { existsSync } from 'fs';

async function bootstrap() {
  console.log('🚀 Starting MSRouting service...');

  // Verifique se o proto file existe
  const protoPath = join(process.cwd(), 'src/grpc/shared/protos/routing.proto');
  console.log('🔍 Checking proto file:', protoPath);
  console.log('📄 Proto exists:', existsSync(protoPath));

  if (!existsSync(protoPath)) {
    console.error('❌ Proto file not found!');
    process.exit(1);
  }

  console.log('📡 Creating gRPC microservice...');

  const grpcPort = process.env.GRPC_PORT || '50054';
  const grpcUrl = `0.0.0.0:${grpcPort}`;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
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
    },
  );

  console.log('▶️ Starting gRPC microservice...');
  await app.listen();

  console.log('=================================');
  console.log('✅ MSRouting Service RUNNING');
  console.log(`📡 gRPC Server: ${grpcUrl}`);
  console.log('📦 Package: routing.v1');
  console.log('=================================');
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
