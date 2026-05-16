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
export declare class MetricsService {
    private readonly logger;
    private redisOperations;
    private redisHits;
    private redisMisses;
    private redisTotalLatency;
    private redisOperationsByType;
    private rabbitMessagesPublished;
    private rabbitMessagesConsumed;
    private rabbitMessagesFailed;
    private rabbitTotalProcessingTime;
    private apiTotalRequests;
    private apiRequestsByEndpoint;
    recordRedisOperation(operation: 'get' | 'set' | 'del' | 'delPattern', latencyMs: number, hit?: boolean): void;
    getRedisMetrics(): RedisMetrics;
    recordMessagePublished(): void;
    recordMessageConsumed(processingTimeMs: number, success: boolean): void;
    getRabbitMQMetrics(): RabbitMQMetrics;
    recordApiRequest(endpoint: string): void;
    getApiMetrics(): ApiMetrics;
    getAllMetrics(): {
        redis: RedisMetrics;
        rabbitmq: RabbitMQMetrics;
        api: ApiMetrics;
        timestamp: string;
    };
    resetMetrics(): void;
    logSummary(): void;
}
