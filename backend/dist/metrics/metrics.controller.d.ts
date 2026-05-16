import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    getMetrics(): {
        redis: import("./metrics.service").RedisMetrics;
        rabbitmq: import("./metrics.service").RabbitMQMetrics;
        api: import("./metrics.service").ApiMetrics;
        timestamp: string;
    };
    getRedisMetrics(): {
        redis: import("./metrics.service").RedisMetrics;
        timestamp: string;
    };
    getRabbitMQMetrics(): {
        rabbitmq: import("./metrics.service").RabbitMQMetrics;
        timestamp: string;
    };
    getApiMetrics(): {
        api: import("./metrics.service").ApiMetrics;
        timestamp: string;
    };
    getSummary(): {
        redis: import("./metrics.service").RedisMetrics;
        rabbitmq: import("./metrics.service").RabbitMQMetrics;
        api: import("./metrics.service").ApiMetrics;
        timestamp: string;
    };
}
