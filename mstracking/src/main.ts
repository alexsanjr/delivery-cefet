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
            package: 'tracking',
            protoPath: join(__dirname, './presentation/grpc/tracking.proto'),
            url: `0.0.0.0:${process.env.GRPC_PORT || 50055}`,
        },
    });

    await app.startAllMicroservices();
    await app.listen(process.env.PORT ?? 3005);

    logger.log(`HTTP Server running on port ${process.env.PORT ?? 3005}`);
    logger.log(`GRPC Server running on port ${process.env.GRPC_PORT || 50055}`);
}
bootstrap();
