"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.API_GATEWAY_URL || 'http://localhost:8000',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
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
//# sourceMappingURL=main.js.map