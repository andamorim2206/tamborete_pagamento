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

    /**
     * GET /metrics
     * Retorna métricas de Redis, RabbitMQ e API
     */
    @Get()
    getMetrics() {
        return this.metricsService.getAllMetrics();
    }

    /**
     * GET /metrics/redis
     * Retorna apenas métricas do Redis
     */
    @Get('redis')
    getRedisMetrics() {
        return {
            redis: this.metricsService.getRedisMetrics(),
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * GET /metrics/rabbitmq
     * Retorna apenas métricas do RabbitMQ
     */
    @Get('rabbitmq')
    getRabbitMQMetrics() {
        return {
            rabbitmq: this.metricsService.getRabbitMQMetrics(),
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * GET /metrics/api
     * Retorna apenas métricas da API
     */
    @Get('api')
    getApiMetrics() {
        return {
            api: this.metricsService.getApiMetrics(),
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * GET /metrics/summary
     * Log detalhado no console + retorna métricas
     */
    @Get('summary')
    getSummary() {
        this.metricsService.logSummary();
        return this.metricsService.getAllMetrics();
    }
}
