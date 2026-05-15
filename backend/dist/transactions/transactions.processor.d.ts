import { TransactionsRepository } from './transactions.repository';
import { CacheService } from '../cache/cache.service';
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
    private readonly logger;
    constructor(transactionsRepository: TransactionsRepository, cacheService: CacheService);
    handleTransactionCreated(data: TransactionCreatedEvent): Promise<void>;
    private simulateProcessing;
}
export {};
