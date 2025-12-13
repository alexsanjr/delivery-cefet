import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { join } from 'path';
import { Logger } from '@nestjs/common';

async function bootstrap() {
    const logger = new Logger('Bootstrap');
    const app = await NestFactory.create(AppModule);

    app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.GRPC,
        options: {
            package: 'notifications',
            protoPath: join(__dirname, './presentation/grpc/notifications.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 50053}`,
        },
    });

    await app.startAllMicroservices();
    await app.listen(process.env.PORT ?? 3000);
    
    logger.log(`HTTP Server running on port ${process.env.PORT ?? 3000}`);
    logger.log(`GRPC Server running on port ${process.env.GRPC_PORT || 50053}`);
}
bootstrap();
