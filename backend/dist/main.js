"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const app_module_1 = require("./app.module");
const metrics_service_1 = require("./metrics/metrics.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors();
    const metricsService = app.get(metrics_service_1.MetricsService);
    app.use((req, res, next) => {
        if (!req.url.startsWith('/metrics')) {
            metricsService.recordApiRequest(`${req.method} ${req.url.split('?')[0]}`);
        }
        next();
    });
    app.connectMicroservice({
        transport: microservices_1.Transport.RMQ,
        options: {
            urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
            queue: 'transactions_queue',
            queueOptions: {
                durable: true,
            },
        },
    });
    await app.startAllMicroservices();
    await app.listen(process.env.PORT ?? 3000);
    console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
    console.log(`🐰 RabbitMQ Microservice is running on: ${process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'}`);
}
bootstrap();
//# sourceMappingURL=main.js.map