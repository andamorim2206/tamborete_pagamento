import { TransactionsRepository } from './transactions.repository';
import { CacheService } from '../cache/cache.service';
import { MetricsService } from '../metrics/metrics.service';
interface TransactionCreatedEvent {
    transactionId: string;
    senderId: string;
    receiverId: string;
    amount: number;
    paymentMethod: string;
}
export declare class TransactionsProcessor {
    private readonly transactionsRepository;
    private readonly cacheService;
    private readonly metricsService;
    private readonly logger;
    constructor(transactionsRepository: TransactionsRepository, cacheService: CacheService, metricsService: MetricsService);
    handleTransactionCreated(data: TransactionCreatedEvent): Promise<void>;
    private simulateProcessing;
}
export {};
