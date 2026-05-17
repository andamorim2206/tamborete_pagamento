import { TransactionsRepository } from './transactions.repository';
import { UsersRepository } from '../users/users.repository';
import { CacheService } from '../cache/cache.service';
import { MetricsService } from '../metrics/metrics.service';
import { LogsService } from '../logs/logs.service';
interface TransactionCreatedEvent {
    transactionId: string;
    senderId: string;
    receiverId: string;
    amount: number;
    paymentMethod: string;
}
export declare class TransactionsProcessor {
    private readonly transactionsRepository;
    private readonly usersRepository;
    private readonly cacheService;
    private readonly metricsService;
    private readonly logsService;
    private readonly logger;
    constructor(transactionsRepository: TransactionsRepository, usersRepository: UsersRepository, cacheService: CacheService, metricsService: MetricsService, logsService: LogsService);
    handleTransactionCreated(data: TransactionCreatedEvent): Promise<void>;
    private simulateProcessing;
}
export {};
