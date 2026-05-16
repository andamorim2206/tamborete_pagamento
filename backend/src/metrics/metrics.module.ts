import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';

/**
 * MÓDULO DE MÉTRICAS
 * 
 * @Global - Disponível em toda aplicação sem precisar importar
 * 
 * Exporta MetricsService para ser usado em:
 * - CacheService (logs de Redis)
 * - TransactionsProcessor (logs de RabbitMQ)
 * - Interceptors (logs de API)
 */
@Global()
@Module({
    providers: [MetricsService],
    controllers: [MetricsController],
    exports: [MetricsService],
})
export class MetricsModule { }
