import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package: 'notifications',
            protoPath: join(__dirname, './grpc/notifications.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 50053}`,
        },
    });

    await app.startAllMicroservices();
    await app.listen(process.env.PORT ?? 3000);
    
    console.log(`HTTP Server running on port ${process.env.PORT ?? 3000}`);
    console.log(`GRPC Server running on port ${process.env.GRPC_PORT || 50053}`);
}
bootstrap();
