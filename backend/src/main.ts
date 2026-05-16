import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { MetricsService } from './metrics/metrics.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Habilitar CORS
  app.enableCors();

  // Middleware para registrar métricas de API
  const metricsService = app.get(MetricsService);
  app.use((req: any, res: any, next: any) => {
    // Registrar requisição (ignora rotas de métricas para evitar loop infinito)
    if (!req.url.startsWith('/metrics')) {
      metricsService.recordApiRequest(`${req.method} ${req.url.split('?')[0]}`);
    }
    next();
  });

  // Configurar RabbitMQ Microservice (para o Processor escutar a fila)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
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
