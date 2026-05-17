import { Injectable, Logger } from '@nestjs/common';

export interface RedisMetrics {
    operations: number;
    hits: number;
    misses: number;
    totalLatency: number;
    avgLatency: number;
    hitRate: number;
    operationsByType: {
        get: number;
        set: number;
        del: number;
        delPattern: number;
    };
}

export interface RabbitMQMetrics {
    messagesPublished: number;
    messagesConsumed: number;
    messagesFailed: number;
    totalProcessingTime: number;
    avgProcessingTime: number;
    successRate: number;
}

export interface ApiMetrics {
    totalRequests: number;
    requestsByEndpoint: Record<string, number>;
}

@Injectable()
export class MetricsService {
    private readonly logger = new Logger(MetricsService.name);

    private redisOperations = 0;
    private redisHits = 0;
    private redisMisses = 0;
    private redisTotalLatency = 0;
    private redisOperationsByType = {
        get: 0,
        set: 0,
        del: 0,
        delPattern: 0,
    };

    private rabbitMessagesPublished = 0;
    private rabbitMessagesConsumed = 0;
    private rabbitMessagesFailed = 0;
    private rabbitTotalProcessingTime = 0;

    private apiTotalRequests = 0;
    private apiRequestsByEndpoint: Record<string, number> = {};


    recordRedisOperation(
        operation: 'get' | 'set' | 'del' | 'delPattern',
        latencyMs: number,
        hit?: boolean,
    ): void {
        this.redisOperations++;
        this.redisOperationsByType[operation]++;
        this.redisTotalLatency += latencyMs;

        if (operation === 'get') {
            if (hit === true) {
                this.redisHits++;
                this.logger.log(
                    `🎯 Redis HIT - Latência: ${latencyMs.toFixed(2)}ms`,
                );
            } else if (hit === false) {
                this.redisMisses++;
                this.logger.log(
                    `❌ Redis MISS - Latência: ${latencyMs.toFixed(2)}ms`,
                );
            }
        } else {
            this.logger.log(
                `📝 Redis ${operation.toUpperCase()} - Latência: ${latencyMs.toFixed(2)}ms`,
            );
        }
    }

    getRedisMetrics(): RedisMetrics {
        const avgLatency =
            this.redisOperations > 0
                ? this.redisTotalLatency / this.redisOperations
                : 0;

        const totalCacheAttempts = this.redisHits + this.redisMisses;
        const hitRate =
            totalCacheAttempts > 0 ? (this.redisHits / totalCacheAttempts) * 100 : 0;

        return {
            operations: this.redisOperations,
            hits: this.redisHits,
            misses: this.redisMisses,
            totalLatency: this.redisTotalLatency,
            avgLatency: parseFloat(avgLatency.toFixed(2)),
            hitRate: parseFloat(hitRate.toFixed(2)),
            operationsByType: { ...this.redisOperationsByType },
        };
    }


    recordMessagePublished(): void {
        this.rabbitMessagesPublished++;
        this.logger.log(
            `📤 RabbitMQ: Mensagem publicada (Total: ${this.rabbitMessagesPublished})`,
        );
    }

    recordMessageConsumed(processingTimeMs: number, success: boolean): void {
        this.rabbitMessagesConsumed++;
        this.rabbitTotalProcessingTime += processingTimeMs;

        if (success) {
            this.logger.log(
                `✅ RabbitMQ: Mensagem processada com sucesso em ${processingTimeMs.toFixed(2)}ms (Total: ${this.rabbitMessagesConsumed})`,
            );
        } else {
            this.rabbitMessagesFailed++;
            this.logger.error(
                `❌ RabbitMQ: Falha ao processar mensagem após ${processingTimeMs.toFixed(2)}ms (Total falhas: ${this.rabbitMessagesFailed})`,
            );
        }
    }

    getRabbitMQMetrics(): RabbitMQMetrics {
        const avgProcessingTime =
            this.rabbitMessagesConsumed > 0
                ? this.rabbitTotalProcessingTime / this.rabbitMessagesConsumed
                : 0;

        const totalAttempts = this.rabbitMessagesConsumed;
        const successCount = totalAttempts - this.rabbitMessagesFailed;
        const successRate = totalAttempts > 0 ? (successCount / totalAttempts) * 100 : 0;

        return {
            messagesPublished: this.rabbitMessagesPublished,
            messagesConsumed: this.rabbitMessagesConsumed,
            messagesFailed: this.rabbitMessagesFailed,
            totalProcessingTime: this.rabbitTotalProcessingTime,
            avgProcessingTime: parseFloat(avgProcessingTime.toFixed(2)),
            successRate: parseFloat(successRate.toFixed(2)),
        };
    }


    recordApiRequest(endpoint: string): void {
        this.apiTotalRequests++;
        this.apiRequestsByEndpoint[endpoint] =
            (this.apiRequestsByEndpoint[endpoint] || 0) + 1;
    }

    getApiMetrics(): ApiMetrics {
        return {
            totalRequests: this.apiTotalRequests,
            requestsByEndpoint: { ...this.apiRequestsByEndpoint },
        };
    }

    getAllMetrics() {
        return {
            redis: this.getRedisMetrics(),
            rabbitmq: this.getRabbitMQMetrics(),
            api: this.getApiMetrics(),
            timestamp: new Date().toISOString(),
        };
    }


    resetMetrics(): void {
        this.redisOperations = 0;
        this.redisHits = 0;
        this.redisMisses = 0;
        this.redisTotalLatency = 0;
        this.redisOperationsByType = { get: 0, set: 0, del: 0, delPattern: 0 };

        this.rabbitMessagesPublished = 0;
        this.rabbitMessagesConsumed = 0;
        this.rabbitMessagesFailed = 0;
        this.rabbitTotalProcessingTime = 0;

        this.apiTotalRequests = 0;
        this.apiRequestsByEndpoint = {};

        this.logger.warn('🔄 Métricas resetadas');
    }


    logSummary(): void {
        const metrics = this.getAllMetrics();

        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.log('📊 SUMÁRIO DE MÉTRICAS');
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        this.logger.log(
            `🔴 REDIS: ${metrics.redis.operations} operações | Hit Rate: ${metrics.redis.hitRate}% | Latência Média: ${metrics.redis.avgLatency}ms`,
        );

        this.logger.log(
            `🐰 RABBITMQ: ${metrics.rabbitmq.messagesPublished} publicadas | ${metrics.rabbitmq.messagesConsumed} consumidas | Success Rate: ${metrics.rabbitmq.successRate}%`,
        );

        this.logger.log(
            `🌐 API: ${metrics.api.totalRequests} requisições totais`,
        );

        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
}
