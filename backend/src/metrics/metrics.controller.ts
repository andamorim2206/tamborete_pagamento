import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';

/**
 * ENDPOINT DE MÉTRICAS
 * 
 * GET /metrics - Retorna todas as métricas coletadas
 * 
 * Útil para:
 * - Monitoramento em tempo real
 * - Dashboards (Grafana, etc)
 * - Alertas automatizados
 * - Debugging de performance
 */
@Controller('metrics')
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) { }

    @Get()
    getMetrics() {
        return this.metricsService.getAllMetrics();
    }

    @Get('redis')
    getRedisMetrics() {
        return {
            redis: this.metricsService.getRedisMetrics(),
            timestamp: new Date().toISOString(),
        };
    }


    @Get('rabbitmq')
    getRabbitMQMetrics() {
        return {
            rabbitmq: this.metricsService.getRabbitMQMetrics(),
            timestamp: new Date().toISOString(),
        };
    }

 
    @Get('api')
    getApiMetrics() {
        return {
            api: this.metricsService.getApiMetrics(),
            timestamp: new Date().toISOString(),
        };
    }

    @Get('summary')
    getSummary() {
        this.metricsService.logSummary();
        return this.metricsService.getAllMetrics();
    }
}
