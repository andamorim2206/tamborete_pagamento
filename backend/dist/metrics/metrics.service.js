"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MetricsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
let MetricsService = MetricsService_1 = class MetricsService {
    logger = new common_1.Logger(MetricsService_1.name);
    redisOperations = 0;
    redisHits = 0;
    redisMisses = 0;
    redisTotalLatency = 0;
    redisOperationsByType = {
        get: 0,
        set: 0,
        del: 0,
        delPattern: 0,
    };
    rabbitMessagesPublished = 0;
    rabbitMessagesConsumed = 0;
    rabbitMessagesFailed = 0;
    rabbitTotalProcessingTime = 0;
    apiTotalRequests = 0;
    apiRequestsByEndpoint = {};
    recordRedisOperation(operation, latencyMs, hit) {
        this.redisOperations++;
        this.redisOperationsByType[operation]++;
        this.redisTotalLatency += latencyMs;
        if (operation === 'get') {
            if (hit === true) {
                this.redisHits++;
                this.logger.log(`🎯 Redis HIT - Latência: ${latencyMs.toFixed(2)}ms`);
            }
            else if (hit === false) {
                this.redisMisses++;
                this.logger.log(`❌ Redis MISS - Latência: ${latencyMs.toFixed(2)}ms`);
            }
        }
        else {
            this.logger.log(`📝 Redis ${operation.toUpperCase()} - Latência: ${latencyMs.toFixed(2)}ms`);
        }
    }
    getRedisMetrics() {
        const avgLatency = this.redisOperations > 0
            ? this.redisTotalLatency / this.redisOperations
            : 0;
        const totalCacheAttempts = this.redisHits + this.redisMisses;
        const hitRate = totalCacheAttempts > 0 ? (this.redisHits / totalCacheAttempts) * 100 : 0;
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
    recordMessagePublished() {
        this.rabbitMessagesPublished++;
        this.logger.log(`📤 RabbitMQ: Mensagem publicada (Total: ${this.rabbitMessagesPublished})`);
    }
    recordMessageConsumed(processingTimeMs, success) {
        this.rabbitMessagesConsumed++;
        this.rabbitTotalProcessingTime += processingTimeMs;
        if (success) {
            this.logger.log(`✅ RabbitMQ: Mensagem processada com sucesso em ${processingTimeMs.toFixed(2)}ms (Total: ${this.rabbitMessagesConsumed})`);
        }
        else {
            this.rabbitMessagesFailed++;
            this.logger.error(`❌ RabbitMQ: Falha ao processar mensagem após ${processingTimeMs.toFixed(2)}ms (Total falhas: ${this.rabbitMessagesFailed})`);
        }
    }
    getRabbitMQMetrics() {
        const avgProcessingTime = this.rabbitMessagesConsumed > 0
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
    recordApiRequest(endpoint) {
        this.apiTotalRequests++;
        this.apiRequestsByEndpoint[endpoint] =
            (this.apiRequestsByEndpoint[endpoint] || 0) + 1;
    }
    getApiMetrics() {
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
    resetMetrics() {
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
    logSummary() {
        const metrics = this.getAllMetrics();
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.log('📊 SUMÁRIO DE MÉTRICAS');
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.logger.log(`🔴 REDIS: ${metrics.redis.operations} operações | Hit Rate: ${metrics.redis.hitRate}% | Latência Média: ${metrics.redis.avgLatency}ms`);
        this.logger.log(`🐰 RABBITMQ: ${metrics.rabbitmq.messagesPublished} publicadas | ${metrics.rabbitmq.messagesConsumed} consumidas | Success Rate: ${metrics.rabbitmq.successRate}%`);
        this.logger.log(`🌐 API: ${metrics.api.totalRequests} requisições totais`);
        this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = MetricsService_1 = __decorate([
    (0, common_1.Injectable)()
], MetricsService);
//# sourceMappingURL=metrics.service.js.map