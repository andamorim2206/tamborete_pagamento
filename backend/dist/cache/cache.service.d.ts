export declare class CacheService {
    private readonly logger;
    private readonly redis;
    constructor();
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
    checkIdempotency(key: string): Promise<string | null>;
    setIdempotency(key: string, transactionId: string, ttlSeconds?: number): Promise<void>;
    acquireLock(key: string, ttlSeconds?: number): Promise<boolean>;
    releaseLock(key: string): Promise<void>;
    hasLock(key: string): Promise<boolean>;
    onModuleDestroy(): Promise<void>;
}
