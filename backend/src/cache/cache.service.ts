import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);
    private readonly redis: Redis;

    constructor() {
        this.redis = new Redis({
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

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redis.get(key);
            if (!value) return null;
            return JSON.parse(value);
        } catch (error) {
            this.logger.error(`Error getting key ${key}: ${error.message}`);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.redis.setex(key, ttlSeconds, serialized);
            } else {
                await this.redis.set(key, serialized);
            }
        } catch (error) {
            this.logger.error(`Error setting key ${key}: ${error.message}`);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            this.logger.error(`Error deleting key ${key}: ${error.message}`);
        }
    }

    async delPattern(pattern: string): Promise<void> {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                this.logger.log(`🗑️ Deleted ${keys.length} keys matching pattern: ${pattern}`);
            }
        } catch (error) {
            this.logger.error(`Error deleting pattern ${pattern}: ${error.message}`);
        }
    }

    // Idempotência: verificar se transação já foi processada
    async checkIdempotency(key: string): Promise<string | null> {
        return this.redis.get(key);
    }

    // Idempotência: marcar transação como processada
    async setIdempotency(key: string, transactionId: string, ttlSeconds: number = 300): Promise<void> {
        await this.redis.setex(key, ttlSeconds, transactionId);
        this.logger.log(`🔒 Idempotency key set: ${key} (TTL: ${ttlSeconds}s)`);
    }

    // Distributed Lock: tentar adquirir lock
    async acquireLock(key: string, ttlSeconds: number = 30): Promise<boolean> {
        try {
            const result = await this.redis.set(key, '1', 'EX', ttlSeconds, 'NX');
            return result === 'OK';
        } catch (error) {
            this.logger.error(`Error acquiring lock ${key}: ${error.message}`);
            return false;
        }
    }

    // Distributed Lock: liberar lock
    async releaseLock(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            this.logger.error(`Error releasing lock ${key}: ${error.message}`);
        }
    }

    // Verificar se lock existe
    async hasLock(key: string): Promise<boolean> {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        } catch (error) {
            this.logger.error(`Error checking lock ${key}: ${error.message}`);
            return false;
        }
    }

    async onModuleDestroy() {
        await this.redis.quit();
    }
}
