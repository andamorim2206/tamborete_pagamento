"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = require("ioredis");
const metrics_service_1 = require("../metrics/metrics.service");
let CacheService = CacheService_1 = class CacheService {
    metricsService;
    logger = new common_1.Logger(CacheService_1.name);
    redis;
    constructor(metricsService) {
        this.metricsService = metricsService;
        this.redis = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });
        this.redis.on('connect', () => {
            this.logger.log('✅ Redis connected successfully');
        });
        this.redis.on('error', (error) => {
            this.logger.error(`❌ Redis connection error: ${error.message}`);
        });
    }
    async get(key) {
        const startTime = Date.now();
        try {
            const value = await this.redis.get(key);
            const latency = Date.now() - startTime;
            const hit = value !== null;
            this.metricsService.recordRedisOperation('get', latency, hit);
            if (!value)
                return null;
            return JSON.parse(value);
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.metricsService.recordRedisOperation('get', latency, false);
            this.logger.error(`Error getting key ${key}: ${error.message}`);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        const startTime = Date.now();
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.redis.setex(key, ttlSeconds, serialized);
            }
            else {
                await this.redis.set(key, serialized);
            }
            const latency = Date.now() - startTime;
            this.metricsService.recordRedisOperation('set', latency);
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.metricsService.recordRedisOperation('set', latency);
            this.logger.error(`Error setting key ${key}: ${error.message}`);
        }
    }
    async del(key) {
        const startTime = Date.now();
        try {
            await this.redis.del(key);
            const latency = Date.now() - startTime;
            this.metricsService.recordRedisOperation('del', latency);
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.metricsService.recordRedisOperation('del', latency);
            this.logger.error(`Error deleting key ${key}: ${error.message}`);
        }
    }
    async delPattern(pattern) {
        const startTime = Date.now();
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                this.logger.log(`🗑️ Deleted ${keys.length} keys matching pattern: ${pattern}`);
            }
            const latency = Date.now() - startTime;
            this.metricsService.recordRedisOperation('delPattern', latency);
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.metricsService.recordRedisOperation('delPattern', latency);
            this.logger.error(`Error deleting pattern ${pattern}: ${error.message}`);
        }
    }
    async checkIdempotency(key) {
        return this.redis.get(key);
    }
    async setIdempotency(key, transactionId, ttlSeconds = 300) {
        await this.redis.setex(key, ttlSeconds, transactionId);
        this.logger.log(`🔒 Idempotency key set: ${key} (TTL: ${ttlSeconds}s)`);
    }
    async acquireLock(key, ttlSeconds = 30) {
        try {
            const result = await this.redis.set(key, '1', 'EX', ttlSeconds, 'NX');
            return result === 'OK';
        }
        catch (error) {
            this.logger.error(`Error acquiring lock ${key}: ${error.message}`);
            return false;
        }
    }
    async releaseLock(key) {
        try {
            await this.redis.del(key);
        }
        catch (error) {
            this.logger.error(`Error releasing lock ${key}: ${error.message}`);
        }
    }
    async hasLock(key) {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            this.logger.error(`Error checking lock ${key}: ${error.message}`);
            return false;
        }
    }
    async onModuleDestroy() {
        await this.redis.quit();
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => metrics_service_1.MetricsService))),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService])
], CacheService);
//# sourceMappingURL=cache.service.js.map